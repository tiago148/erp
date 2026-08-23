import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { AddQuotationItemDto } from './dto/add-quotation-item.dto';
import { AddQuotationProposalDto } from './dto/add-quotation-proposal.dto';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      project: true,
      items: {
        include: {
          material: true,
          proposals: {
            include: { supplier: true },
            orderBy: { unitCost: 'asc' as const },
          },
        },
      },
    };
  }

  private async generateNumber() {
    const count = await this.prisma.client.quotation.count();
    return 'COT-' + String(count + 1).padStart(4, '0');
  }

  async create(dto: CreateQuotationDto) {
    const number = await this.generateNumber();
    return this.prisma.client.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          number,
          description: dto.description,
          projectId: dto.projectId,
          quotedAt: dto.quotedAt ? new Date(dto.quotedAt) : undefined,
          items: {
            create: dto.items.map((item) => ({
              materialId: item.materialId,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Propostas enviadas junto na criacao (fluxo "tudo em uma tela", igual ao
      // protótipo): cria cada proposta e marca automaticamente a mais barata
      // como vencedora do item — o usuario ainda pode trocar depois em "Gerenciar".
      for (let i = 0; i < dto.items.length; i++) {
        const proposals = (dto.items[i].proposals ?? []).filter(
          (p) => p.unitCost > 0,
        );
        if (proposals.length === 0) continue;
        const item = quotation.items[i];
        const created = await Promise.all(
          proposals.map((p) =>
            tx.quotationProposal.create({
              data: {
                quotationItemId: item.id,
                supplierId: p.supplierId,
                unitCost: p.unitCost,
                leadTimeDays: p.leadTimeDays,
                notes: p.notes,
              },
            }),
          ),
        );
        const cheapest = created.reduce((a, b) =>
          b.unitCost < a.unitCost ? b : a,
        );
        await tx.quotationProposal.update({
          where: { id: cheapest.id },
          data: { isWinner: true },
        });
      }

      return tx.quotation.findUniqueOrThrow({
        where: { id: quotation.id },
        include: this.include(),
      });
    });
  }

  findAll(search?: string) {
    return this.prisma.client.quotation.findMany({
      where: search
        ? { number: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quotation = await this.prisma.client.quotation.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!quotation) throw new NotFoundException('Cotacao nao encontrada.');
    return quotation;
  }

  private async assertOpen(id: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'OPEN') {
      throw new BadRequestException('Esta cotacao ja foi fechada.');
    }
    return quotation;
  }

  async addItem(quotationId: string, dto: AddQuotationItemDto) {
    await this.assertOpen(quotationId);
    const material = await this.prisma.client.material.findUnique({
      where: { id: dto.materialId },
    });
    if (!material) throw new NotFoundException('Material nao encontrado.');

    await this.prisma.client.quotationItem.create({
      data: { quotationId, materialId: dto.materialId, quantity: dto.quantity },
    });
    return this.findOne(quotationId);
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.client.quotationItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item nao encontrado.');
    await this.assertOpen(item.quotationId);

    await this.prisma.client.quotationItem.delete({ where: { id: itemId } });
    return this.findOne(item.quotationId);
  }

  async addProposal(itemId: string, dto: AddQuotationProposalDto) {
    const item = await this.prisma.client.quotationItem.findUnique({
      where: { id: itemId },
    });
    if (!item) throw new NotFoundException('Item nao encontrado.');
    await this.assertOpen(item.quotationId);

    const supplier = await this.prisma.client.supplier.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Fornecedor nao encontrado.');

    await this.prisma.client.quotationProposal.create({
      data: {
        quotationItemId: itemId,
        supplierId: dto.supplierId,
        unitCost: dto.unitCost,
        leadTimeDays: dto.leadTimeDays,
        notes: dto.notes,
      },
    });
    return this.findOne(item.quotationId);
  }

  async selectWinner(proposalId: string) {
    const proposal = await this.prisma.client.quotationProposal.findUnique({
      where: { id: proposalId },
      include: { quotationItem: true },
    });
    if (!proposal) throw new NotFoundException('Proposta nao encontrada.');
    await this.assertOpen(proposal.quotationItem.quotationId);

    await this.prisma.client.quotationProposal.updateMany({
      where: { quotationItemId: proposal.quotationItemId },
      data: { isWinner: false },
    });
    await this.prisma.client.quotationProposal.update({
      where: { id: proposalId },
      data: { isWinner: true },
    });

    return this.findOne(proposal.quotationItem.quotationId);
  }

  async generateOrders(quotationId: string) {
    const quotation = await this.assertOpen(quotationId);

    const winningByItem = quotation.items.map((item) => ({
      item,
      winner: item.proposals.find((p) => p.isWinner),
    }));

    const withWinner = winningByItem.filter((x) => x.winner);
    if (withWinner.length === 0) {
      throw new BadRequestException('Nenhum item tem um vencedor selecionado.');
    }

    const bySupplier = new Map<string, typeof withWinner>();
    for (const entry of withWinner) {
      const supplierId = entry.winner!.supplierId;
      if (!bySupplier.has(supplierId)) bySupplier.set(supplierId, []);
      bySupplier.get(supplierId)!.push(entry);
    }

    const orders: any[] = [];
    let nextNumber = (await this.prisma.client.purchaseOrder.count()) + 1;
    for (const [supplierId, entries] of bySupplier) {
      const number = 'PC-' + String(nextNumber).padStart(4, '0');
      nextNumber += 1;
      const order = await this.prisma.client.purchaseOrder.create({
        data: {
          number,
          supplierId,
          notes: `Gerado a partir da cotacao ${quotation.number}`,
          destinationProjectId: quotation.projectId,
          items: {
            create: entries.map(({ item, winner }) => ({
              materialId: item.materialId,
              quantity: item.quantity,
              unitCost: winner!.unitCost,
            })),
          },
        },
        include: { supplier: true, items: { include: { material: true } } },
      });
      orders.push(order);
    }

    await this.prisma.client.quotation.update({
      where: { id: quotationId },
      data: { status: 'CLOSED' },
    });

    const skipped = winningByItem
      .filter((x) => !x.winner)
      .map((x) => x.item.material.name);

    return { orders, skippedItems: skipped };
  }

  async remove(id: string) {
    const quotation = await this.findOne(id);
    if (quotation.status !== 'OPEN') {
      throw new BadRequestException(
        'So e possivel excluir cotacoes ainda abertas.',
      );
    }
    return this.prisma.client.quotation.delete({ where: { id } });
  }
}

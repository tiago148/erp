import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeNextOccurrenceDate } from '../common/recurrence';
import { CreateFinanceEntryDto } from './dto/create-finance-entry.dto';
import { UpdateFinanceEntryDto } from './dto/update-finance-entry.dto';
import { PayFinanceEntryDto } from './dto/pay-finance-entry.dto';

interface FindAllQuery {
  type?: string;
  status?: string;
  projectId?: string;
  categoryId?: string;
  search?: string;
}

@Injectable()
export class FinanceEntriesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      category: true,
      project: true,
      supplier: true,
      client: true,
      purchaseOrder: true,
      budget: true,
    };
  }

  private async assertCategoryMatchesType(categoryId: string, type: string) {
    const category = await this.prisma.client.financeCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category)
      throw new NotFoundException('Categoria financeira nao encontrada.');
    if (category.type !== type) {
      throw new BadRequestException(
        'A categoria selecionada nao e compativel com o tipo do lancamento.',
      );
    }
  }

  async create(dto: CreateFinanceEntryDto) {
    await this.assertCategoryMatchesType(dto.categoryId, dto.type);

    return this.prisma.client.financeEntry.create({
      data: {
        type: dto.type,
        description: dto.description,
        categoryId: dto.categoryId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        recurrence: dto.recurrence,
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        clientId: dto.clientId,
        purchaseOrderId: dto.purchaseOrderId,
        budgetId: dto.budgetId,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  findAll(query: FindAllQuery = {}) {
    const { type, status, projectId, categoryId, search } = query;
    return this.prisma.client.financeEntry.findMany({
      where: {
        type: type ? (type as any) : undefined,
        status: status ? (status as any) : undefined,
        projectId: projectId || undefined,
        categoryId: categoryId || undefined,
        description: search
          ? { contains: search, mode: 'insensitive' }
          : undefined,
      },
      include: this.include(),
      orderBy: { dueDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.client.financeEntry.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!entry)
      throw new NotFoundException('Lancamento financeiro nao encontrado.');
    return entry;
  }

  async update(id: string, dto: UpdateFinanceEntryDto) {
    const entry = await this.findOne(id);

    const changingFinancials =
      (dto.amount !== undefined && dto.amount !== Number(entry.amount)) ||
      (dto.dueDate !== undefined &&
        new Date(dto.dueDate).getTime() !==
          new Date(entry.dueDate).getTime()) ||
      (dto.type !== undefined &&
        (dto.type as string) !== (entry.type as string));

    if (entry.status !== 'PENDING' && changingFinancials) {
      throw new BadRequestException(
        'Nao e possivel alterar valor, vencimento ou tipo de um lancamento ja pago ou cancelado. Descricao, categoria, vinculos e observacoes ainda podem ser corrigidos.',
      );
    }

    const type = dto.type ?? entry.type;
    const categoryId = dto.categoryId ?? entry.categoryId;
    if (dto.type || dto.categoryId) {
      await this.assertCategoryMatchesType(categoryId, type);
    }

    return this.prisma.client.financeEntry.update({
      where: { id },
      data: {
        type: dto.type,
        description: dto.description,
        categoryId: dto.categoryId,
        amount: dto.amount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        recurrence: dto.recurrence,
        projectId: dto.projectId,
        supplierId: dto.supplierId,
        clientId: dto.clientId,
        purchaseOrderId: dto.purchaseOrderId,
        budgetId: dto.budgetId,
        notes: dto.notes,
      },
      include: this.include(),
    });
  }

  async pay(id: string, dto: PayFinanceEntryDto) {
    const entry = await this.findOne(id);
    if (entry.status !== 'PENDING') {
      throw new BadRequestException('Este lancamento ja foi processado.');
    }

    const paid = await this.prisma.client.financeEntry.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        paidAmount: dto.paidAmount ?? entry.amount,
      },
      include: this.include(),
    });

    // Lancamento recorrente: ao ser pago, gera automaticamente a proxima
    // ocorrencia (mesma descricao/categoria/valor, vencimento avancado pela
    // frequencia configurada) para que contas fixas nao precisem ser
    // recriadas manualmente todo mes.
    if ((entry.recurrence as string) !== 'NONE') {
      const nextDueDate = computeNextOccurrenceDate(
        entry.dueDate,
        entry.recurrence,
      );
      if (nextDueDate) {
        await this.prisma.client.financeEntry.create({
          data: {
            type: entry.type,
            description: entry.description,
            categoryId: entry.categoryId,
            amount: entry.amount,
            dueDate: nextDueDate,
            recurrence: entry.recurrence,
            recurrenceOf: entry.id,
            projectId: entry.projectId,
            supplierId: entry.supplierId,
            clientId: entry.clientId,
            notes: entry.notes,
          },
        });
      }
    }

    return paid;
  }

  async cancel(id: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'PENDING') {
      throw new BadRequestException('Este lancamento ja foi processado.');
    }

    return this.prisma.client.financeEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.include(),
    });
  }

  async remove(id: string) {
    const entry = await this.findOne(id);
    if (entry.status !== 'PENDING') {
      throw new BadRequestException(
        'So e possivel excluir lancamentos pendentes.',
      );
    }
    return this.prisma.client.financeEntry.delete({ where: { id } });
  }
}

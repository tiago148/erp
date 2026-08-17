import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getOrCreateCategory } from '../common/finance';
import { CreateScrapSaleDto } from './dto/create-scrap-sale.dto';

@Injectable()
export class ScrapSalesService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      surplus: { include: { material: true, project: true } },
      financeEntry: true,
    };
  }

  // Venda de sucata registra um fato ja consumado (o material ja foi vendido
  // e entregue), entao o lancamento financeiro gerado nasce como PAGO/RECEBIDO
  // — diferente do faturamento de projeto, que ainda esta a receber.
  async create(dto: CreateScrapSaleDto) {
    let surplus: any = null;

    if (dto.surplusId) {
      surplus = await this.prisma.client.materialSurplus.findUnique({
        where: { id: dto.surplusId },
        include: { project: true },
      });
      if (!surplus) throw new NotFoundException('Sobra nao encontrada.');
      if (surplus.status !== 'PENDING') {
        throw new BadRequestException('Esta sobra ja foi resolvida.');
      }
    }

    const saleDate = dto.saleDate ? new Date(dto.saleDate) : new Date();
    const category = await getOrCreateCategory(
      this.prisma,
      'Venda de Sucata',
      'INCOME',
    );
    const financeEntry = await this.prisma.client.financeEntry.create({
      data: {
        type: 'INCOME',
        description: `Venda de sucata - ${dto.description}`,
        categoryId: category.id,
        amount: dto.totalValue,
        dueDate: saleDate,
        status: 'PAID',
        paidAt: saleDate,
        paidAmount: dto.totalValue,
        projectId: surplus?.projectId,
      },
    });

    const sale = await this.prisma.client.scrapSale.create({
      data: {
        surplusId: dto.surplusId,
        description: dto.description,
        weightKg: dto.weightKg,
        pricePerKg: dto.pricePerKg,
        totalValue: dto.totalValue,
        buyerName: dto.buyerName,
        saleDate,
        financeEntryId: financeEntry.id,
        notes: dto.notes,
      },
      include: this.include(),
    });

    if (surplus) {
      await this.prisma.client.materialSurplus.update({
        where: { id: surplus.id },
        data: { status: 'SOLD_AS_SCRAP', resolvedAt: new Date() },
      });
    }

    return sale;
  }

  findAll() {
    return this.prisma.client.scrapSale.findMany({
      include: this.include(),
      orderBy: { saleDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const sale = await this.prisma.client.scrapSale.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!sale) throw new NotFoundException('Venda de sucata nao encontrada.');
    return sale;
  }
}

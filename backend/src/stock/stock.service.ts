import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import {
  resolveAbcClasses,
  effectiveAbcClass,
  computeReorderPoint,
  monthlyConsumptionFromHistory,
} from '../common/abc-classification';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  private include() {
    return {
      material: true,
      movements: { include: { project: true }, orderBy: { movedAt: 'desc' as const } },
    };
  }

  /** Consumo (saidas) das ultimas `months` casas, em quantidade e em valor. */
  private consumption(
    movements: { type: string; quantity: unknown; movedAt: Date }[],
    unitCost: number,
    months: number,
  ) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const outs = movements.filter((m) => m.type === 'OUT' && m.movedAt >= since);
    const qty = outs.reduce((a, m) => a + Number(m.quantity), 0);
    return { qty, value: qty * unitCost };
  }

  private decorate(items: any[]) {
    const abcInput = items.map((i) => ({
      id: i.id,
      consumptionValue12m: this.consumption(i.movements, Number(i.material.unitCost), 12).value,
    }));
    const auto = resolveAbcClasses(abcInput);
    return items.map((i) => {
      const cons6m = this.consumption(i.movements, Number(i.material.unitCost), 6);
      const monthlyConsumptionResolved =
        i.monthlyConsumption != null
          ? Number(i.monthlyConsumption)
          : monthlyConsumptionFromHistory([cons6m.qty]);
      return {
        ...i,
        abcResolved: effectiveAbcClass(i.abcClass, auto[i.id]),
        monthlyConsumptionResolved,
        reorderPointComputed: computeReorderPoint(
          monthlyConsumptionResolved,
          i.leadTimeDays,
          Number(i.serviceLevelZ),
        ),
      };
    });
  }

  private async persistedReorderPoint(monthlyConsumption: number | null | undefined, leadTimeDays: number | undefined, serviceLevelZ: number | undefined, movements: any[], unitCost: number) {
    const monthly =
      monthlyConsumption != null
        ? monthlyConsumption
        : monthlyConsumptionFromHistory([this.consumption(movements, unitCost, 6).qty]);
    return computeReorderPoint(monthly, leadTimeDays ?? 7, serviceLevelZ ?? 1.65);
  }

  async create(dto: CreateStockItemDto) {
    const existing = await this.prisma.client.stockItem.findUnique({ where: { materialId: dto.materialId } });
    if (existing) throw new ConflictException('Este material ja possui um item de estoque.');

    const material = await this.prisma.client.material.findUnique({ where: { id: dto.materialId } });
    if (!material) throw new NotFoundException('Material nao encontrado.');

    const reorderPoint = await this.persistedReorderPoint(
      dto.monthlyConsumption ?? null,
      dto.leadTimeDays,
      dto.serviceLevelZ,
      [],
      Number(material.unitCost),
    );

    const created = await this.prisma.client.stockItem.create({
      data: { ...dto, reorderPoint },
      include: this.include(),
    });
    return this.decorate([created])[0];
  }

  async findAll(search?: string) {
    const items = await this.prisma.client.stockItem.findMany({
      where: search
        ? { material: { name: { contains: search, mode: 'insensitive' } } }
        : undefined,
      include: this.include(),
      orderBy: { material: { name: 'asc' } },
    });
    return this.decorate(items);
  }

  async findOne(id: string) {
    const item = await this.prisma.client.stockItem.findUnique({ where: { id }, include: this.include() });
    if (!item) throw new NotFoundException('Item de estoque nao encontrado.');
    return this.decorate([item])[0];
  }

  async update(id: string, dto: UpdateStockItemDto) {
    const current = await this.prisma.client.stockItem.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!current) throw new NotFoundException('Item de estoque nao encontrado.');

    const reorderPoint = await this.persistedReorderPoint(
      dto.monthlyConsumption !== undefined ? dto.monthlyConsumption : (current.monthlyConsumption != null ? Number(current.monthlyConsumption) : null),
      dto.leadTimeDays ?? current.leadTimeDays,
      dto.serviceLevelZ ?? Number(current.serviceLevelZ),
      current.movements,
      Number(current.material.unitCost),
    );

    const updated = await this.prisma.client.stockItem.update({
      where: { id },
      data: { ...dto, reorderPoint },
      include: this.include(),
    });
    return this.decorate([updated])[0];
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.stockItem.delete({ where: { id } });
  }

  async addMovement(stockItemId: string, dto: CreateStockMovementDto) {
    const item = await this.prisma.client.stockItem.findUnique({ where: { id: stockItemId }, include: this.include() });
    if (!item) throw new NotFoundException('Item de estoque nao encontrado.');

    if (dto.type === 'OUT' && Number(item.quantity) < dto.quantity) {
      throw new BadRequestException('Quantidade insuficiente em estoque.');
    }

    await this.prisma.client.stockMovement.create({
      data: {
        stockItemId,
        type: dto.type,
        quantity: dto.quantity,
        projectId: dto.projectId,
        notes: dto.notes,
      },
    });

    const newQuantity =
      dto.type === 'IN' ? Number(item.quantity) + dto.quantity : Number(item.quantity) - dto.quantity;

    const updated = await this.prisma.client.stockItem.update({
      where: { id: stockItemId },
      data: { quantity: newQuantity },
      include: this.include(),
    });
    return this.decorate([updated])[0];
  }
}

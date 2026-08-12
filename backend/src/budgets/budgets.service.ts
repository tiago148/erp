import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

const TAX_TABLE: Record<string, { name: string; rate: number }[]> = {
  SIMPLES: [
    { name: 'ISS', rate: 2 },
    { name: 'COFINS', rate: 1.5 },
    { name: 'PIS', rate: 0.5 },
    { name: 'CPP', rate: 2 },
  ],
  LUCRO_PRESUMIDO: [
    { name: 'IRPJ', rate: 4.8 },
    { name: 'CSLL', rate: 2.88 },
    { name: 'PIS', rate: 0.65 },
    { name: 'COFINS', rate: 3 },
    { name: 'ISS', rate: 2 },
  ],
  LUCRO_REAL: [
    { name: 'IRPJ', rate: 7.2 },
    { name: 'CSLL', rate: 2.16 },
    { name: 'PIS', rate: 1.65 },
    { name: 'COFINS', rate: 7.6 },
    { name: 'ISS', rate: 2 },
  ],
  MEI: [],
};

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateTotals(budget: any) {
    const materialsTotal = budget.materialItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity) * Number(item.unitCost),
      0,
    );

    const laborTotal = budget.laborItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.hours) * Number(item.hourlyRate),
      0,
    );

    const travelTotal = budget.travelItems.reduce((sum: number, item: any) => {
      const consumption = Number(item.vehicle.avgConsumption);
      const liters = (Number(item.distanceKm) * 2 * item.trips) / consumption;
      return sum + liters * Number(item.fuelPrice);
    }, 0);

    const otherTotal = budget.otherItems.reduce(
      (sum: number, item: any) => sum + Number(item.amount),
      0,
    );

    const subtotal = materialsTotal + laborTotal + travelTotal + otherTotal;
    const bdiPct = Number(budget.bdiPct);
    const bdiValue = subtotal * (bdiPct / 100);
    const base = subtotal + bdiValue;

    const taxes = (TAX_TABLE[budget.regime] || []).map((tax) => ({
      name: tax.name,
      rate: tax.rate,
      value: round2(base * (tax.rate / 100)),
    }));
    const taxTotal = taxes.reduce((sum, tax) => sum + tax.value, 0);

    const discountPct = Number(budget.discountPct);
    const discountValue = (base + taxTotal) * (discountPct / 100);
    const total = base + taxTotal - discountValue;

    const estimatedCost = subtotal;
    const estimatedMargin = total - estimatedCost;
    const estimatedMarginPct = total > 0 ? (estimatedMargin / total) * 100 : 0;

    return {
      materialsTotal: round2(materialsTotal),
      laborTotal: round2(laborTotal),
      travelTotal: round2(travelTotal),
      otherTotal: round2(otherTotal),
      subtotal: round2(subtotal),
      bdiValue: round2(bdiValue),
      base: round2(base),
      taxes,
      taxTotal: round2(taxTotal),
      discountValue: round2(discountValue),
      total: round2(total),
      estimatedCost: round2(estimatedCost),
      estimatedMargin: round2(estimatedMargin),
      estimatedMarginPct: round2(estimatedMarginPct),
    };
  }

  private include() {
    return {
      client: true,
      employee: true,
      materialItems: { include: { material: true } },
      laborItems: { include: { laborRole: true } },
      travelItems: { include: { vehicle: true } },
      otherItems: true,
    };
  }

  private async generateNumber() {
    const count = await this.prisma.client.budget.count();
    return String(count + 1).padStart(4, '0');
  }

  async create(dto: CreateBudgetDto) {
    const number = await this.generateNumber();

    const materialItemsData = await Promise.all(
      (dto.materialItems || []).map(async (item) => {
        const material = await this.prisma.client.material.findUnique({
          where: { id: item.materialId },
        });
        if (!material)
          throw new NotFoundException(
            'Material nao encontrado: ' + item.materialId,
          );
        return {
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: material.unitCost,
        };
      }),
    );

    const laborItemsData = await Promise.all(
      (dto.laborItems || []).map(async (item) => {
        const role = await this.prisma.client.laborRole.findUnique({
          where: { id: item.laborRoleId },
        });
        if (!role)
          throw new NotFoundException(
            'Funcao nao encontrada: ' + item.laborRoleId,
          );
        const effectiveRate = round2(
          Number(role.hourlyRate) * (1 + Number(role.chargesPct) / 100),
        );
        return {
          laborRoleId: item.laborRoleId,
          hours: item.hours,
          hourlyRate: effectiveRate,
        };
      }),
    );

    const travelItemsData = (dto.travelItems || []).map((item) => ({
      vehicleId: item.vehicleId,
      distanceKm: item.distanceKm,
      trips: item.trips,
      fuelPrice: item.fuelPrice,
    }));

    const otherItemsData = (dto.otherItems || []).map((item) => ({
      description: item.description,
      amount: item.amount,
    }));

    const budget = await this.prisma.client.budget.create({
      data: {
        number,
        clientId: dto.clientId,
        description: dto.description,
        status: dto.status,
        regime: dto.regime,
        bdiPct: dto.bdiPct,
        discountPct: dto.discountPct,
        notes: dto.notes,
        employeeId: dto.employeeId,
        materialItems: { create: materialItemsData },
        laborItems: { create: laborItemsData },
        travelItems: { create: travelItemsData },
        otherItems: { create: otherItemsData },
      },
      include: this.include(),
    });

    return { ...budget, totals: this.calculateTotals(budget) };
  }

  async findAll(search?: string) {
    const budgets = await this.prisma.client.budget.findMany({
      where: search
        ? {
            OR: [
              { number: { contains: search, mode: 'insensitive' } },
              { client: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: this.include(),
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((budget) => ({
      ...budget,
      totals: this.calculateTotals(budget),
    }));
  }

  async findOne(id: string) {
    const budget = await this.prisma.client.budget.findUnique({
      where: { id },
      include: this.include(),
    });

    if (!budget) {
      throw new NotFoundException('Orcamento nao encontrado.');
    }

    return { ...budget, totals: this.calculateTotals(budget) };
  }

  async update(id: string, dto: UpdateBudgetDto) {
    await this.findOne(id);

    const updateData: any = {
      description: dto.description,
      status: dto.status,
      regime: dto.regime,
      bdiPct: dto.bdiPct,
      discountPct: dto.discountPct,
      notes: dto.notes,
      employeeId: dto.employeeId,
    };

    if (dto.clientId) updateData.clientId = dto.clientId;

    if (dto.materialItems) {
      const materialItemsData = await Promise.all(
        dto.materialItems.map(async (item) => {
          const material = await this.prisma.client.material.findUnique({
            where: { id: item.materialId },
          });
          if (!material)
            throw new NotFoundException(
              'Material nao encontrado: ' + item.materialId,
            );
          return {
            materialId: item.materialId,
            quantity: item.quantity,
            unitCost: material.unitCost,
          };
        }),
      );
      await this.prisma.client.budgetMaterialItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.materialItems = { create: materialItemsData };
    }

    if (dto.laborItems) {
      const laborItemsData = await Promise.all(
        dto.laborItems.map(async (item) => {
          const role = await this.prisma.client.laborRole.findUnique({
            where: { id: item.laborRoleId },
          });
          if (!role)
            throw new NotFoundException(
              'Funcao nao encontrada: ' + item.laborRoleId,
            );
          const effectiveRate = round2(
            Number(role.hourlyRate) * (1 + Number(role.chargesPct) / 100),
          );
          return {
            laborRoleId: item.laborRoleId,
            hours: item.hours,
            hourlyRate: effectiveRate,
          };
        }),
      );
      await this.prisma.client.budgetLaborItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.laborItems = { create: laborItemsData };
    }

    if (dto.travelItems) {
      await this.prisma.client.budgetTravelItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.travelItems = {
        create: dto.travelItems.map((item) => ({
          vehicleId: item.vehicleId,
          distanceKm: item.distanceKm,
          trips: item.trips,
          fuelPrice: item.fuelPrice,
        })),
      };
    }

    if (dto.otherItems) {
      await this.prisma.client.budgetOtherItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.otherItems = {
        create: dto.otherItems.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
      };
    }

    const budget = await this.prisma.client.budget.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });

    return { ...budget, totals: this.calculateTotals(budget) };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.budget.delete({ where: { id } });
  }
}

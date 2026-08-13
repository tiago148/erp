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

interface OverheadContext {
  method: string;
  totalFixed: number;
  funcCount: number;
  hoursPerMonth: number;
  occupancyPct: number;
  workDaysPerMonth: number;
  avgDirectCost: number;
}

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOverheadContext(): Promise<OverheadContext | null> {
    const settings = await this.prisma.client.settings.findFirst();
    if (!settings || !settings.overheadAutoApply) return null;

    const fixedExpenses = await this.prisma.client.fixedExpense.findMany();
    const totalFixed = fixedExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );

    return {
      method: settings.overheadMethod,
      totalFixed,
      funcCount: settings.overheadFuncCount ?? 5,
      hoursPerMonth: settings.overheadHoursPerMonth ?? 176,
      occupancyPct: Number(settings.overheadOccupancyPct),
      workDaysPerMonth: settings.overheadWorkDaysPerMonth ?? 22,
      avgDirectCost: settings.overheadAvgDirectCost
        ? Number(settings.overheadAvgDirectCost)
        : 0,
    };
  }

  private calculateIndirectCost(
    overheadCtx: OverheadContext | null,
    directCost: number,
    laborHours: number,
    projectDays: number,
  ) {
    if (!overheadCtx || overheadCtx.totalFixed <= 0) return 0;
    const occupancy = overheadCtx.occupancyPct / 100;

    if (overheadCtx.method === 'DAY') {
      const productiveDays = overheadCtx.workDaysPerMonth * occupancy;
      const ratePerDay =
        productiveDays > 0 ? overheadCtx.totalFixed / productiveDays : 0;
      return ratePerDay * projectDays;
    }
    if (overheadCtx.method === 'HOUR') {
      const productiveHours =
        overheadCtx.funcCount * overheadCtx.hoursPerMonth * occupancy;
      const ratePerHour =
        productiveHours > 0 ? overheadCtx.totalFixed / productiveHours : 0;
      return ratePerHour * laborHours;
    }
    const pct =
      overheadCtx.avgDirectCost > 0
        ? (overheadCtx.totalFixed / overheadCtx.avgDirectCost) * 100
        : 0;
    return directCost * (pct / 100);
  }

  private calculateTotals(
    budget: any,
    overheadCtx: OverheadContext | null = null,
  ) {
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
    const laborHours = budget.laborItems.reduce(
      (sum: number, item: any) => sum + Number(item.hours),
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
    const projectDays = Number(budget.projectDays || 0);
    const indirectCostValue = this.calculateIndirectCost(
      overheadCtx,
      subtotal,
      laborHours,
      projectDays,
    );
    const costWithIndirect = subtotal + indirectCostValue;

    const bdiPct = Number(budget.bdiPct);
    const bdiValue = costWithIndirect * (bdiPct / 100);
    const base = costWithIndirect + bdiValue;

    const taxes = (TAX_TABLE[budget.regime] || []).map((tax) => ({
      name: tax.name,
      rate: tax.rate,
      value: round2(base * (tax.rate / 100)),
    }));
    const taxTotal = taxes.reduce((sum, tax) => sum + tax.value, 0);

    const discountPct = Number(budget.discountPct);
    const discountValue = (base + taxTotal) * (discountPct / 100);
    const total = base + taxTotal - discountValue;

    const estimatedCost = costWithIndirect;
    const estimatedMargin = total - estimatedCost;
    const estimatedMarginPct = total > 0 ? (estimatedMargin / total) * 100 : 0;

    return {
      materialsTotal: round2(materialsTotal),
      laborTotal: round2(laborTotal),
      travelTotal: round2(travelTotal),
      otherTotal: round2(otherTotal),
      subtotal: round2(subtotal),
      indirectCostValue: round2(indirectCostValue),
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
        projectDays: dto.projectDays,
        materialItems: { create: materialItemsData },
        laborItems: { create: laborItemsData },
        travelItems: { create: travelItemsData },
        otherItems: { create: otherItemsData },
      },
      include: this.include(),
    });

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
  }

  async findAll(search?: string) {
    const [budgets, overheadCtx] = await Promise.all([
      this.prisma.client.budget.findMany({
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
      }),
      this.getOverheadContext(),
    ]);

    return budgets.map((budget) => ({
      ...budget,
      totals: this.calculateTotals(budget, overheadCtx),
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

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
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
      projectDays: dto.projectDays,
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

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.budget.delete({ where: { id } });
  }
}

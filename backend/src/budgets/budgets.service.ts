import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { calculateCompositionUnitCost } from '../common/cost-composition';
import { calculateLaborRoleEffectiveRate } from '../common/labor-rate';
import { calculateMaterialReferencePrice } from '../common/material-price';
import { calculateAssetMonthlyCost } from '../common/asset-depreciation';
import { AuditService, Actor } from '../audit/audit.service';
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
  simultaneousProjects: number;
}

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async getSalarioMinimo() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.salarioMinimo) : 1518;
  }

  private async getMaterialReferenceUnitCost(materialId: string) {
    const material = await this.prisma.client.material.findUnique({
      where: { id: materialId },
      include: { quotes: true },
    });
    if (!material)
      throw new NotFoundException('Material nao encontrado: ' + materialId);

    const { referencePrice } = calculateMaterialReferencePrice(
      {
        unitCost: Number(material.unitCost),
        referenceMode: material.referenceMode,
        manualQuoteId: material.manualQuoteId,
      },
      material.quotes.map((q) => ({
        id: q.id,
        price: Number(q.price),
        quantity: Number(q.quantity),
        freight: Number(q.freight),
        freightModality: q.freightModality,
        validUntil: q.validUntil,
      })),
    );
    return referencePrice;
  }

  private async resolveServiceItems(
    items: { thirdPartyServiceId: string; quantity: number }[],
  ) {
    return Promise.all(
      items.map(async (item) => {
        const service = await this.prisma.client.thirdPartyService.findUnique(
          { where: { id: item.thirdPartyServiceId } },
        );
        if (!service)
          throw new NotFoundException(
            'Servico de terceiro nao encontrado: ' + item.thirdPartyServiceId,
          );
        return {
          thirdPartyServiceId: item.thirdPartyServiceId,
          quantity: item.quantity,
          unitPrice: round2(Number(service.unitPrice)),
        };
      }),
    );
  }

  private async resolveRentalItems(
    items: { rentalEquipmentId: string; period: number }[],
  ) {
    return Promise.all(
      items.map(async (item) => {
        const equipment = await this.prisma.client.rentalEquipment.findUnique(
          { where: { id: item.rentalEquipmentId } },
        );
        if (!equipment)
          throw new NotFoundException(
            'Equipamento de aluguel nao encontrado: ' +
              item.rentalEquipmentId,
          );
        return {
          rentalEquipmentId: item.rentalEquipmentId,
          period: item.period,
          unitPrice: round2(Number(equipment.unitPrice)),
          mobilizationCost: round2(Number(equipment.mobilizationCost)),
        };
      }),
    );
  }

  private async getOverheadContext(): Promise<OverheadContext | null> {
    const settings = await this.prisma.client.settings.findFirst();
    if (!settings || !settings.overheadAutoApply) return null;

    const [fixedExpenses, assets] = await Promise.all([
      this.prisma.client.fixedExpense.findMany(),
      this.prisma.client.asset.findMany(),
    ]);
    const fixedExpensesTotal = fixedExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
    );
    // Depreciação + custo de oportunidade do patrimônio entram no mesmo pool
    // de custo indireto que as despesas fixas — um caminhão parado também
    // custa dinheiro (perde valor e imobiliza capital), não só o aluguel.
    const opportunityCostPct = Number(settings.assetOpportunityCostPct);
    const assetsTotal = assets.reduce((sum, asset) => {
      const { totalMonthlyCost } = calculateAssetMonthlyCost(
        {
          acquisitionValue: Number(asset.acquisitionValue),
          acquisitionDate: asset.acquisitionDate,
          usefulLifeMonths: asset.usefulLifeMonths,
          residualValue: Number(asset.residualValue),
        },
        opportunityCostPct,
      );
      return sum + totalMonthlyCost;
    }, 0);
    const totalFixed = fixedExpensesTotal + assetsTotal;

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
      simultaneousProjects: settings.overheadSimultaneousProjects ?? 1,
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
      // Cada dia de custo fixo é compartilhado entre as obras simultâneas —
      // sem esse divisor, cada orçamento absorveria o pool inteiro, inflando
      // o custo indireto quando a empresa toca mais de uma obra ao mesmo tempo.
      const simultaneousProjects = Math.max(
        1,
        overheadCtx.simultaneousProjects,
      );
      const productiveDays = overheadCtx.workDaysPerMonth * occupancy;
      const ratePerDay =
        productiveDays > 0
          ? overheadCtx.totalFixed / productiveDays / simultaneousProjects
          : 0;
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

    const compositionsTotal = budget.compositionItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity) * Number(item.unitCost),
      0,
    );

    const servicesTotal = budget.serviceItems.reduce(
      (sum: number, item: any) =>
        sum + Number(item.quantity) * Number(item.unitPrice),
      0,
    );

    const rentalsTotal = budget.rentalItems.reduce(
      (sum: number, item: any) =>
        sum +
        Number(item.period) * Number(item.unitPrice) +
        Number(item.mobilizationCost),
      0,
    );

    const subtotal =
      materialsTotal +
      laborTotal +
      travelTotal +
      otherTotal +
      compositionsTotal +
      servicesTotal +
      rentalsTotal;
    const projectDays = Number(budget.projectDays || 0);
    const indirectCostValue = this.calculateIndirectCost(
      overheadCtx,
      subtotal,
      laborHours,
      projectDays,
    );
    const costWithIndirect = subtotal + indirectCostValue;

    // Gross-up pricing: lucroPct and impostoPct are both percentages of the
    // FINAL sale price (not markups on cost), so the price is solved by
    // dividing the fully-loaded cost by the leftover share after both are
    // subtracted — see Bloco K of the roadmap for the full derivation.
    const contingenciaPct = Number(budget.contingenciaPct ?? 0);
    const contingenciaValue = costWithIndirect * (contingenciaPct / 100);

    const taxaCapitalPct = Number(budget.taxaCapitalPct ?? 0);
    const prazoRecebimentoDias = Number(budget.prazoRecebimentoDias ?? 0);
    const custoFinanceiroValue =
      (costWithIndirect + contingenciaValue) *
      (taxaCapitalPct / 100) *
      (prazoRecebimentoDias / 30);

    const custoTotal =
      costWithIndirect + contingenciaValue + custoFinanceiroValue;

    const taxRates = TAX_TABLE[budget.regime] || [];
    const impostoPct = taxRates.reduce((sum, tax) => sum + tax.rate, 0);
    const lucroPct = Number(budget.lucroPct ?? 0);

    const rawDivisor = 1 - (impostoPct + lucroPct) / 100;
    const pricingImpossible = rawDivisor <= 0.02;
    const divisor = pricingImpossible ? 0.02 : rawDivisor;
    const pvCheio = custoTotal / divisor;

    const discountPct = Number(budget.discountPct);
    const discountValue = pvCheio * (discountPct / 100);
    const total = pvCheio - discountValue;

    const impostoReal = total * (impostoPct / 100);
    const taxes = taxRates.map((tax) => ({
      name: tax.name,
      rate: tax.rate,
      value: round2(total * (tax.rate / 100)),
    }));

    const lucroReal = total - custoTotal - impostoReal;
    const margemReal = total > 0 ? (lucroReal / total) * 100 : 0;
    const bdiEquivalente = subtotal > 0 ? (total / subtotal - 1) * 100 : 0;

    return {
      materialsTotal: round2(materialsTotal),
      laborTotal: round2(laborTotal),
      travelTotal: round2(travelTotal),
      otherTotal: round2(otherTotal),
      compositionsTotal: round2(compositionsTotal),
      servicesTotal: round2(servicesTotal),
      rentalsTotal: round2(rentalsTotal),
      subtotal: round2(subtotal),
      indirectCostValue: round2(indirectCostValue),
      costWithIndirect: round2(costWithIndirect),
      contingenciaValue: round2(contingenciaValue),
      custoFinanceiroValue: round2(custoFinanceiroValue),
      custoTotal: round2(custoTotal),
      impostoPct: round2(impostoPct),
      pvCheio: round2(pvCheio),
      taxes,
      taxTotal: round2(impostoReal),
      impostoReal: round2(impostoReal),
      discountValue: round2(discountValue),
      total: round2(total),
      lucroReal: round2(lucroReal),
      margemReal: round2(margemReal),
      bdiEquivalente: round2(bdiEquivalente),
      pricingImpossible,
      // Aliases kept so pre-existing consumers (dashboard/report aggregates)
      // that read the old field names keep working unchanged.
      estimatedCost: round2(custoTotal),
      estimatedMargin: round2(lucroReal),
      estimatedMarginPct: round2(margemReal),
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
      compositionItems: { include: { composition: true } },
      serviceItems: { include: { thirdPartyService: true } },
      rentalItems: { include: { rentalEquipment: true } },
    };
  }

  private async resolveCompositionItems(
    items: { compositionId: string; quantity: number }[],
    salarioMinimo: number,
  ) {
    return Promise.all(
      items.map(async (item) => {
        const composition = await this.prisma.client.costComposition.findUnique(
          {
            where: { id: item.compositionId },
            include: {
              materials: {
                include: { material: { include: { quotes: true } } },
              },
              labor: { include: { laborRole: true } },
            },
          },
        );
        if (!composition)
          throw new NotFoundException(
            'Composicao nao encontrada: ' + item.compositionId,
          );
        const { unitCost } = calculateCompositionUnitCost(
          composition,
          salarioMinimo,
        );
        return {
          compositionId: item.compositionId,
          quantity: item.quantity,
          unitCost: round2(unitCost),
        };
      }),
    );
  }

  private async generateNumber() {
    const count = await this.prisma.client.budget.count();
    return String(count + 1).padStart(4, '0');
  }

  async create(dto: CreateBudgetDto) {
    const number = await this.generateNumber();
    const salarioMinimo = await this.getSalarioMinimo();

    const materialItemsData = await Promise.all(
      (dto.materialItems || []).map(async (item) => {
        const unitCost = await this.getMaterialReferenceUnitCost(
          item.materialId,
        );
        return {
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: round2(unitCost),
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
        const { effectiveHourlyRate } = calculateLaborRoleEffectiveRate(
          {
            hourlyRate: Number(role.hourlyRate),
            chargesPct: Number(role.chargesPct),
            periculosidade: role.periculosidade,
            insalubridadePct: Number(role.insalubridadePct),
            noturnoPct: Number(role.noturnoPct),
            beneficioHora: Number(role.beneficioHora),
          },
          salarioMinimo,
        );
        return {
          laborRoleId: item.laborRoleId,
          hours: item.hours,
          hourlyRate: round2(effectiveHourlyRate),
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

    const compositionItemsData = await this.resolveCompositionItems(
      dto.compositionItems || [],
      salarioMinimo,
    );

    const serviceItemsData = await this.resolveServiceItems(
      dto.serviceItems || [],
    );

    const rentalItemsData = await this.resolveRentalItems(
      dto.rentalItems || [],
    );

    const budget = await this.prisma.client.budget.create({
      data: {
        number,
        clientId: dto.clientId,
        description: dto.description,
        status: dto.status,
        regime: dto.regime,
        bdiPct: dto.bdiPct,
        lucroPct: dto.lucroPct,
        contingenciaPct: dto.contingenciaPct,
        prazoRecebimentoDias: dto.prazoRecebimentoDias,
        taxaCapitalPct: dto.taxaCapitalPct,
        discountPct: dto.discountPct,
        notes: dto.notes,
        employeeId: dto.employeeId,
        projectDays: dto.projectDays,
        materialItems: { create: materialItemsData },
        laborItems: { create: laborItemsData },
        travelItems: { create: travelItemsData },
        otherItems: { create: otherItemsData },
        compositionItems: { create: compositionItemsData },
        serviceItems: { create: serviceItemsData },
        rentalItems: { create: rentalItemsData },
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

  async update(id: string, dto: UpdateBudgetDto, actor?: Actor) {
    const existing = await this.findOne(id);
    const salarioMinimo = await this.getSalarioMinimo();

    const updateData: any = {
      description: dto.description,
      status: dto.status,
      regime: dto.regime,
      bdiPct: dto.bdiPct,
      lucroPct: dto.lucroPct,
      contingenciaPct: dto.contingenciaPct,
      prazoRecebimentoDias: dto.prazoRecebimentoDias,
      taxaCapitalPct: dto.taxaCapitalPct,
      discountPct: dto.discountPct,
      notes: dto.notes,
      employeeId: dto.employeeId,
      projectDays: dto.projectDays,
    };

    if (dto.clientId) updateData.clientId = dto.clientId;

    if (dto.materialItems) {
      const materialItemsData = await Promise.all(
        dto.materialItems.map(async (item) => {
          const unitCost = await this.getMaterialReferenceUnitCost(
            item.materialId,
          );
          return {
            materialId: item.materialId,
            quantity: item.quantity,
            unitCost: round2(unitCost),
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
          const { effectiveHourlyRate } = calculateLaborRoleEffectiveRate(
            {
              hourlyRate: Number(role.hourlyRate),
              chargesPct: Number(role.chargesPct),
              periculosidade: role.periculosidade,
              insalubridadePct: Number(role.insalubridadePct),
              noturnoPct: Number(role.noturnoPct),
              beneficioHora: Number(role.beneficioHora),
            },
            salarioMinimo,
          );
          return {
            laborRoleId: item.laborRoleId,
            hours: item.hours,
            hourlyRate: round2(effectiveHourlyRate),
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

    if (dto.compositionItems) {
      const compositionItemsData = await this.resolveCompositionItems(
        dto.compositionItems,
        salarioMinimo,
      );
      await this.prisma.client.budgetCompositionItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.compositionItems = { create: compositionItemsData };
    }

    if (dto.serviceItems) {
      const serviceItemsData = await this.resolveServiceItems(
        dto.serviceItems,
      );
      await this.prisma.client.budgetServiceItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.serviceItems = { create: serviceItemsData };
    }

    if (dto.rentalItems) {
      const rentalItemsData = await this.resolveRentalItems(dto.rentalItems);
      await this.prisma.client.budgetRentalItem.deleteMany({
        where: { budgetId: id },
      });
      updateData.rentalItems = { create: rentalItemsData };
    }

    const budget = await this.prisma.client.budget.update({
      where: { id },
      data: updateData,
      include: this.include(),
    });

    if (dto.status && (dto.status as string) !== (existing.status as string)) {
      await this.auditService.log({
        actor,
        action: 'BUDGET_STATUS_CHANGE',
        entity: 'Budget',
        entityId: budget.id,
        details: `Nº ${budget.number}: ${existing.status} → ${dto.status}`,
      });
    }

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.budget.delete({ where: { id } });
  }

  private cloneItemsData(source: Awaited<ReturnType<typeof this.findOne>>) {
    return {
      materialItems: {
        create: source.materialItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
      laborItems: {
        create: source.laborItems.map((item) => ({
          laborRoleId: item.laborRoleId,
          hours: item.hours,
          hourlyRate: item.hourlyRate,
        })),
      },
      travelItems: {
        create: source.travelItems.map((item) => ({
          vehicleId: item.vehicleId,
          distanceKm: item.distanceKm,
          trips: item.trips,
          fuelPrice: item.fuelPrice,
        })),
      },
      otherItems: {
        create: source.otherItems.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
      },
      compositionItems: {
        create: source.compositionItems.map((item) => ({
          compositionId: item.compositionId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      },
      serviceItems: {
        create: source.serviceItems.map((item) => ({
          thirdPartyServiceId: item.thirdPartyServiceId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      rentalItems: {
        create: source.rentalItems.map((item) => ({
          rentalEquipmentId: item.rentalEquipmentId,
          period: item.period,
          unitPrice: item.unitPrice,
          mobilizationCost: item.mobilizationCost,
        })),
      },
    };
  }

  async duplicate(id: string) {
    const source = await this.findOne(id);
    const number = await this.generateNumber();

    const budget = await this.prisma.client.budget.create({
      data: {
        number,
        version: 1,
        rootId: null,
        clientId: source.clientId,
        description: source.description
          ? `${source.description} (cópia)`
          : undefined,
        status: 'DRAFT',
        regime: source.regime,
        bdiPct: source.bdiPct,
        lucroPct: source.lucroPct,
        contingenciaPct: source.contingenciaPct,
        prazoRecebimentoDias: source.prazoRecebimentoDias,
        taxaCapitalPct: source.taxaCapitalPct,
        discountPct: source.discountPct,
        notes: source.notes,
        employeeId: source.employeeId,
        projectDays: source.projectDays,
        ...this.cloneItemsData(source),
      },
      include: this.include(),
    });

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
  }

  async createNewVersion(id: string) {
    const source = await this.findOne(id);
    const rootId = source.rootId ?? source.id;

    const family = await this.prisma.client.budget.findMany({
      where: { OR: [{ id: rootId }, { rootId }] },
      select: { version: true },
    });
    const nextVersion = Math.max(...family.map((b) => b.version)) + 1;

    const budget = await this.prisma.client.budget.create({
      data: {
        number: source.number,
        version: nextVersion,
        rootId,
        clientId: source.clientId,
        description: source.description,
        status: 'DRAFT',
        regime: source.regime,
        bdiPct: source.bdiPct,
        lucroPct: source.lucroPct,
        contingenciaPct: source.contingenciaPct,
        prazoRecebimentoDias: source.prazoRecebimentoDias,
        taxaCapitalPct: source.taxaCapitalPct,
        discountPct: source.discountPct,
        notes: source.notes,
        employeeId: source.employeeId,
        projectDays: source.projectDays,
        ...this.cloneItemsData(source),
      },
      include: this.include(),
    });

    const overheadCtx = await this.getOverheadContext();
    return { ...budget, totals: this.calculateTotals(budget, overheadCtx) };
  }

  async findVersions(id: string) {
    const source = await this.findOne(id);
    const rootId = source.rootId ?? source.id;

    return this.prisma.client.budget.findMany({
      where: { OR: [{ id: rootId }, { rootId }] },
      select: {
        id: true,
        number: true,
        version: true,
        status: true,
        createdAt: true,
      },
      orderBy: { version: 'asc' },
    });
  }
}

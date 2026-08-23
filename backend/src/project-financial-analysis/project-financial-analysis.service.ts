import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { PrevistoRealizadoService } from '../previsto-realizado/previsto-realizado.service';
import {
  annualToMonthlyRate,
  vpl,
  tir,
  paybackSimples,
  paybackDescontado,
  exposicaoMaxima,
  indiceLucratividade,
} from '../common/project-financial-analysis';

interface CashEvent {
  date: Date;
  amount: number; // positivo = entrada, negativo = saida
}

@Injectable()
export class ProjectFinancialAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previstoRealizadoService: PrevistoRealizadoService,
  ) {}

  private async getDefaultFuelPrice() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.defaultFuelPrice) : 6;
  }

  private async getDiscountRatePct() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.discountRatePct) : 12;
  }

  // Reaproveita exatamente os mesmos filtros/formulas de
  // PrevistoRealizadoService (material via PurchaseOrder RECEIVED, mao de
  // obra via WorkLog+Employee.dailyRate, viagem via VehicleTrip fechada,
  // outros+receita via FinanceEntry pago nao-transferencia) -- a diferenca e
  // que aqui cada evento carrega sua propria data, para poder ser agrupado
  // por mes, em vez de virar um total unico.
  private async collectCashEvents(projectId: string): Promise<CashEvent[]> {
    const fuelPrice = await this.getDefaultFuelPrice();

    const [orders, stockOuts, logs, trips, entries] = await Promise.all([
      this.prisma.client.purchaseOrder.findMany({
        where: { status: 'RECEIVED', destinationProjectId: projectId },
        include: { items: true },
      }),
      // MANUAL apenas -- ver comentario equivalente em
      // PrevistoRealizadoService.actualMaterialCost sobre por que isso nao
      // dobra a conta com os pedidos de compra diretos ao projeto acima.
      this.prisma.client.stockMovement.findMany({
        where: { type: 'OUT', projectId, source: 'MANUAL' },
        include: { stockItem: { include: { material: true } } },
      }),
      this.prisma.client.workLog.findMany({
        where: { projectId },
        include: { employees: { include: { employee: true } } },
      }),
      this.prisma.client.vehicleTrip.findMany({
        where: { projectId, status: 'CLOSED' },
        include: { vehicle: true },
      }),
      this.prisma.client.financeEntry.findMany({
        where: { projectId, status: 'PAID', isTransfer: false },
      }),
    ]);

    const events: CashEvent[] = [];

    for (const order of orders) {
      if (!order.receivedAt) continue;
      const cost = order.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
        0,
      );
      if (cost !== 0) events.push({ date: order.receivedAt, amount: -cost });
    }

    for (const movement of stockOuts) {
      const cost =
        Number(movement.quantity) *
        Number(movement.stockItem.material.unitCost);
      if (cost !== 0) events.push({ date: movement.movedAt, amount: -cost });
    }

    for (const log of logs) {
      const cost = log.employees.reduce(
        (sum, e) => sum + Number(e.employee.dailyRate),
        0,
      );
      if (cost !== 0) events.push({ date: log.date, amount: -cost });
    }

    for (const trip of trips) {
      const consumption = Number(trip.vehicle.avgConsumption);
      const liters =
        consumption > 0 ? Number(trip.distanceKm) / consumption : 0;
      const cost = liters * fuelPrice + Number(trip.tollCost);
      if (cost !== 0)
        events.push({ date: trip.closedAt ?? trip.date, amount: -cost });
    }

    for (const entry of entries) {
      if (!entry.paidAt) continue;
      const amount = Number(entry.paidAmount ?? entry.amount);
      if (amount === 0) continue;
      events.push({
        date: entry.paidAt,
        amount: entry.type === 'INCOME' ? amount : -amount,
      });
    }

    return events;
  }

  private buildMonthlySeries(events: CashEvent[]) {
    const byMonth = new Map<string, { income: number; expense: number }>();
    for (const event of events) {
      const month = event.date.toISOString().slice(0, 7); // 'YYYY-MM'
      const bucket = byMonth.get(month) ?? { income: 0, expense: 0 };
      if (event.amount >= 0) bucket.income += event.amount;
      else bucket.expense += -event.amount;
      byMonth.set(month, bucket);
    }

    const months = Array.from(byMonth.keys()).sort();
    let cumulative = 0;
    return months.map((month) => {
      const { income, expense } = byMonth.get(month)!;
      const net = income - expense;
      cumulative += net;
      return {
        month,
        income: round2(income),
        expense: round2(expense),
        net: round2(net),
        cumulative: round2(cumulative),
      };
    });
  }

  async getAnalysis(projectId: string, discountRatePctOverride?: number) {
    const project = await this.prisma.client.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');

    const discountRatePct =
      discountRatePctOverride ?? (await this.getDiscountRatePct());
    const monthlyRate = annualToMonthlyRate(discountRatePct);

    const events = await this.collectCashEvents(projectId);
    const monthlyFlow = this.buildMonthlySeries(events);
    const cashflows = monthlyFlow.map((m) => m.net);

    const vplValue =
      cashflows.length > 0 ? round2(vpl(cashflows, monthlyRate)) : 0;
    const tirMonthly = tir(cashflows);
    const tirAnnualPct =
      tirMonthly !== null
        ? round2((Math.pow(1 + tirMonthly, 12) - 1) * 100)
        : null;
    const paybackSimplesMeses = paybackSimples(cashflows);
    const paybackDescontadoMeses = paybackDescontado(cashflows, monthlyRate);
    const exposicaoMaximaValue = round2(exposicaoMaxima(cashflows));
    const il = indiceLucratividade(cashflows, monthlyRate);

    // DRE direto: reaproveita o mesmo calculo ja usado no Previsto x
    // Realizado (mesmas fontes, mesmas formulas) em vez de duplicar a
    // apuracao de receita/custo realizado.
    const comparison =
      await this.previstoRealizadoService.getForProject(projectId);
    const receita = comparison.revenue.actual;
    const custosDiretos = comparison.costs.total.actual;
    const resultadoDireto = round2(receita - custosDiretos);
    const margemDiretaPct =
      receita > 0 ? round2((resultadoDireto / receita) * 100) : null;

    return {
      projectId: project.id,
      number: project.number,
      name: project.name,
      discountRatePct: round2(discountRatePct),
      monthlyFlow,
      vpl: vplValue,
      tirMensalPct: tirMonthly !== null ? round2(tirMonthly * 100) : null,
      tirAnualPct: tirAnnualPct,
      paybackSimplesMeses:
        paybackSimplesMeses !== null ? round2(paybackSimplesMeses) : null,
      paybackDescontadoMeses:
        paybackDescontadoMeses !== null ? round2(paybackDescontadoMeses) : null,
      exposicaoMaxima: exposicaoMaximaValue,
      indiceLucratividade: il !== null ? round2(il) : null,
      dre: {
        receita: round2(receita),
        custosDiretos: round2(custosDiretos),
        resultadoDireto,
        margemDiretaPct,
      },
    };
  }

  async getComparison() {
    const projects = await this.prisma.client.project.findMany({
      where: { budgetId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(projects.map((project) => this.getAnalysis(project.id)));
  }
}

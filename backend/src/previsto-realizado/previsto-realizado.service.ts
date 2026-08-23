import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { compareRow, compareMargin } from '../common/previsto-realizado';

@Injectable()
export class PrevistoRealizadoService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDefaultFuelPrice() {
    const settings = await this.prisma.client.settings.findFirst();
    return settings ? Number(settings.defaultFuelPrice) : 6;
  }

  // Realizado de material: soma duas fontes que nao se sobrepoem.
  // (1) Pedidos de compra RECEBIDOS direcionados direto a este projeto --
  //     preco historico real (PurchaseOrderItem.unitCost).
  // (2) Material que ja estava no estoque geral e foi retirado manualmente
  //     para este projeto (StockMovement OUT com projectId, source=MANUAL).
  //     "MANUAL" e o que garante que isso nao dobra a conta com (1): todo
  //     StockMovement OUT gerado automaticamente ao receber um pedido direto
  //     a um projeto (purchase-orders.service.ts#receive) nasce com
  //     source=PURCHASE_ORDER e fica de fora daqui -- so entra a retirada
  //     manual de um material que chegou por uma compra SEM destinationProjectId
  //     (foi para o estoque geral) e so depois foi enviado a obra.
  //     Usa o Material.unitCost atual (StockMovement nao guarda o preco
  //     pago na compra original que abasteceu o estoque).
  private async actualMaterialCost(projectId: string) {
    const [orders, stockOuts] = await Promise.all([
      this.prisma.client.purchaseOrder.findMany({
        where: { status: 'RECEIVED', destinationProjectId: projectId },
        include: { items: true },
      }),
      this.prisma.client.stockMovement.findMany({
        where: { type: 'OUT', projectId, source: 'MANUAL' },
        include: { stockItem: { include: { material: true } } },
      }),
    ]);

    const fromPurchaseOrders = orders.reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (s, item) => s + Number(item.quantity) * Number(item.unitCost),
          0,
        ),
      0,
    );

    const fromStock = stockOuts.reduce(
      (sum, movement) =>
        sum +
        Number(movement.quantity) *
          Number(movement.stockItem.material.unitCost),
      0,
    );

    return round2(fromPurchaseOrders + fromStock);
  }

  // Realizado de mao de obra: diaria de cada funcionario presente em cada
  // registro de diario de obra do projeto (nao ha lancamento financeiro de
  // folha de pagamento no sistema, entao esta e a unica fonte real).
  private async actualLaborCost(projectId: string) {
    const logs = await this.prisma.client.workLog.findMany({
      where: { projectId },
      include: { employees: { include: { employee: true } } },
    });
    return round2(
      logs.reduce(
        (sum, log) =>
          sum +
          log.employees.reduce((s, e) => s + Number(e.employee.dailyRate), 0),
        0,
      ),
    );
  }

  // Realizado de veiculos: viagens fechadas do projeto, combustivel estimado
  // pelo consumo medio do veiculo x preco de combustivel padrao (nao ha
  // preco pago por viagem registrado), mais pedagio real da viagem.
  private async actualTravelCost(projectId: string) {
    const fuelPrice = await this.getDefaultFuelPrice();
    const trips = await this.prisma.client.vehicleTrip.findMany({
      where: { projectId, status: 'CLOSED' },
      include: { vehicle: true },
    });
    return round2(
      trips.reduce((sum, trip) => {
        const consumption = Number(trip.vehicle.avgConsumption);
        const liters =
          consumption > 0 ? Number(trip.distanceKm) / consumption : 0;
        return sum + liters * fuelPrice + Number(trip.tollCost);
      }, 0),
    );
  }

  // Realizado de "outros": lancamentos financeiros de despesa pagos e
  // vinculados diretamente ao projeto. Nao colide com material/veiculos
  // porque nenhum dos dois grava projectId no FinanceEntry que gera.
  private async actualOtherCost(projectId: string) {
    const entries = await this.prisma.client.financeEntry.findMany({
      where: { projectId, type: 'EXPENSE', status: 'PAID' },
    });
    return round2(
      entries.reduce((sum, e) => sum + Number(e.paidAmount ?? e.amount), 0),
    );
  }

  private async actualRevenue(projectId: string) {
    const entries = await this.prisma.client.financeEntry.findMany({
      where: { projectId, type: 'INCOME', status: 'PAID' },
    });
    return round2(
      entries.reduce((sum, e) => sum + Number(e.paidAmount ?? e.amount), 0),
    );
  }

  private async buildComparison(project: {
    id: string;
    number: string;
    name: string;
    budgetId: string | null;
    budgetAmount: any;
    plannedMaterialCost: any;
    plannedLaborCost: any;
    plannedTravelCost: any;
    plannedOtherCost: any;
    plannedServiceCost: any;
    plannedRentalCost: any;
  }) {
    const [
      actualMaterial,
      actualLabor,
      actualTravel,
      actualOther,
      revenueActual,
    ] = await Promise.all([
      this.actualMaterialCost(project.id),
      this.actualLaborCost(project.id),
      this.actualTravelCost(project.id),
      this.actualOtherCost(project.id),
      this.actualRevenue(project.id),
    ]);

    const material = compareRow(
      Number(project.plannedMaterialCost),
      actualMaterial,
      'cost',
    );
    const labor = compareRow(
      Number(project.plannedLaborCost),
      actualLabor,
      'cost',
    );
    const vehicles = compareRow(
      Number(project.plannedTravelCost),
      actualTravel,
      'cost',
    );
    const other = compareRow(
      Number(project.plannedOtherCost),
      actualOther,
      'cost',
    );
    const total = compareRow(
      material.planned + labor.planned + vehicles.planned + other.planned,
      material.actual + labor.actual + vehicles.actual + other.actual,
      'cost',
    );
    const revenue = compareRow(
      Number(project.budgetAmount),
      revenueActual,
      'revenue',
    );
    const margin = compareMargin(
      revenue.planned,
      total.planned,
      revenue.actual,
      total.actual,
    );

    // Servicos de terceiros e alugueis: so ha "previsto" (snapshot do
    // orcamento) por enquanto. O FinanceEntry pago vinculado ao projeto nao
    // distingue despesa de servico/aluguel de despesa "outros" generica, e
    // ja alimenta actualOtherCost -- criar um realizado aqui duplicaria esse
    // valor. Ficam fora do somatorio de "total" por esse motivo.
    const services = { planned: round2(Number(project.plannedServiceCost)) };
    const rentals = { planned: round2(Number(project.plannedRentalCost)) };

    return {
      projectId: project.id,
      number: project.number,
      name: project.name,
      hasBudget: !!project.budgetId,
      revenue,
      costs: { material, labor, vehicles, other, services, rentals, total },
      margin,
    };
  }

  async getForProject(projectId: string) {
    const project = await this.prisma.client.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Projeto nao encontrado.');
    return this.buildComparison(project);
  }

  async getPortfolio() {
    const projects = await this.prisma.client.project.findMany({
      where: { budgetId: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      projects.map((project) => this.buildComparison(project)),
    );
  }
}

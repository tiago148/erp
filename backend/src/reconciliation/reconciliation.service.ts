import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { PrevistoRealizadoService } from '../previsto-realizado/previsto-realizado.service';

type Period = 'mes' | '3m' | 'ano';

// Conciliacao Gerencial x Caixa (secao V18 do prototipo). Duas visoes que NAO
// devem ser somadas: uma mostra o que a empresa pagou (caixa), a outra o que
// cada obra consumiu (gerencial). O rateio de indiretos e a apropriacao de
// mao de obra apontada nao sao caixa novo -- sao a forma de distribuir entre
// as obras o que ja foi pago (ou o que nao passa pelo caixa, como a folha).
@Injectable()
export class ReconciliationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly previstoRealizado: PrevistoRealizadoService,
  ) {}

  private periodStart(period: Period): Date {
    const now = new Date();
    if (period === 'mes') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === '3m') return new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return new Date(now.getFullYear(), 0, 1);
  }

  async get(period: Period = 'ano') {
    const start = this.periodStart(period);

    const [settings, paidExpenses, stockMovements, portfolio, activeProjects] =
      await Promise.all([
        this.prisma.client.settings.findFirst(),
        this.prisma.client.financeEntry.findMany({
          where: { type: 'EXPENSE', status: 'PAID', paidAt: { gte: start } },
          include: { category: true },
        }),
        this.prisma.client.stockMovement.findMany({
          where: { movedAt: { gte: start } },
          include: { stockItem: { include: { material: true } } },
        }),
        this.previstoRealizado.getPortfolio(),
        this.prisma.client.project.findMany({
          where: { status: 'IN_PROGRESS' },
          select: { id: true, name: true },
        }),
      ]);

    // ---- UNIVERSO A: CAIXA ----
    const caixa = round2(
      paidExpenses.reduce((s, e) => s + Number(e.paidAmount ?? e.amount), 0),
    );

    // ---- UNIVERSO B: GERENCIAL ----
    const managerialDirect = round2(
      portfolio.reduce((s, p: any) => s + Number(p.costs?.total?.actual ?? 0), 0),
    );
    const laborApontado = round2(
      portfolio.reduce((s, p: any) => s + Number(p.costs?.labor?.actual ?? 0), 0),
    );
    const materialFromStock = round2(
      stockMovements
        .filter((m) => m.type === 'OUT' && m.source === 'MANUAL' && m.projectId)
        .reduce(
          (s, m) => s + Number(m.quantity) * Number(m.stockItem.material.unitCost),
          0,
        ),
    );

    // Rateio proporcional ao custo direto executado (metodo % sobre custo direto).
    const [fixedExpenses, indirectAssets] = await Promise.all([
      this.prisma.client.fixedExpense.findMany(),
      this.prisma.client.asset.findMany({ where: { absorptionMode: 'INDIRECT' } }),
    ]);
    const fixedTotal = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
    // Depreciacao dos bens indiretos, aproximada linear (valor - residual) / vida.
    const depreciationMonthly = indirectAssets.reduce((s, a) => {
      const dep =
        a.usefulLifeMonths > 0
          ? (Number(a.acquisitionValue) - Number(a.residualValue)) /
            a.usefulLifeMonths
          : 0;
      return s + dep;
    }, 0);
    const pool = fixedTotal + depreciationMonthly;
    const avgDirect = Number(settings?.overheadAvgDirectCost ?? 0);
    const rateioPct =
      settings?.overheadAutoApply &&
      settings.overheadMethod === 'PERCENT' &&
      avgDirect > 0
        ? (pool / avgDirect) * 100
        : 0;
    const rateio = round2((managerialDirect * rateioPct) / 100);
    const depreciationInRateio = round2(
      rateioPct > 0 && pool > 0
        ? rateio * (depreciationMonthly / pool)
        : 0,
    );

    const gerencial = round2(managerialDirect + rateio);

    // ---- PONTE ----
    const stockNetIncrease = round2(
      stockMovements.reduce((s, m) => {
        const value = Number(m.quantity) * Number(m.stockItem.material.unitCost);
        return s + (m.type === 'IN' ? value : -value);
      }, 0),
    );
    const semObra = round2(
      paidExpenses
        .filter((e) => !e.projectId && !e.purchaseOrderId)
        .reduce((s, e) => s + Number(e.paidAmount ?? e.amount), 0),
    );

    const bridge = [
      { label: 'Saída de caixa no período', value: caixa, kind: 'base' as const },
      {
        label: '(−) Compras que entraram no estoque e ainda não saíram',
        value: -Math.max(0, stockNetIncrease),
        kind: 'sub' as const,
      },
      {
        label: '(−) Despesas sem obra vinculada (estrutura e geral)',
        value: -semObra,
        kind: 'sub' as const,
      },
      {
        label: '(+) Mão de obra apontada nas obras',
        value: laborApontado,
        kind: 'add' as const,
      },
      {
        label: '(+) Material requisitado do estoque',
        value: materialFromStock,
        kind: 'add' as const,
      },
      {
        label: '(+) Rateio de indiretos (não é caixa novo)',
        value: rateio,
        kind: 'warn' as const,
      },
      ...(depreciationInRateio > 0
        ? [
            {
              label: '   dentro do rateio, depreciação (nunca sai do caixa)',
              value: depreciationInRateio,
              kind: 'warn' as const,
            },
          ]
        : []),
      { label: 'Custo alocado às obras', value: gerencial, kind: 'total' as const },
    ];

    const diff = round2(gerencial - caixa);
    const diffPct = caixa > 0 ? round2((Math.abs(diff) / caixa) * 100) : 0;

    // ---- AUDITORIA DE CONSISTÊNCIA ----
    const audit: { level: 'erro' | 'alerta' | 'ok'; title: string; detail: string }[] =
      [];

    const receivedOrders = await this.prisma.client.purchaseOrder.findMany({
      where: { status: 'RECEIVED' },
      include: { items: true },
    });
    const orderAmounts = receivedOrders.map((o) => ({
      amount: o.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitCost),
        0,
      ),
      date: o.receivedAt ?? o.createdAt,
    }));
    const suspectDuplicates = paidExpenses.filter(
      (e) =>
        e.projectId &&
        !e.purchaseOrderId &&
        orderAmounts.some(
          (o) =>
            Math.abs(o.amount - Number(e.paidAmount ?? e.amount)) < 0.01 &&
            Math.abs(o.date.getTime() - (e.paidAt ?? e.dueDate).getTime()) <=
              7 * 86400000,
        ),
    );
    if (suspectDuplicates.length) {
      audit.push({
        level: 'erro',
        title: 'Possível lançamento em duplicidade',
        detail: `${suspectDuplicates.length} lançamento(s) no financeiro com mesmo valor, mesma obra e data próxima de um pedido de compra já recebido: ${suspectDuplicates
          .slice(0, 3)
          .map((e) => e.description)
          .join(', ')}.`,
      });
    }

    const fixedNames = fixedExpenses.map((f) => f.description.toLowerCase());
    const manualFixed = paidExpenses.filter(
      (e) =>
        !e.purchaseOrderId &&
        fixedNames.some(
          (n) => n.length > 4 && e.description.toLowerCase().includes(n),
        ),
    );
    if (manualFixed.length) {
      audit.push({
        level: 'alerta',
        title: 'Despesa fixa lançada fora do fluxo de contas',
        detail: `${manualFixed.length} lançamento(s) com nome de despesa fixa cadastrada. A estrutura já é rateada nas obras — lançar manualmente pode contar duas vezes no DRE.`,
      });
    }

    const noApontamento = activeProjects.filter((p) => {
      const row = portfolio.find((x: any) => x.projectId === p.id) as any;
      return row && Number(row.costs?.labor?.actual ?? 0) === 0;
    });
    if (noApontamento.length) {
      audit.push({
        level: 'alerta',
        title: 'Obra em andamento sem mão de obra apontada',
        detail: `${noApontamento.length} obra(s) sem nenhuma hora registrada: ${noApontamento
          .slice(0, 3)
          .map((p) => p.name)
          .join(', ')}. O custo real está subestimado.`,
      });
    }

    const obraCategories = ['materiais', 'combustível', 'combustivel', 'terceiros'];
    const semProjeto = paidExpenses.filter(
      (e) =>
        !e.projectId &&
        !e.purchaseOrderId &&
        obraCategories.some((c) =>
          (e.category?.name ?? '').toLowerCase().includes(c),
        ),
    );
    if (semProjeto.length >= 3) {
      audit.push({
        level: 'alerta',
        title: 'Despesas de obra sem projeto vinculado',
        detail: `${semProjeto.length} lançamento(s) de material, combustível ou terceiros sem obra. Esse custo não aparece em nenhuma margem.`,
      });
    }

    if (!audit.length) {
      audit.push({
        level: 'ok',
        title: 'Nenhuma inconsistência detectada',
        detail:
          'Não há indício de lançamento em duplicidade nem de custo sem alocação no período analisado.',
      });
    }

    return {
      period,
      caixa,
      gerencial,
      diff,
      diffPct,
      bridge,
      rateioPct: round2(rateioPct),
      audit,
    };
  }
}

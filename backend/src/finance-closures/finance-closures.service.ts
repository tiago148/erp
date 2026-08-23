import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { computeClosureNumbers } from '../common/finance-closure';
import { round2 } from '../common/money';
import { CloseFinanceClosureDto } from './dto/close-finance-closure.dto';
import { ReopenFinanceClosureDto } from './dto/reopen-finance-closure.dto';

// Calcula o inicio/fim do periodo em UTC para evitar deriva de fuso horario
// entre o "dia" que o usuario escolhe no frontend e o "dia" gravado no banco.
function periodBounds(periodType: string, periodStart: Date) {
  const start = new Date(
    Date.UTC(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth(),
      periodStart.getUTCDate(),
    ),
  );
  let end: Date;
  if (periodType === 'WEEKLY') {
    end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  } else if (periodType === 'MONTHLY') {
    end = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1,
    );
  } else {
    end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  }
  return { start, end };
}

@Injectable()
export class FinanceClosuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private include() {
    return { account: true };
  }

  private async computeLiveTotals(accountId: string, start: Date, end: Date) {
    const entries = await this.prisma.client.financeEntry.findMany({
      where: {
        accountId,
        status: 'PAID',
        isTransfer: false,
        paidAt: { gte: start, lte: end },
      },
      select: { type: true, amount: true, paidAmount: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    for (const entry of entries) {
      const value = Number(entry.paidAmount ?? entry.amount);
      if (entry.type === 'INCOME') totalIncome += value;
      else totalExpense += value;
    }
    return {
      totalIncome: round2(totalIncome),
      totalExpense: round2(totalExpense),
    };
  }

  // Saldo inicial de um periodo = saldo conferido do ultimo fechamento FECHADO
  // anterior, na mesma conta. Sem fechamento anterior, usa o saldo inicial
  // cadastrado na conta (bootstrap do primeiro fechamento).
  private async computeInitialBalance(
    accountId: string,
    periodType: string,
    start: Date,
  ) {
    const previous = await this.prisma.client.financeClosure.findFirst({
      where: {
        accountId,
        periodType: periodType as any,
        status: 'CLOSED',
        periodStart: { lt: start },
      },
      orderBy: { periodStart: 'desc' },
    });
    if (previous && previous.informedBalance !== null) {
      return Number(previous.informedBalance);
    }
    const account = await this.prisma.client.financeAccount.findUnique({
      where: { id: accountId },
    });
    return account ? Number(account.initialBalance) : 0;
  }

  async getOrCreateCurrent(
    accountId: string,
    periodType: string,
    periodStartInput: Date,
    actor?: Actor,
  ) {
    const { start, end } = periodBounds(periodType, periodStartInput);

    const existing = await this.prisma.client.financeClosure.findUnique({
      where: {
        accountId_periodType_periodStart: {
          accountId,
          periodType: periodType as any,
          periodStart: start,
        },
      },
      include: this.include(),
    });

    if (existing && existing.status === 'CLOSED') {
      return existing;
    }

    const [initialBalance, totals] = await Promise.all([
      this.computeInitialBalance(accountId, periodType, start),
      this.computeLiveTotals(accountId, start, end),
    ]);
    const { expectedBalance } = computeClosureNumbers({
      initialBalance,
      ...totals,
    });

    if (existing) {
      return this.prisma.client.financeClosure.update({
        where: { id: existing.id },
        data: {
          initialBalance,
          totalIncome: totals.totalIncome,
          totalExpense: totals.totalExpense,
          expectedBalance,
        },
        include: this.include(),
      });
    }

    return this.prisma.client.financeClosure.create({
      data: {
        accountId,
        periodType: periodType as any,
        periodStart: start,
        periodEnd: end,
        initialBalance,
        totalIncome: totals.totalIncome,
        totalExpense: totals.totalExpense,
        expectedBalance,
        status: 'OPEN',
        openedByEmail: actor?.email,
      },
      include: this.include(),
    });
  }

  async startReview(id: string) {
    const closure = await this.findOne(id);
    if (closure.status !== 'OPEN') return closure;
    return this.prisma.client.financeClosure.update({
      where: { id },
      data: { status: 'REVIEWING' },
      include: this.include(),
    });
  }

  async close(id: string, dto: CloseFinanceClosureDto, actor?: Actor) {
    const closure = await this.findOne(id);
    if (closure.status === 'CLOSED') {
      throw new BadRequestException('Este fechamento ja foi concluido.');
    }

    const { difference } = computeClosureNumbers({
      initialBalance: Number(closure.initialBalance),
      totalIncome: Number(closure.totalIncome),
      totalExpense: Number(closure.totalExpense),
      informedBalance: dto.informedBalance,
    });

    if (difference !== 0 && !dto.notes?.trim()) {
      throw new BadRequestException(
        'Existe uma diferenca entre o saldo esperado e o saldo informado. Informe uma observacao/motivo para fechar mesmo assim.',
      );
    }

    const updated = await this.prisma.client.financeClosure.update({
      where: { id },
      data: {
        informedBalance: dto.informedBalance,
        difference,
        notes: dto.notes,
        status: 'CLOSED',
        closedByEmail: actor?.email,
        closedAt: new Date(),
      },
      include: this.include(),
    });

    await this.auditService.log({
      actor,
      action: 'FINANCE_CLOSURE_CLOSED',
      entity: 'FinanceClosure',
      entityId: updated.id,
      details: `Conta ${updated.account.name}, periodo ${updated.periodStart.toISOString().slice(0, 10)}: esperado ${Number(closure.expectedBalance).toFixed(2)}, informado ${dto.informedBalance.toFixed(2)}, diferenca ${(difference ?? 0).toFixed(2)}`,
    });

    return updated;
  }

  async reopen(id: string, dto: ReopenFinanceClosureDto, actor?: Actor) {
    const closure = await this.findOne(id);
    if (closure.status !== 'CLOSED') {
      throw new BadRequestException('Este fechamento nao esta fechado.');
    }

    const updated = await this.prisma.client.financeClosure.update({
      where: { id },
      data: { status: 'OPEN' },
      include: this.include(),
    });

    await this.auditService.log({
      actor,
      action: 'FINANCE_CLOSURE_REOPENED',
      entity: 'FinanceClosure',
      entityId: updated.id,
      details: `Conta ${updated.account.name}, periodo ${updated.periodStart.toISOString().slice(0, 10)}. Motivo: ${dto.reason}`,
    });

    return updated;
  }

  findAll(accountId?: string) {
    return this.prisma.client.financeClosure.findMany({
      where: accountId ? { accountId } : undefined,
      include: this.include(),
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(id: string) {
    const closure = await this.prisma.client.financeClosure.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!closure) throw new NotFoundException('Fechamento nao encontrado.');
    return closure;
  }

  // Usado pelo FinanceEntriesService para bloquear edicoes normais em
  // lancamentos cuja data de pagamento caia dentro de um periodo ja FECHADO.
  async isDateLocked(
    accountId: string | null | undefined,
    date: Date | null | undefined,
  ) {
    if (!accountId || !date) return null;
    return this.prisma.client.financeClosure.findFirst({
      where: {
        accountId,
        status: 'CLOSED',
        periodStart: { lte: date },
        periodEnd: { gte: date },
      },
    });
  }
}

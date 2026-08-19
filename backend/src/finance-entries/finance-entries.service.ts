import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeNextOccurrenceDate } from '../common/recurrence';
import { getOrCreateCategory } from '../common/finance';
import { AuditService, Actor } from '../audit/audit.service';
import { FinanceAccountsService } from '../finance-accounts/finance-accounts.service';
import { FinanceClosuresService } from '../finance-closures/finance-closures.service';
import { CreateFinanceEntryDto } from './dto/create-finance-entry.dto';
import { UpdateFinanceEntryDto } from './dto/update-finance-entry.dto';
import { PayFinanceEntryDto } from './dto/pay-finance-entry.dto';
import { TransferFinanceEntryDto } from './dto/transfer-finance-entry.dto';

interface FindAllQuery {
  type?: string;
  status?: string;
  projectId?: string;
  categoryId?: string;
  search?: string;
}

@Injectable()
export class FinanceEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly financeAccountsService: FinanceAccountsService,
    private readonly financeClosuresService: FinanceClosuresService,
  ) {}

  private include() {
    return {
      category: true,
      account: true,
      project: true,
      supplier: true,
      client: true,
      purchaseOrder: true,
      budget: true,
    };
  }

  // Se o lancamento pertencer a um periodo ja FECHADO, exige um motivo
  // explicito (procedimento controlado) e grava auditoria da alteracao --
  // ver PARTE 1 do plano de Fechamento Financeiro.
  private async assertEditAllowed(
    accountId: string | null | undefined,
    date: Date | null | undefined,
    overrideReason: string | undefined,
    actor: Actor | undefined,
    context: { entityId: string; before: string },
  ) {
    const closure = await this.financeClosuresService.isDateLocked(
      accountId,
      date,
    );
    if (!closure) return;

    if (!overrideReason?.trim()) {
      throw new BadRequestException(
        `Este lancamento pertence a um periodo ja fechado (${closure.periodStart.toISOString().slice(0, 10)}). Informe um motivo (overrideReason) para alterar mesmo assim.`,
      );
    }

    await this.auditService.log({
      actor,
      action: 'FINANCE_ENTRY_EDITED_AFTER_CLOSURE',
      entity: 'FinanceEntry',
      entityId: context.entityId,
      details: `Fechamento ${closure.periodStart.toISOString().slice(0, 10)}. Motivo: ${overrideReason}. Antes: ${context.before}`,
    });
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

    let accountId = dto.accountId;
    if (!accountId) {
      const defaultAccount = await this.financeAccountsService
        .getDefault()
        .catch(() => null);
      accountId = defaultAccount?.id;
    }

    return this.prisma.client.financeEntry.create({
      data: {
        type: dto.type,
        description: dto.description,
        categoryId: dto.categoryId,
        amount: dto.amount,
        dueDate: new Date(dto.dueDate),
        recurrence: dto.recurrence,
        accountId,
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

  async update(id: string, dto: UpdateFinanceEntryDto, actor?: Actor) {
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

    if (entry.status === 'PAID') {
      await this.assertEditAllowed(
        entry.accountId,
        entry.paidAt,
        dto.overrideReason,
        actor,
        { entityId: entry.id, before: JSON.stringify(entry) },
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
        accountId: dto.accountId,
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

  async pay(id: string, dto: PayFinanceEntryDto, actor?: Actor) {
    const entry = await this.findOne(id);
    if (entry.status !== 'PENDING') {
      throw new BadRequestException('Este lancamento ja foi processado.');
    }

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    await this.assertEditAllowed(
      entry.accountId,
      paidAt,
      dto.overrideReason,
      actor,
      { entityId: entry.id, before: JSON.stringify(entry) },
    );

    const paid = await this.prisma.client.financeEntry.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt,
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
            accountId: entry.accountId,
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

  // Transferencia entre contas proprias: nao e receita nem despesa "de
  // verdade", entao os dois lancamentos nascem isTransfer=true e ja PAID
  // (uma transferencia e instantanea) -- o fechamento e o Previsto x
  // Realizado excluem isTransfer=true das somas de entrada/saida.
  async transfer(dto: TransferFinanceEntryDto, actor?: Actor) {
    if (dto.fromAccountId === dto.toAccountId) {
      throw new BadRequestException(
        'A conta de origem e destino devem ser diferentes.',
      );
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.client.financeAccount.findUnique({
        where: { id: dto.fromAccountId },
      }),
      this.prisma.client.financeAccount.findUnique({
        where: { id: dto.toAccountId },
      }),
    ]);
    if (!fromAccount || !toAccount) {
      throw new NotFoundException('Conta de origem ou destino nao encontrada.');
    }

    const date = dto.date ? new Date(dto.date) : new Date();
    const expenseCategory = await getOrCreateCategory(
      this.prisma,
      'Transferencia entre Contas',
      'EXPENSE',
    );
    const incomeCategory = await getOrCreateCategory(
      this.prisma,
      'Transferencia entre Contas',
      'INCOME',
    );
    const transferGroupId = crypto.randomUUID();

    const [outEntry, inEntry] = await this.prisma.client.$transaction([
      this.prisma.client.financeEntry.create({
        data: {
          type: 'EXPENSE',
          description: `Transferencia para ${toAccount.name}: ${dto.description}`,
          categoryId: expenseCategory.id,
          amount: dto.amount,
          dueDate: date,
          status: 'PAID',
          paidAt: date,
          paidAmount: dto.amount,
          accountId: fromAccount.id,
          isTransfer: true,
          transferGroupId,
        },
        include: this.include(),
      }),
      this.prisma.client.financeEntry.create({
        data: {
          type: 'INCOME',
          description: `Transferencia de ${fromAccount.name}: ${dto.description}`,
          categoryId: incomeCategory.id,
          amount: dto.amount,
          dueDate: date,
          status: 'PAID',
          paidAt: date,
          paidAmount: dto.amount,
          accountId: toAccount.id,
          isTransfer: true,
          transferGroupId,
        },
        include: this.include(),
      }),
    ]);

    await this.auditService.log({
      actor,
      action: 'FINANCE_TRANSFER',
      entity: 'FinanceEntry',
      entityId: transferGroupId,
      details: `${fromAccount.name} -> ${toAccount.name}: ${dto.amount.toFixed(2)} (${dto.description})`,
    });

    return { outEntry, inEntry };
  }
}

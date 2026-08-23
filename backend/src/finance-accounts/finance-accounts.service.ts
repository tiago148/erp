import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreateFinanceAccountDto } from './dto/create-finance-account.dto';
import { UpdateFinanceAccountDto } from './dto/update-finance-account.dto';

@Injectable()
export class FinanceAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDefault() {
    const account = await this.prisma.client.financeAccount.findFirst({
      where: { isDefault: true },
    });
    if (!account) {
      throw new NotFoundException(
        'Nenhuma conta padrao configurada. Cadastre uma conta em Financeiro > Contas.',
      );
    }
    return account;
  }

  async create(dto: CreateFinanceAccountDto, actor?: Actor) {
    if (dto.isDefault) {
      await this.prisma.client.financeAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await this.prisma.client.financeAccount.create({
      data: {
        name: dto.name,
        type: dto.type,
        initialBalance: dto.initialBalance ?? 0,
        isDefault: dto.isDefault ?? false,
        active: dto.active ?? true,
      },
    });

    await this.auditService.log({
      actor,
      action: 'FINANCE_ACCOUNT_CREATE',
      entity: 'FinanceAccount',
      entityId: created.id,
      details: created.name,
    });

    return created;
  }

  findAll() {
    return this.prisma.client.financeAccount.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.client.financeAccount.findUnique({
      where: { id },
    });
    if (!account) throw new NotFoundException('Conta nao encontrada.');
    return account;
  }

  async update(id: string, dto: UpdateFinanceAccountDto, actor?: Actor) {
    await this.findOne(id);

    if (dto.isDefault) {
      await this.prisma.client.financeAccount.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.client.financeAccount.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        initialBalance: dto.initialBalance,
        isDefault: dto.isDefault,
        active: dto.active,
      },
    });

    await this.auditService.log({
      actor,
      action: 'FINANCE_ACCOUNT_UPDATE',
      entity: 'FinanceAccount',
      entityId: updated.id,
      details: updated.name,
    });

    return updated;
  }

  async remove(id: string, actor?: Actor) {
    const existing = await this.findOne(id);
    const entriesCount = await this.prisma.client.financeEntry.count({
      where: { accountId: id },
    });
    if (entriesCount > 0) {
      throw new BadRequestException(
        'Esta conta possui lancamentos vinculados e nao pode ser excluida.',
      );
    }
    if (existing.isDefault) {
      throw new BadRequestException(
        'Nao e possivel excluir a conta padrao. Defina outra conta como padrao antes.',
      );
    }

    await this.prisma.client.financeAccount.delete({ where: { id } });

    await this.auditService.log({
      actor,
      action: 'FINANCE_ACCOUNT_DELETE',
      entity: 'FinanceAccount',
      entityId: existing.id,
      details: existing.name,
    });

    return existing;
  }
}

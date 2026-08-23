import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { round2 } from '../common/money';
import { AuditService, Actor } from '../audit/audit.service';
import {
  CreatePriceAdjustmentDto,
  PriceAdjustmentTarget,
} from './dto/create-price-adjustment.dto';

const targetLabels: Record<PriceAdjustmentTarget, string> = {
  LABOR_ROLE: 'Mão de Obra',
  MATERIAL: 'Materiais',
  FIXED_EXPENSE: 'Despesas Fixas',
};

@Injectable()
export class PriceAdjustmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePriceAdjustmentDto, actor?: Actor) {
    const itemsAffected = await this.applyAdjustment(dto);

    const record = await this.prisma.client.priceAdjustment.create({
      data: {
        target: dto.target,
        percentage: dto.percentage,
        categoryFilter: dto.categoryFilter,
        itemsAffected,
        actorEmail: actor?.email,
      },
    });

    await this.auditService.log({
      actor,
      action: 'PRICE_ADJUSTMENT',
      entity: 'PriceAdjustment',
      entityId: record.id,
      details: `${targetLabels[dto.target]}: ${dto.percentage > 0 ? '+' : ''}${dto.percentage}%${dto.categoryFilter ? ` (categoria: ${dto.categoryFilter})` : ''} — ${itemsAffected} item(ns)`,
    });

    return record;
  }

  private async applyAdjustment(dto: CreatePriceAdjustmentDto) {
    if ((dto.target as string) === 'LABOR_ROLE') {
      const roles = await this.prisma.client.laborRole.findMany();
      if (roles.length === 0) return 0;
      await this.prisma.client.$transaction(
        roles.map((r) =>
          this.prisma.client.laborRole.update({
            where: { id: r.id },
            data: {
              hourlyRate: round2(
                Number(r.hourlyRate) * (1 + dto.percentage / 100),
              ),
            },
          }),
        ),
      );
      return roles.length;
    }

    if ((dto.target as string) === 'MATERIAL') {
      const materials = await this.prisma.client.material.findMany({
        where: dto.categoryFilter
          ? { category: dto.categoryFilter }
          : undefined,
      });
      if (materials.length === 0) return 0;
      await this.prisma.client.$transaction(
        materials.map((m) =>
          this.prisma.client.material.update({
            where: { id: m.id },
            data: {
              unitCost: round2(Number(m.unitCost) * (1 + dto.percentage / 100)),
            },
          }),
        ),
      );
      return materials.length;
    }

    const expenses = await this.prisma.client.fixedExpense.findMany({
      where: dto.categoryFilter ? { category: dto.categoryFilter } : undefined,
    });
    if (expenses.length === 0) return 0;
    await this.prisma.client.$transaction(
      expenses.map((e) =>
        this.prisma.client.fixedExpense.update({
          where: { id: e.id },
          data: {
            amount: round2(Number(e.amount) * (1 + dto.percentage / 100)),
          },
        }),
      ),
    );
    return expenses.length;
  }

  findAll() {
    return this.prisma.client.priceAdjustment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

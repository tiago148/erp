import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService, Actor } from '../audit/audit.service';
import { CreateCyclicCountDto } from './dto/create-cyclic-count.dto';
import {
  FREQ_BY_CLASS,
  TOLERANCE_BY_CLASS,
  CLASS_ACCURACY_TARGET,
  resolveAbcClasses,
  effectiveAbcClass,
  AbcClass,
} from '../common/abc-classification';

@Injectable()
export class CyclicCountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.client.cyclicCount.findMany({
      include: { responsible: true },
      orderBy: { countDate: 'desc' },
    });
  }

  /** Lista de itens a contar, agrupados por classe (mais D = vencidos). */
  async plan() {
    const items = await this.prisma.client.stockItem.findMany({
      include: {
        material: true,
        movements: { orderBy: { movedAt: 'desc' } },
        countItems: {
          include: { cyclicCount: true },
          orderBy: { cyclicCount: { countDate: 'desc' } },
          take: 1,
        },
      },
      orderBy: { material: { name: 'asc' } },
    });

    const since12 = new Date();
    since12.setMonth(since12.getMonth() - 12);
    const abcInput = items.map((i) => ({
      id: i.id,
      consumptionValue12m: i.movements
        .filter((m) => m.type === 'OUT' && m.movedAt >= since12)
        .reduce((a, m) => a + Number(m.quantity), 0) * Number(i.material.unitCost),
    }));
    const auto = resolveAbcClasses(abcInput);

    const now = Date.now();
    const buckets: Record<'A' | 'B' | 'C' | 'D', any[]> = { A: [], B: [], C: [], D: [] };
    for (const i of items) {
      const cls = effectiveAbcClass(i.abcClass, auto[i.id]);
      const last = i.countItems[0]?.cyclicCount?.countDate ?? null;
      const daysSince = last ? Math.floor((now - new Date(last).getTime()) / 86400000) : null;
      const due = daysSince === null || daysSince >= FREQ_BY_CLASS[cls];
      const row = {
        id: i.id,
        name: i.material.name,
        unit: i.material.unit,
        address: this.addressOf(i),
        className: cls,
        systemQty: Number(i.quantity),
        unitCost: Number(i.material.unitCost),
        lastCountDate: last,
        daysSince,
        due,
      };
      buckets[cls].push(row);
      if (due) buckets.D.push(row);
    }

    return {
      tolerances: TOLERANCE_BY_CLASS,
      frequencies: FREQ_BY_CLASS,
      targets: CLASS_ACCURACY_TARGET,
      buckets,
    };
  }

  private addressOf(i: {
    addrStreet: string | null;
    addrShelf: string | null;
    addrLevel: string | null;
    addrPosition: string | null;
    location: string | null;
  }) {
    if (i.addrStreet && i.addrShelf) {
      return [i.addrStreet, i.addrShelf, i.addrLevel, i.addrPosition]
        .filter(Boolean)
        .join('-')
        .toUpperCase();
    }
    return i.location ?? '';
  }

  async create(dto: CreateCyclicCountDto, actor?: Actor) {
    if (!dto.items.length) throw new BadRequestException('Nenhum item contado.');

    const stockItems = await this.prisma.client.stockItem.findMany({
      where: { id: { in: dto.items.map((x) => x.stockItemId) } },
      include: { material: true, movements: { orderBy: { movedAt: 'desc' } } },
    });
    const byId = new Map(stockItems.map((s) => [s.id, s]));

    const since12 = new Date();
    since12.setMonth(since12.getMonth() - 12);
    const allItems = await this.prisma.client.stockItem.findMany({
      include: { material: true, movements: { orderBy: { movedAt: 'desc' } } },
    });
    const auto = resolveAbcClasses(
      allItems.map((i) => ({
        id: i.id,
        consumptionValue12m: i.movements
          .filter((m) => m.type === 'OUT' && m.movedAt >= since12)
          .reduce((a, m) => a + Number(m.quantity), 0) * Number(i.material.unitCost),
      })),
    );

    const countDate = dto.countDate ? new Date(dto.countDate) : new Date();
    const detail: {
      stockItemId: string;
      className: string;
      systemQty: number;
      countedQty: number;
      diff: number;
      diffPct: number;
      adjusted: boolean;
      unitCost: number;
      withinTolerance: boolean;
      name: string;
    }[] = [];

    for (const it of dto.items) {
      const si = byId.get(it.stockItemId);
      if (!si) throw new BadRequestException('Item de estoque inexistente na contagem.');
      const cls: AbcClass = effectiveAbcClass(si.abcClass, auto[si.id]);
      const systemQty = Number(si.quantity);
      const diff = it.countedQty - systemQty;
      const diffPct = systemQty > 0 ? (Math.abs(diff) / systemQty) * 100 : diff !== 0 ? 100 : 0;
      const tol = TOLERANCE_BY_CLASS[cls];
      const withinTolerance = diffPct <= tol;
      const adjusted = Math.abs(diff) > 0.001 && withinTolerance;
      detail.push({
        stockItemId: si.id,
        className: cls,
        systemQty,
        countedQty: it.countedQty,
        diff,
        diffPct,
        adjusted,
        unitCost: Number(si.material.unitCost),
        withinTolerance,
        name: si.material.name,
      });
    }

    const correct = detail.filter((d) => Math.abs(d.diff) < 0.001).length;
    const divergent = detail.length - correct;
    const accuracy = detail.length ? (correct / detail.length) * 100 : 0;
    const adjustmentValue = detail
      .filter((d) => Math.abs(d.diff) >= 0.001)
      .reduce((a, d) => a + d.diff * d.unitCost, 0);
    const pending = detail.filter((d) => Math.abs(d.diff) >= 0.001 && !d.withinTolerance);
    const adjustedCount = detail.filter((d) => d.adjusted).length;

    const result = await this.prisma.client.$transaction(async (tx) => {
      const count = await tx.cyclicCount.create({
        data: {
          countDate,
          className: dto.className,
          responsibleId: dto.responsibleId || null,
          totalItems: detail.length,
          correctItems: correct,
          divergentItems: divergent,
          accuracyPct: Number(accuracy.toFixed(2)),
          adjustmentValue: Number(adjustmentValue.toFixed(2)),
          adjustedItems: adjustedCount,
          pendingItems: pending.map((p) => p.name),
          items: {
            create: detail.map((d) => ({
              stockItemId: d.stockItemId,
              className: d.className,
              systemQty: d.systemQty,
              countedQty: d.countedQty,
              diff: d.diff,
              diffPct: Number(d.diffPct.toFixed(2)),
              adjusted: d.adjusted,
            })),
          },
        },
        include: { responsible: true, items: true },
      });

      for (const d of detail.filter((x) => x.adjusted)) {
        await tx.stockMovement.create({
          data: {
            stockItemId: d.stockItemId,
            type: d.diff > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(d.diff),
            notes: 'Ajuste de inventario ciclico',
          },
        });
        await tx.stockItem.update({
          where: { id: d.stockItemId },
          data: { quantity: d.countedQty },
        });
      }

      return count;
    });

    await this.auditService.log({
      actor,
      action: 'CYCLIC_COUNT_CREATE',
      entity: 'CyclicCount',
      entityId: result.id,
      details: `Classe ${dto.className} - ${detail.length} itens - acuracidade ${accuracy.toFixed(1)}%`,
    });

    return result;
  }
}

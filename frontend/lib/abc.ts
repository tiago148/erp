import type { AbcClass, StockItem } from '@/lib/api';

export const FREQ_BY_CLASS: Record<AbcClass, number> = { A: 30, B: 90, C: 180 };
export const TOLERANCE_BY_CLASS: Record<AbcClass, number> = { A: 2, B: 3, C: 5 };
export const CLASS_ACCURACY_TARGET: Record<AbcClass, number> = { A: 98, B: 95, C: 90 };

export const abcBadgeClass: Record<AbcClass, string> = {
  A: 'bg-destructive/15 text-destructive border border-destructive/30',
  B: 'bg-warning/15 text-warning border border-warning/30',
  C: 'bg-muted text-muted-foreground border border-border',
};

const WORK_DAYS = 22;

/** Espelha computeReorderPoint do backend (secao V15 do prototipo). */
export function reorderPointPreview(
  monthlyConsumption: number | null | undefined,
  leadTimeDays: number | null | undefined,
  serviceLevelZ: number | null | undefined,
) {
  const cons = Number(monthlyConsumption) || 0;
  if (cons <= 0) return { dailyConsumption: 0, safetyStock: 0, reorderPoint: 0 };
  const lt = Number(leadTimeDays) || 7;
  const z = Number(serviceLevelZ) || 1.65;
  const dailyConsumption = cons / WORK_DAYS;
  const safetyStock = z * ((cons * 0.25) / Math.sqrt(WORK_DAYS)) * Math.sqrt(lt);
  return { dailyConsumption, safetyStock, reorderPoint: dailyConsumption * lt + safetyStock };
}

export function stockAddress(i: {
  addrStreet?: string; addrShelf?: string; addrLevel?: string; addrPosition?: string; location?: string;
}) {
  if (i.addrStreet && i.addrShelf) {
    return [i.addrStreet, i.addrShelf, i.addrLevel, i.addrPosition].filter(Boolean).join('-').toUpperCase();
  }
  return i.location || '';
}

export function effectiveClass(item: StockItem): AbcClass {
  return item.abcClass && item.abcClass !== 'AUTO' ? (item.abcClass as AbcClass) : item.abcResolved;
}

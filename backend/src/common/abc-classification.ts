// Classificacao ABC de estoque, ponto de pedido e parametros de inventario
// ciclico. Espelha as regras do prototipo (secao V15):
//  - Classe ABC pela curva de valor consumido nos ultimos 12 meses
//    (acumulado ate 80% = A, ate 95% = B, o resto = C).
//  - Ponto de pedido = consumo diario x lead time + estoque de seguranca,
//    usando desvio de 25% sobre o consumo mensal e 22 dias uteis.
//  - Frequencia e tolerancia de divergencia por classe.

export type AbcClass = 'A' | 'B' | 'C';

export const FREQ_BY_CLASS: Record<AbcClass, number> = { A: 30, B: 90, C: 180 };
export const TOLERANCE_BY_CLASS: Record<AbcClass, number> = { A: 2, B: 3, C: 5 };
export const CLASS_ACCURACY_TARGET: Record<AbcClass, number> = { A: 98, B: 95, C: 90 };

const WORK_DAYS_PER_MONTH = 22;

export interface AbcInput {
  id: string;
  /** Valor total consumido nos ultimos 12 meses (saidas x custo unitario). */
  consumptionValue12m: number;
}

/**
 * Resolve a classe automatica de cada item. Itens sem consumo caem em C.
 */
export function resolveAbcClasses(items: AbcInput[]): Record<string, AbcClass> {
  const out: Record<string, AbcClass> = {};
  const withMovement = items
    .filter((x) => x.consumptionValue12m > 0)
    .sort((a, b) => b.consumptionValue12m - a.consumptionValue12m);
  const total = withMovement.reduce((a, x) => a + x.consumptionValue12m, 0);
  let acc = 0;
  withMovement.forEach((x) => {
    acc += x.consumptionValue12m;
    const p = total > 0 ? (acc / total) * 100 : 0;
    out[x.id] = p <= 80 ? 'A' : p <= 95 ? 'B' : 'C';
  });
  items
    .filter((x) => x.consumptionValue12m <= 0)
    .forEach((x) => {
      out[x.id] = 'C';
    });
  return out;
}

/**
 * Classe efetiva do item: manual quando definida, senao a automatica.
 */
export function effectiveAbcClass(
  stored: string | null | undefined,
  auto: AbcClass | undefined,
): AbcClass {
  if (stored && stored !== 'AUTO') return stored as AbcClass;
  return auto ?? 'C';
}

/**
 * Ponto de pedido. `monthlyConsumption` deve vir preenchido (manual ou
 * calculado do historico de 6 meses). Retorna 0 quando nao ha consumo.
 */
export function computeReorderPoint(
  monthlyConsumption: number | null | undefined,
  leadTimeDays: number | null | undefined,
  serviceLevelZ: number | null | undefined,
): number {
  const cons = Number(monthlyConsumption) || 0;
  if (cons <= 0) return 0;
  const lt = Number(leadTimeDays) || 7;
  const z = Number(serviceLevelZ) || 1.65;
  const dailyConsumption = cons / WORK_DAYS_PER_MONTH;
  const deviation = cons * 0.25;
  const safetyStock = z * (deviation / Math.sqrt(WORK_DAYS_PER_MONTH)) * Math.sqrt(lt);
  return dailyConsumption * lt + safetyStock;
}

/**
 * Consumo mensal medio a partir das saidas dos ultimos 6 meses.
 */
export function monthlyConsumptionFromHistory(outQuantities6m: number[]): number {
  const total = outQuantities6m.reduce((a, q) => a + q, 0);
  return total / 6;
}

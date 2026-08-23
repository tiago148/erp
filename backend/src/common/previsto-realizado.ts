import { round2 } from './money';

export type ComparisonKind = 'cost' | 'revenue';
export type ComparisonStatus = 'DENTRO' | 'ATENCAO' | 'POSITIVO';

export interface ComparisonRow {
  planned: number;
  actual: number;
  diff: number;
  executionPct: number | null;
  status: ComparisonStatus;
}

// Regra principal do Previsto x Realizado: diferenca = realizado - previsto,
// percentual de execucao = realizado / previsto * 100 (com guarda contra
// divisao por zero), e status por tipo de linha:
//   custo:   realizado > previsto  -> ATENCAO, senao DENTRO
//   receita: realizado >= previsto -> POSITIVO, senao ATENCAO
export function compareRow(
  planned: number,
  actual: number,
  kind: ComparisonKind,
): ComparisonRow {
  const diff = round2(actual - planned);
  const executionPct = planned !== 0 ? round2((actual / planned) * 100) : null;
  const status: ComparisonStatus =
    kind === 'cost'
      ? actual > planned
        ? 'ATENCAO'
        : 'DENTRO'
      : actual >= planned
        ? 'POSITIVO'
        : 'ATENCAO';

  return {
    planned: round2(planned),
    actual: round2(actual),
    diff,
    executionPct,
    status,
  };
}

export interface MarginComparison {
  plannedPct: number | null;
  actualPct: number | null;
  diffPp: number | null;
}

// Margem = (receita - custo) / receita * 100. Guarda contra receita zero
// (nao ha percentual de margem sem receita) e retorna a diferenca em pontos
// percentuais (nao em %), que e o que faz sentido comparar entre duas margens.
export function compareMargin(
  plannedRevenue: number,
  plannedCost: number,
  actualRevenue: number,
  actualCost: number,
): MarginComparison {
  const plannedPct =
    plannedRevenue !== 0
      ? round2(((plannedRevenue - plannedCost) / plannedRevenue) * 100)
      : null;
  const actualPct =
    actualRevenue !== 0
      ? round2(((actualRevenue - actualCost) / actualRevenue) * 100)
      : null;
  const diffPp =
    plannedPct !== null && actualPct !== null
      ? round2(actualPct - plannedPct)
      : null;

  return { plannedPct, actualPct, diffPp };
}

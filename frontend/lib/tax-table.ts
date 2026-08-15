// Mirrors TAX_TABLE in backend/src/budgets/budgets.service.ts exactly —
// keep both in sync if rates ever change.
export const TAX_TABLE: Record<string, { name: string; rate: number }[]> = {
  SIMPLES: [
    { name: 'ISS', rate: 2 },
    { name: 'COFINS', rate: 1.5 },
    { name: 'PIS', rate: 0.5 },
    { name: 'CPP', rate: 2 },
  ],
  LUCRO_PRESUMIDO: [
    { name: 'IRPJ', rate: 4.8 },
    { name: 'CSLL', rate: 2.88 },
    { name: 'PIS', rate: 0.65 },
    { name: 'COFINS', rate: 3 },
    { name: 'ISS', rate: 2 },
  ],
  LUCRO_REAL: [
    { name: 'IRPJ', rate: 7.2 },
    { name: 'CSLL', rate: 2.16 },
    { name: 'PIS', rate: 1.65 },
    { name: 'COFINS', rate: 7.6 },
    { name: 'ISS', rate: 2 },
  ],
  MEI: [],
};

export function getImpostoPct(regime: string): number {
  return (TAX_TABLE[regime] || []).reduce((sum, tax) => sum + tax.rate, 0);
}

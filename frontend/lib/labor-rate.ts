const HOURS_PER_MONTH_REFERENCE = 220;

export interface LaborRoleForRate {
  hourlyRate: number;
  chargesPct: number;
  periculosidade: boolean;
  insalubridadePct: number;
  noturnoPct: number;
  beneficioHora?: number;
  ferramentalHora?: number;
}

// Mirrors calculateLaborRoleEffectiveRate in backend/src/common/labor-rate.ts exactly.
export function calculateLaborRoleEffectiveRate(
  role: LaborRoleForRate,
  salarioMinimo: number,
) {
  const baseRate = role.hourlyRate;
  const periculosidadeValue = role.periculosidade ? baseRate * 0.3 : 0;
  const insalubridadeValue =
    (role.insalubridadePct / 100) * (salarioMinimo / HOURS_PER_MONTH_REFERENCE);
  const noturnoValue = baseRate * (role.noturnoPct / 100);
  const beneficioHora = role.beneficioHora ?? 0;
  const ferramentalHora = role.ferramentalHora ?? 0;

  const rateWithAdditions =
    baseRate + periculosidadeValue + insalubridadeValue + noturnoValue;
  const effectiveHourlyRate =
    rateWithAdditions * (1 + role.chargesPct / 100) + beneficioHora + ferramentalHora;

  return {
    baseRate,
    periculosidadeValue,
    insalubridadeValue,
    noturnoValue,
    rateWithAdditions,
    beneficioHora,
    ferramentalHora,
    effectiveHourlyRate,
  };
}

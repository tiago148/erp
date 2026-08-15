const HOURS_PER_MONTH_REFERENCE = 220;

export interface LaborRoleForRate {
  hourlyRate: number;
  chargesPct: number;
  periculosidade: boolean;
  insalubridadePct: number;
  noturnoPct: number;
}

// Adicionais legais somam sobre a hora-base ANTES dos encargos (chargesPct),
// pois encargos incidem sobre a remuneração total do trabalhador, incluindo
// os adicionais — não apenas sobre o salário-base.
export function calculateLaborRoleEffectiveRate(
  role: LaborRoleForRate,
  salarioMinimo: number,
) {
  const baseRate = role.hourlyRate;
  const periculosidadeValue = role.periculosidade ? baseRate * 0.3 : 0;
  const insalubridadeValue =
    (role.insalubridadePct / 100) * (salarioMinimo / HOURS_PER_MONTH_REFERENCE);
  const noturnoValue = baseRate * (role.noturnoPct / 100);

  const rateWithAdditions =
    baseRate + periculosidadeValue + insalubridadeValue + noturnoValue;
  const effectiveHourlyRate = rateWithAdditions * (1 + role.chargesPct / 100);

  return {
    baseRate,
    periculosidadeValue,
    insalubridadeValue,
    noturnoValue,
    rateWithAdditions,
    effectiveHourlyRate,
  };
}

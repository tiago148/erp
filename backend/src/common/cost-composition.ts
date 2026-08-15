import { calculateLaborRoleEffectiveRate } from './labor-rate';

export function calculateCompositionUnitCost(
  composition: any,
  salarioMinimo: number,
) {
  const materialCost = composition.materials.reduce(
    (sum: number, item: any) =>
      sum + Number(item.coefficient) * Number(item.material.unitCost),
    0,
  );
  const laborCost = composition.labor.reduce((sum: number, item: any) => {
    const { effectiveHourlyRate } = calculateLaborRoleEffectiveRate(
      {
        hourlyRate: Number(item.laborRole.hourlyRate),
        chargesPct: Number(item.laborRole.chargesPct),
        periculosidade: item.laborRole.periculosidade,
        insalubridadePct: Number(item.laborRole.insalubridadePct),
        noturnoPct: Number(item.laborRole.noturnoPct),
      },
      salarioMinimo,
    );
    return sum + Number(item.hoursPerUnit) * effectiveHourlyRate;
  }, 0);
  const totalHours = composition.labor.reduce(
    (sum: number, item: any) => sum + Number(item.hoursPerUnit),
    0,
  );

  return {
    materialCost,
    laborCost,
    unitCost: materialCost + laborCost,
    totalHours,
  };
}

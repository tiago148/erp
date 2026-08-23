import { calculateLaborRoleEffectiveRate } from './labor-rate';
import { calculateMaterialReferencePrice } from './material-price';

export function calculateCompositionUnitCost(
  composition: any,
  salarioMinimo: number,
) {
  const materialCost = composition.materials.reduce(
    (sum: number, item: any) => {
      const { referencePrice } = calculateMaterialReferencePrice(
        {
          unitCost: Number(item.material.unitCost),
          referenceMode: item.material.referenceMode,
          manualQuoteId: item.material.manualQuoteId,
        },
        (item.material.quotes ?? []).map((q: any) => ({
          id: q.id,
          price: Number(q.price),
          quantity: Number(q.quantity),
          freight: Number(q.freight),
          freightModality: q.freightModality,
          validUntil: q.validUntil,
        })),
      );
      return sum + Number(item.coefficient) * referencePrice;
    },
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
        beneficioHora: Number(item.laborRole.beneficioHora),
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

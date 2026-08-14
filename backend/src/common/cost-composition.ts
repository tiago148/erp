export function calculateCompositionUnitCost(composition: any) {
  const materialCost = composition.materials.reduce(
    (sum: number, item: any) =>
      sum + Number(item.coefficient) * Number(item.material.unitCost),
    0,
  );
  const laborCost = composition.labor.reduce((sum: number, item: any) => {
    const effectiveRate =
      Number(item.laborRole.hourlyRate) *
      (1 + Number(item.laborRole.chargesPct) / 100);
    return sum + Number(item.hoursPerUnit) * effectiveRate;
  }, 0);
  const totalHours = composition.labor.reduce(
    (sum: number, item: any) => sum + Number(item.hoursPerUnit),
    0,
  );

  return { materialCost, laborCost, unitCost: materialCost + laborCost, totalHours };
}

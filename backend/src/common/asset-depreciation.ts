const DAYS_PER_MONTH = 30.44;

export interface AssetForDepreciation {
  acquisitionValue: number;
  acquisitionDate: Date;
  usefulLifeMonths: number;
  residualValue: number;
}

// Depreciação linear: o valor depreciável (aquisição - residual) é diluído
// igualmente ao longo da vida útil. Após o fim da vida útil o ativo já está
// totalmente depreciado e para de gerar despesa de depreciação — mas o custo
// de oportunidade sobre o valor contábil residual continua sendo calculado
// por quem chama calculateAssetMonthlyCost, a partir do bookValue retornado aqui.
export function calculateAssetDepreciation(
  asset: AssetForDepreciation,
  now: Date = new Date(),
) {
  const depreciableValue = Math.max(
    0,
    asset.acquisitionValue - asset.residualValue,
  );
  const monthlyDepreciation =
    asset.usefulLifeMonths > 0 ? depreciableValue / asset.usefulLifeMonths : 0;

  const ageMonths = Math.max(
    0,
    (now.getTime() - asset.acquisitionDate.getTime()) /
      (1000 * 60 * 60 * 24 * DAYS_PER_MONTH),
  );
  const isFullyDepreciated = ageMonths >= asset.usefulLifeMonths;

  const accumulatedDepreciation = Math.min(
    depreciableValue,
    monthlyDepreciation * ageMonths,
  );
  const bookValue = asset.acquisitionValue - accumulatedDepreciation;

  return {
    monthlyDepreciation,
    accumulatedDepreciation,
    bookValue,
    isFullyDepreciated,
  };
}

export interface HourlyMachineAsset extends AssetForDepreciation {
  productiveHoursPerYear: number;
  annualMaintenance: number;
  operatingCostPerHour: number;
}

// Custo horario de maquina de porte apropriada por hora de uso na obra
// (secao V17 do prototipo): (depreciacao + custo de capital ao ano +
// manutencao ao ano) / horas produtivas ao ano + operacao por hora.
// Este bem NAO entra no rateio da estrutura.
export function computeHourlyMachineCost(
  asset: HourlyMachineAsset,
  opportunityCostPct: number,
  now: Date = new Date(),
) {
  const dep = calculateAssetDepreciation(asset, now);
  const depreciationYear = dep.isFullyDepreciated
    ? 0
    : dep.monthlyDepreciation * 12;
  const capitalYear = dep.bookValue * (opportunityCostPct / 100) * 12;
  const hours = asset.productiveHoursPerYear > 0 ? asset.productiveHoursPerYear : 1;
  const hourlyRate =
    (depreciationYear + capitalYear + asset.annualMaintenance) / hours +
    asset.operatingCostPerHour;
  return {
    depreciationYear,
    capitalYear,
    annualMaintenance: asset.annualMaintenance,
    hours,
    operatingCostPerHour: asset.operatingCostPerHour,
    hourlyRate,
  };
}

export function calculateAssetMonthlyCost(
  asset: AssetForDepreciation,
  opportunityCostPct: number,
  now: Date = new Date(),
) {
  const depreciation = calculateAssetDepreciation(asset, now);
  const depreciationContribution = depreciation.isFullyDepreciated
    ? 0
    : depreciation.monthlyDepreciation;
  const opportunityCostContribution =
    depreciation.bookValue * (opportunityCostPct / 100);

  return {
    ...depreciation,
    depreciationContribution,
    opportunityCostContribution,
    totalMonthlyCost: depreciationContribution + opportunityCostContribution,
  };
}

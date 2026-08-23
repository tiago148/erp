export type MaintenanceAlertLevel = 'OK' | 'ATENCAO' | 'VENCIDO';

export interface MaintenancePlanForCompute {
  intervalType: 'KM' | 'MONTHS';
  intervalKm: number | null;
  intervalMonths: number | null;
  alertThresholdKm: number | null;
  alertThresholdDays: number | null;
  lastServiceDate: Date | null;
  lastServiceKm: number | null;
  createdAt: Date;
}

export interface MaintenanceStatus {
  nextDueKm: number | null;
  nextDueDate: Date | null;
  kmRemaining: number | null;
  daysRemaining: number | null;
  level: MaintenanceAlertLevel;
}

// KM-based (só faz sentido para veículos, que têm odômetro): a próxima
// revisão é a última execução registrada + o intervalo; sem execução
// registrada ainda, conta a partir de zero (0 + intervalo).
// MONTHS-based (veículos ou ferramentas): mesma ideia, mas em datas —
// sem execução registrada, conta a partir da criação do plano.
export function computeMaintenanceStatus(
  plan: MaintenancePlanForCompute,
  currentKm: number | null,
  now: Date = new Date(),
): MaintenanceStatus {
  if (plan.intervalType === 'KM') {
    const intervalKm = plan.intervalKm ?? 0;
    const baseKm = plan.lastServiceKm ?? 0;
    const nextDueKm = baseKm + intervalKm;
    const kmRemaining = currentKm !== null ? nextDueKm - currentKm : null;
    const threshold = plan.alertThresholdKm ?? 0;

    let level: MaintenanceAlertLevel = 'OK';
    if (kmRemaining !== null) {
      if (kmRemaining <= 0) level = 'VENCIDO';
      else if (kmRemaining <= threshold) level = 'ATENCAO';
    }

    return {
      nextDueKm,
      nextDueDate: null,
      kmRemaining,
      daysRemaining: null,
      level,
    };
  }

  const intervalMonths = plan.intervalMonths ?? 0;
  const base = plan.lastServiceDate ?? plan.createdAt;
  const nextDueDate = new Date(base);
  nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);

  const daysRemaining = Math.ceil(
    (nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const thresholdDays = plan.alertThresholdDays ?? 15;

  let level: MaintenanceAlertLevel = 'OK';
  if (daysRemaining <= 0) level = 'VENCIDO';
  else if (daysRemaining <= thresholdDays) level = 'ATENCAO';

  return {
    nextDueKm: null,
    nextDueDate,
    kmRemaining: null,
    daysRemaining,
    level,
  };
}

import type { Settings } from './api';

type OverheadSettings = Pick<
  Settings,
  | 'overheadMethod'
  | 'overheadFuncCount'
  | 'overheadHoursPerMonth'
  | 'overheadOccupancyPct'
  | 'overheadWorkDaysPerMonth'
  | 'overheadAvgDirectCost'
  | 'overheadAutoApply'
>;

export function computeIndirectCost(
  settings: OverheadSettings | null,
  fixedTotal: number,
  directCost: number,
  laborHours: number,
  projectDays: number,
) {
  if (!settings || !settings.overheadAutoApply || fixedTotal <= 0) return 0;
  const occupancy = settings.overheadOccupancyPct / 100;

  if (settings.overheadMethod === 'DAY') {
    const productiveDays = (settings.overheadWorkDaysPerMonth ?? 22) * occupancy;
    const ratePerDay = productiveDays > 0 ? fixedTotal / productiveDays : 0;
    return ratePerDay * projectDays;
  }
  if (settings.overheadMethod === 'HOUR') {
    const productiveHours = (settings.overheadFuncCount ?? 5) * (settings.overheadHoursPerMonth ?? 176) * occupancy;
    const ratePerHour = productiveHours > 0 ? fixedTotal / productiveHours : 0;
    return ratePerHour * laborHours;
  }
  const avgDirectCost = settings.overheadAvgDirectCost ?? 0;
  const pct = avgDirectCost > 0 ? (fixedTotal / avgDirectCost) * 100 : 0;
  return directCost * (pct / 100);
}

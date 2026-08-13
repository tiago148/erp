import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function marginBadgeVariant(marginPct: number, healthyPct: number, warningPct: number) {
  if (marginPct >= healthyPct) return 'success' as const;
  if (marginPct >= warningPct) return 'warning' as const;
  return 'danger' as const;
}

export function marginLabel(marginPct: number, healthyPct: number, warningPct: number) {
  if (marginPct >= healthyPct) return 'Saudável';
  if (marginPct >= warningPct) return 'Reduzida';
  return 'Crítica';
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function marginBadgeClass(marginPct: number, healthyPct: number, warningPct: number) {
  if (marginPct >= healthyPct) return 'bg-green-100 text-green-700';
  if (marginPct >= warningPct) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export function marginLabel(marginPct: number, healthyPct: number, warningPct: number) {
  if (marginPct >= healthyPct) return 'Saudável';
  if (marginPct >= warningPct) return 'Reduzida';
  return 'Crítica';
}

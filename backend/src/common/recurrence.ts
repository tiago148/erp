export function computeNextOccurrenceDate(
  dueDate: Date,
  recurrence: string,
): Date | null {
  const next = new Date(dueDate);
  if (recurrence === 'WEEKLY') {
    next.setDate(next.getDate() + 7);
    return next;
  }
  if (recurrence === 'MONTHLY') {
    next.setMonth(next.getMonth() + 1);
    return next;
  }
  if (recurrence === 'YEARLY') {
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }
  return null;
}

// Hilfsfunktion zur Berechnung des Deadline-Status (none/yellow/red) anhand konfigurierbarer Schwellwerte
export type DeadlineStatus = 'none' | 'yellow' | 'red';

export function getDeadlineStatus(
  deadline: string | undefined,
  redDays: number,
  yellowDays: number
): DeadlineStatus {
  if (!deadline) return 'none';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + 'T00:00:00');
  const days = Math.floor((due.getTime() - today.getTime()) / 86_400_000);
  if (days <= redDays) return 'red';
  if (days <= yellowDays) return 'yellow';
  return 'none';
}

export function deadlineTextClass(status: DeadlineStatus): string {
  if (status === 'red') return 'text-red-500 font-semibold';
  if (status === 'yellow') return 'text-yellow-600 font-medium';
  return 'text-gray-400';
}

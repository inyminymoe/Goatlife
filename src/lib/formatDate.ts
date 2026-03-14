import { format } from 'date-fns';

export function formatDate(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const minutesDiff = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000 / 60
  );
  const hoursDiff = Math.floor(minutesDiff / 60);

  if (hoursDiff < 24) return format(targetDate, 'HH:mm');

  return format(targetDate, 'yyyy.MM.dd');
}

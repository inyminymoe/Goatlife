import { format } from 'date-fns';

export function formatDate(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  const minutesDiff = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000 / 60
  );
  const hoursDiff = Math.floor(minutesDiff / 60);
  const daysDiff = Math.floor(hoursDiff / 24);

  if (minutesDiff < 1) return '방금 전';
  if (minutesDiff < 60) return `${minutesDiff}분 전`;
  if (hoursDiff < 24) return `${hoursDiff}시간 전`;
  if (daysDiff === 1) return '어제';
  if (daysDiff < 7) return `${daysDiff}일 전`;

  return format(targetDate, 'yyyy.MM.dd');
}

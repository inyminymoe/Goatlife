import type {
  AttendanceLogsParams,
  AttendanceSummaryPeriod,
} from '@/types/attendance';

export const attendanceKeys = {
  all: ['attendance'] as const,
  today: () => [...attendanceKeys.all, 'today'] as const,
  logs: (params: AttendanceLogsParams) =>
    [...attendanceKeys.all, 'logs', params] as const,
  summary: (period: AttendanceSummaryPeriod) =>
    [...attendanceKeys.all, 'summary', period] as const,
};

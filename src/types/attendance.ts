export const ATTENDANCE_STATUSES = [
  'present',
  'late',
  'early_leave',
  'absent',
  'vacation',
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AttendanceSummaryPeriod = 'week' | 'month';

export type AttendanceErrorCode =
  | 'UNAUTHENTICATED'
  | 'ALREADY_CHECKED_IN'
  | 'NO_CHECK_IN_RECORD'
  | 'NO_CLOCK_OUT_RECORD'
  | 'ALREADY_FINALIZED'
  | 'INVALID_RANGE'
  | 'UNKNOWN';

export type AttendanceEmptyStateKey =
  | 'attendance_today_empty'
  | 'attendance_logs_empty'
  | 'attendance_summary_empty';

export type AttendanceResourceState =
  | 'idle'
  | 'loading'
  | 'empty'
  | 'ready'
  | 'error';

export interface AttendanceUiState {
  state: AttendanceResourceState;
  error: AttendanceErrorCode | null;
  emptyKey?: AttendanceEmptyStateKey;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  earlyLeaveAt: string | null;
  workMinutes: number;
  note: string | null;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceSummary {
  period: AttendanceSummaryPeriod;
  from: string;
  to: string;
  totalDays: number;
  attendedDays: number;
  presentDays: number;
  lateDays: number;
  earlyLeaveDays: number;
  absentDays: number;
  vacationDays: number;
  attendanceRate: number;
  totalWorkMinutes: number;
}

export interface AttendanceLogsParams {
  from: string;
  to: string;
  status?: AttendanceStatus;
}

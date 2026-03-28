import type {
  AttendanceErrorCode,
  AttendanceLogsParams,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSummary,
  AttendanceSummaryPeriod,
} from '@/types/attendance';

const KST_TIME_ZONE = 'Asia/Seoul';
const MS_IN_SECOND = 1_000;
const MS_IN_MINUTE = 60_000;

type AttendanceRowStatus = AttendanceStatus | 'none' | 'in' | 'early' | 'out';

export interface AttendanceRow {
  id: string;
  user_id: string;
  work_date: string;
  clock_in_at: string | null;
  early_leave_at: string | null;
  clock_out_at: string | null;
  work_minutes: number | null;
  note?: string | null;
  status: AttendanceRowStatus | null;
  is_manual_close?: boolean | null;
  created_at: string;
  updated_at: string;
}

export const ATTENDANCE_POLICY = {
  dailyTargetMinutes: 8 * 60,
  lateThresholdHour: 9,
  lateThresholdMinute: 0,
} as const;

function getFormatter() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getTimeFormatter() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: KST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getKstDateString(value: Date | string = new Date()) {
  return getFormatter().format(
    typeof value === 'string' ? new Date(value) : value
  );
}

export function getKstHour(value: Date | string = new Date()) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return parseInt(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: KST_TIME_ZONE,
      hour: '2-digit',
      hour12: false,
    }).format(date),
    10
  );
}

export function getKstDateOffsetString(
  offsetDays: number,
  anchor: Date | string = new Date()
) {
  const anchorDate = toUtcDate(getKstDateString(anchor));
  anchorDate.setUTCDate(anchorDate.getUTCDate() + offsetDays);
  return fromUtcDate(anchorDate);
}

function parseDateString(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return { year, month, day };
}

function toUtcDate(dateString: string) {
  const { year, month, day } = parseDateString(dateString);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUtcDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getKstDateRange(
  period: AttendanceSummaryPeriod,
  anchor: Date | string = new Date()
) {
  const anchorDate = getKstDateString(anchor);

  if (period === 'month') {
    const { year, month } = parseDateString(anchorDate);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

    return {
      from: `${year}-${String(month).padStart(2, '0')}-01`,
      to: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    };
  }

  const utcDate = toUtcDate(anchorDate);
  const weekday = utcDate.getUTCDay();
  const diffFromMonday = weekday === 0 ? 6 : weekday - 1;

  const fromDate = new Date(utcDate);
  fromDate.setUTCDate(utcDate.getUTCDate() - diffFromMonday);

  const toDate = new Date(fromDate);
  toDate.setUTCDate(fromDate.getUTCDate() + 6);

  return {
    from: fromUtcDate(fromDate),
    to: fromUtcDate(toDate),
  };
}

export function calculateWorkMinutes(
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (!checkInAt || !checkOutAt) return 0;

  const diff = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.floor(diff / MS_IN_MINUTE);
}

export function calculateWorkSeconds(
  checkInAt: string | null,
  checkOutAt: string | null
) {
  if (!checkInAt || !checkOutAt) return 0;

  const diff = new Date(checkOutAt).getTime() - new Date(checkInAt).getTime();

  if (Number.isNaN(diff) || diff <= 0) {
    return 0;
  }

  return Math.floor(diff / MS_IN_SECOND);
}

export function isLateCheckIn(checkInAt: string | null) {
  if (!checkInAt) return false;

  const formatted = getTimeFormatter().format(new Date(checkInAt));
  const [hour, minute] = formatted.split(':').map(Number);

  if (hour > ATTENDANCE_POLICY.lateThresholdHour) {
    return true;
  }

  return (
    hour === ATTENDANCE_POLICY.lateThresholdHour &&
    minute > ATTENDANCE_POLICY.lateThresholdMinute
  );
}

export function normalizeAttendanceStatus(
  status: AttendanceRowStatus | null,
  row: Pick<
    AttendanceRow,
    'clock_in_at' | 'clock_out_at' | 'early_leave_at' | 'note'
  >
): AttendanceStatus {
  if (status === 'vacation') return 'vacation';
  if (status === 'absent') return 'absent';
  if (status === 'early_leave' || status === 'early') return 'early_leave';
  if (status === 'late') return 'late';
  if (status === 'present') return 'present';

  if (row.early_leave_at) {
    return 'early_leave';
  }

  if (row.clock_in_at) {
    return isLateCheckIn(row.clock_in_at) ? 'late' : 'present';
  }

  if (status === 'out' && row.clock_out_at) {
    return row.clock_in_at && isLateCheckIn(row.clock_in_at)
      ? 'late'
      : 'present';
  }

  return 'absent';
}

export function mapAttendanceRow(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.work_date,
    checkInAt: row.clock_in_at,
    checkOutAt: row.clock_out_at,
    earlyLeaveAt: row.early_leave_at,
    workMinutes:
      row.work_minutes ??
      calculateWorkMinutes(row.clock_in_at, row.clock_out_at),
    note: row.note ?? null,
    status: normalizeAttendanceStatus(row.status, row),
    isManualClose: row.is_manual_close ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isValidAttendanceRange(params: AttendanceLogsParams) {
  return params.from <= params.to;
}

// 기간 내 오늘까지 경과한 근무일 수를 반환
// - 미래 날짜는 포함하지 않음 (이번 달 남은 날을 분모에 넣지 않기 위해)
// - 수식: Math.round(경과 일수 × daysPerWeek / 7)
// - 요일을 특정하지 않아 월±1 오차가 있으나, 요일 미지정 트레이드오프로 수용
function countElapsedWorkDays(
  from: string,
  to: string,
  daysPerWeek = 5
): number {
  const today = getKstDateString();
  const effectiveTo = to < today ? to : today;
  if (effectiveTo < from) return 0;
  const elapsed =
    Math.round(
      (toUtcDate(effectiveTo).getTime() - toUtcDate(from).getTime()) /
        86_400_000
    ) + 1;
  const raw = Math.round((elapsed * daysPerWeek) / 7);
  return Math.max(1, Math.min(raw, elapsed));
}

export function createAttendanceSummary(
  records: AttendanceRecord[],
  period: AttendanceSummaryPeriod,
  range: { from: string; to: string },
  daysPerWeek = 5
): AttendanceSummary {
  const today = getKstDateString();
  const effectiveRecords = records.filter(record => record.date <= today);

  const presentDays = effectiveRecords.filter(
    record => record.status === 'present'
  ).length;
  const lateDays = effectiveRecords.filter(
    record => record.status === 'late'
  ).length;
  const earlyLeaveDays = effectiveRecords.filter(
    record => record.status === 'early_leave'
  ).length;
  const absentDays = effectiveRecords.filter(
    record => record.status === 'absent'
  ).length;
  const vacationDays = effectiveRecords.filter(
    record => record.status === 'vacation'
  ).length;
  const attendedDays = presentDays + lateDays + earlyLeaveDays;
  const totalDays = countElapsedWorkDays(range.from, range.to, daysPerWeek);
  const totalWorkMinutes = effectiveRecords.reduce(
    (sum, record) => sum + record.workMinutes,
    0
  );

  return {
    period,
    from: range.from,
    to: range.to,
    totalDays,
    attendedDays,
    presentDays,
    lateDays,
    earlyLeaveDays,
    absentDays,
    vacationDays,
    attendanceRate:
      totalDays > 0 ? Number(((attendedDays / totalDays) * 100).toFixed(2)) : 0,
    totalWorkMinutes,
  };
}

export function mapAttendanceError(message: string | null | undefined) {
  const normalized = message?.toLowerCase() ?? '';

  if (normalized.includes('clocked in')) {
    return 'ALREADY_CHECKED_IN' satisfies AttendanceErrorCode;
  }

  if (normalized.includes('no clock-in record')) {
    return 'NO_CHECK_IN_RECORD' satisfies AttendanceErrorCode;
  }

  if (normalized.includes('no clock-out record')) {
    return 'NO_CLOCK_OUT_RECORD' satisfies AttendanceErrorCode;
  }

  if (
    normalized.includes('clocked out') ||
    normalized.includes('session already closed') ||
    normalized.includes('already processed early leave') ||
    normalized.includes('attendance already finalized')
  ) {
    return 'ALREADY_FINALIZED' satisfies AttendanceErrorCode;
  }

  return 'UNKNOWN' satisfies AttendanceErrorCode;
}

export const ATTENDANCE_ERROR_MESSAGES: Record<AttendanceErrorCode, string> = {
  UNAUTHENTICATED: '로그인이 필요해요.',
  ALREADY_CHECKED_IN: '이미 출근 처리되었어요.',
  NO_CHECK_IN_RECORD: '오늘 출근 기록이 없습니다.',
  NO_CLOCK_OUT_RECORD: '되돌릴 퇴근 기록이 없습니다.',
  ALREADY_FINALIZED: '이미 처리 완료된 근태입니다.',
  INVALID_RANGE: '조회 기간이 올바르지 않습니다.',
  UNKNOWN: '근태 처리 중 문제가 발생했어요.',
};

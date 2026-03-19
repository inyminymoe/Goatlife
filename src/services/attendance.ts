import {
  checkIn as serverCheckIn,
  checkOut as serverCheckOut,
  getAttendanceLogs as serverGetAttendanceLogs,
  getAttendanceRate as serverGetAttendanceRate,
  getAttendanceSummary as serverGetAttendanceSummary,
  getAttendanceToday as serverGetAttendanceToday,
  undoClockOut as serverUndoClockOut,
} from '@/app/_actions/attendance';
import type {
  AttendanceErrorCode,
  AttendanceLogsParams,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceSummaryPeriod,
} from '@/types/attendance';

type AttendanceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AttendanceErrorCode };

type AttendanceRateResult =
  | { ok: true; rate: number }
  | { ok: false; error: AttendanceErrorCode };

export type {
  AttendanceErrorCode,
  AttendanceLogsParams,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceSummaryPeriod,
};

export async function fetchAttendanceToday(): Promise<
  AttendanceResult<AttendanceRecord | null>
> {
  try {
    return await serverGetAttendanceToday();
  } catch (error) {
    console.error('[services/attendance] fetchAttendanceToday failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function fetchAttendanceLogs(
  params: AttendanceLogsParams
): Promise<AttendanceResult<AttendanceRecord[]>> {
  try {
    return await serverGetAttendanceLogs(params);
  } catch (error) {
    console.error('[services/attendance] fetchAttendanceLogs failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function fetchAttendanceSummary(
  period: AttendanceSummaryPeriod
): Promise<AttendanceResult<AttendanceSummary>> {
  try {
    return await serverGetAttendanceSummary(period);
  } catch (error) {
    console.error('[services/attendance] fetchAttendanceSummary failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function fetchAttendanceRate(): Promise<AttendanceRateResult> {
  try {
    return await serverGetAttendanceRate();
  } catch (error) {
    console.error('[services/attendance] fetchAttendanceRate failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function requestCheckIn() {
  try {
    return await serverCheckIn();
  } catch (error) {
    console.error('[services/attendance] requestCheckIn failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

export async function requestCheckOut(workDate?: string) {
  try {
    return await serverCheckOut(workDate);
  } catch (error) {
    console.error('[services/attendance] requestCheckOut failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

export async function requestUndoClockOut(workDate?: string) {
  try {
    return await serverUndoClockOut(workDate);
  } catch (error) {
    console.error('[services/attendance] requestUndoClockOut failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

import {
  clockIn as serverClockIn,
  clockOut as serverClockOut,
  earlyLeave as serverEarlyLeave,
  getAttendanceRate as serverGetAttendanceRate,
  getTodayStatus as serverGetTodayStatus,
  type AttendanceLog,
  type AttendanceStatus,
} from '@/app/_actions/attendance';

const DEFAULT_TIMEOUT = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

type AttendanceResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type { AttendanceLog, AttendanceStatus };

export async function fetchTodayAttendance(): Promise<
  AttendanceResult<AttendanceLog | null>
> {
  try {
    const result = await withTimeout(serverGetTodayStatus());
    return result.ok
      ? { ok: true, data: result.data ?? null }
      : { ok: false, error: result.error };
  } catch (error) {
    console.error('[services/attendance] fetchTodayAttendance failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function fetchAttendanceRate(): Promise<
  { ok: true; rate: number } | { ok: false; error: string }
> {
  try {
    const result = await withTimeout(serverGetAttendanceRate());
    return result;
  } catch (error) {
    console.error('[services/attendance] fetchAttendanceRate failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

export async function requestClockIn() {
  try {
    return await withTimeout(serverClockIn());
  } catch (error) {
    console.error('[services/attendance] requestClockIn failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

export async function requestEarlyLeave() {
  try {
    return await withTimeout(serverEarlyLeave());
  } catch (error) {
    console.error('[services/attendance] requestEarlyLeave failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

export async function requestClockOut() {
  try {
    return await withTimeout(serverClockOut());
  } catch (error) {
    console.error('[services/attendance] requestClockOut failed', error);
    return { ok: false as const, error: 'UNKNOWN' };
  }
}

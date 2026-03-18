'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import {
  createAttendanceSummary,
  getKstDateOffsetString,
  getKstDateRange,
  getKstDateString,
  mapAttendanceError,
  mapAttendanceRow,
  type AttendanceRow,
  isValidAttendanceRange,
} from '@/lib/attendance';
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

async function getUserScopedSupabase() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: 'UNAUTHENTICATED' as const };
  }

  return { ok: true as const, supabase, user };
}

async function listAttendanceRows(
  filters: AttendanceLogsParams
): Promise<AttendanceResult<AttendanceRow[]>> {
  if (!isValidAttendanceRange(filters)) {
    return { ok: false, error: 'INVALID_RANGE' };
  }

  const client = await getUserScopedSupabase();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', client.user.id)
    .gte('work_date', filters.from)
    .lte('work_date', filters.to)
    .order('work_date', { ascending: false });

  if (error) {
    console.error('[attendance] listAttendanceRows failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }

  return { ok: true, data: (data as AttendanceRow[] | null) ?? [] };
}

export async function getAttendanceToday(): Promise<
  AttendanceResult<AttendanceRecord | null>
> {
  const client = await getUserScopedSupabase();
  if (!client.ok) return client;

  const today = getKstDateString();
  const yesterday = getKstDateOffsetString(-1, today);

  const { data, error } = await client.supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', client.user.id)
    .in('work_date', [today, yesterday])
    .order('work_date', { ascending: false });

  if (error) {
    console.error('[attendance] getAttendanceToday failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }

  const rows = (data as AttendanceRow[] | null) ?? [];
  const todayRow = rows.find(row => row.work_date === today);

  const activeCarryOverRow = rows.find(row => {
    if (row.work_date !== yesterday || !row.clock_in_at) {
      return false;
    }

    return (
      row.clock_out_at === null || getKstDateString(row.clock_out_at) === today
    );
  });

  return {
    ok: true,
    data: todayRow
      ? mapAttendanceRow(todayRow)
      : activeCarryOverRow
        ? mapAttendanceRow(activeCarryOverRow)
        : null,
  };
}

export async function getAttendanceLogs(
  params: AttendanceLogsParams
): Promise<AttendanceResult<AttendanceRecord[]>> {
  const rowsResult = await listAttendanceRows(params);
  if (!rowsResult.ok) return rowsResult;

  const records = rowsResult.data.map(mapAttendanceRow);

  return {
    ok: true,
    data: params.status
      ? records.filter(record => record.status === params.status)
      : records,
  };
}

export async function getAttendanceSummary(
  period: AttendanceSummaryPeriod
): Promise<AttendanceResult<AttendanceSummary>> {
  const range = getKstDateRange(period);
  const logsResult = await getAttendanceLogs(range);

  if (!logsResult.ok) {
    return logsResult;
  }

  return {
    ok: true,
    data: createAttendanceSummary(logsResult.data, period, range),
  };
}

async function runAttendanceRpc(
  rpcName:
    | 'fn_clock_in'
    | 'fn_clock_out'
    | 'fn_early_leave'
    | 'fn_undo_clock_out',
  workDate = getKstDateString()
): Promise<AttendanceResult<AttendanceRecord | null>> {
  const client = await getUserScopedSupabase();
  if (!client.ok) return client;

  const { data, error } = await client.supabase.rpc(rpcName, {
    p_user_id: client.user.id,
    p_work_date: workDate,
  });

  if (error) {
    console.error(`[attendance] ${rpcName} failed`, error);
    return { ok: false, error: mapAttendanceError(error.message) };
  }

  return {
    ok: true,
    data: data ? mapAttendanceRow(data as AttendanceRow) : null,
  };
}

export async function checkIn() {
  return runAttendanceRpc('fn_clock_in');
}

export async function earlyLeave() {
  return runAttendanceRpc('fn_early_leave');
}

export async function checkOut(workDate?: string) {
  return runAttendanceRpc('fn_clock_out', workDate);
}

export async function undoClockOut(workDate?: string) {
  return runAttendanceRpc('fn_undo_clock_out', workDate);
}

export async function getAttendanceRate(): Promise<AttendanceRateResult> {
  const client = await getUserScopedSupabase();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('v_attendance_summary')
    .select('attendance_rate')
    .eq('user_id', client.user.id)
    .maybeSingle();

  if (error) {
    console.error('[attendance] getAttendanceRate failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }

  return {
    ok: true,
    rate: ((data as { attendance_rate: number | null } | null)
      ?.attendance_rate ?? 0) as number,
  };
}

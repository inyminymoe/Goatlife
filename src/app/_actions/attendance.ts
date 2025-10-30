'use server';

import { createServerSupabase } from '@/lib/supabase/server';

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type AttendanceStatus = 'none' | 'in' | 'early' | 'out';

export type AttendanceLog = {
  id: string;
  user_id: string;
  work_date: string;
  clock_in_at: string | null;
  early_leave_at: string | null;
  clock_out_at: string | null;
  work_minutes: number;
  status: AttendanceStatus;
  created_at: string;
  updated_at: string;
};

type AttendanceResponse =
  | { ok: true; data: AttendanceLog }
  | { ok: true; data: null }
  | { ok: false; error: string };

type MutationResponse =
  | { ok: true; data: AttendanceLog | null }
  | { ok: false; error: string };

type AttendanceRateResponse =
  | { ok: true; rate: number }
  | { ok: false; error: string };

function todayKstDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

async function getUserSupabaseClient() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: 'UNAUTHENTICATED' };
  }

  return { ok: true as const, supabase, user };
}

export async function getTodayStatus(): Promise<AttendanceResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const workDate = todayKstDate();

  const { data, error } = await client.supabase
    .from('attendance_logs')
    .select('*')
    .eq('user_id', client.user.id)
    .eq('work_date', workDate)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  return { ok: true, data: (data as AttendanceLog | null) ?? null };
}

export async function clockIn(): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const workDate = todayKstDate();

  const { data, error } = await client.supabase.rpc('fn_clock_in', {
    p_user_id: client.user.id,
    p_work_date: workDate,
  });

  return error
    ? { ok: false, error: error.message }
    : { ok: true, data: (data as AttendanceLog | null) ?? null };
}

export async function earlyLeave(): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const workDate = todayKstDate();

  const { data, error } = await client.supabase.rpc('fn_early_leave', {
    p_user_id: client.user.id,
    p_work_date: workDate,
  });

  return error
    ? { ok: false, error: error.message }
    : { ok: true, data: (data as AttendanceLog | null) ?? null };
}

export async function clockOut(): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const workDate = todayKstDate();

  const { data, error } = await client.supabase.rpc('fn_clock_out', {
    p_user_id: client.user.id,
    p_work_date: workDate,
  });

  return error
    ? { ok: false, error: error.message }
    : { ok: true, data: (data as AttendanceLog | null) ?? null };
}

export async function getAttendanceRate(): Promise<AttendanceRateResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('v_attendance_summary')
    .select('attendance_rate')
    .eq('user_id', client.user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  const rateRow = data as { attendance_rate: number | null } | null;
  return { ok: true, rate: rateRow?.attendance_rate ?? 0 };
}

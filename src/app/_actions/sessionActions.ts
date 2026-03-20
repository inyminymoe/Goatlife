'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { PomodoroMode } from '@/hooks/usePomodoroTimer';
import type {
  SessionMode,
  ActiveRoutine,
} from '@/components/features/task-plan/types';
import type { PomodoroSession } from '@/types/pomodoro';

// ─── 타입 ───────────────────────────────────────────────

export type ActiveSessionRow = {
  id: string;
  user_id: string;
  timer_mode: PomodoroMode;
  started_at: string; // ISO string
  duration_seconds: number;
  total_focus_seconds: number;
  session_mode: SessionMode;
  routine_id: string | null;
  routine_title: string | null;
  routine_index: number | null;
  routine_total_count: number | null;
  updated_at: string;
};

type ActiveSessionResponse =
  | { ok: true; data: ActiveSessionRow | null }
  | { ok: false; error: string };

type MutationResponse = { ok: true } | { ok: false; error: string };

// ─── 헬퍼 ───────────────────────────────────────────────

async function getUserSupabaseClient() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false as const, error: 'UNAUTHENTICATED' };
  return { ok: true as const, supabase, user };
}

// ─── active_sessions ────────────────────────────────────

// 현재 active session 조회
export async function getActiveSession(): Promise<ActiveSessionResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('active_sessions')
    .select('*')
    .eq('user_id', client.user.id)
    .maybeSingle(); // 없으면 null, 여러 개면 에러

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as ActiveSessionRow | null };
}

// active session 저장 (없으면 insert, 있으면 update)
export async function upsertActiveSession(input: {
  timerMode: PomodoroMode;
  startedAt: Date;
  durationSeconds: number;
  totalFocusSeconds: number;
  sessionMode: SessionMode;
  activeRoutine: ActiveRoutine | null;
}): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { error } = await client.supabase.from('active_sessions').upsert(
    {
      user_id: client.user.id,
      timer_mode: input.timerMode,
      started_at: input.startedAt.toISOString(),
      duration_seconds: input.durationSeconds,
      total_focus_seconds: input.totalFocusSeconds,
      session_mode: input.sessionMode,
      routine_id: input.activeRoutine?.id ?? null,
      routine_title: input.activeRoutine?.title ?? null,
      routine_index: input.activeRoutine?.index ?? null,
      routine_total_count: input.activeRoutine?.totalCount ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' } // user_id 충돌 시 update
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// active session 삭제 (세션 종료 / 완료 시)
export async function deleteActiveSession(): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { error } = await client.supabase
    .from('active_sessions')
    .delete()
    .eq('user_id', client.user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ─── session_history ────────────────────────────────────

// 완료/중단 기록 저장
export async function createSessionHistory(
  session: PomodoroSession
): Promise<MutationResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { error } = await client.supabase.from('session_history').insert({
    user_id: client.user.id,
    status: session.status,
    duration_seconds: session.durationSeconds,
    started_at: session.startedAt.toISOString(),
    routine_id: session.routineId ?? null,
    routine_title: session.routineTitle ?? null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// 오늘 session_history 조회 (Timeline 초기 데이터용)
export async function getTodaySessionHistory(): Promise<
  { ok: true; data: PomodoroSession[] } | { ok: false; error: string }
> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  // 오늘 자정 기준
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await client.supabase
    .from('session_history')
    .select('*')
    .eq('user_id', client.user.id)
    .gte('started_at', startOfDay.toISOString())
    .order('started_at', { ascending: true });

  if (error) return { ok: false, error: error.message };

  const sessions: PomodoroSession[] = (data ?? []).map(row => ({
    id: row.id,
    status: row.status,
    durationSeconds: row.duration_seconds,
    startedAt: new Date(row.started_at),
    routineId: row.routine_id ?? undefined,
    routineTitle: row.routine_title ?? undefined,
  }));

  return { ok: true, data: sessions };
}

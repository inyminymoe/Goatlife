import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getActiveSession,
  upsertActiveSession,
  deleteActiveSession,
  getTodaySessionHistory,
  createSessionHistory,
} from '@/app/_actions/sessionActions';
import type { PomodoroSession } from '@/types/pomodoro';
import type { PomodoroMode } from '@/hooks/usePomodoroTimer';
import type {
  SessionMode,
  ActiveRoutine,
} from '@/components/features/task-plan/types';

// queryKey 상수로 관리
export const SESSION_QUERY_KEYS = {
  active: ['session', 'active'] as const,
  history: ['session', 'history', 'today'] as const,
};

// ─── active session 조회 ────────────────────────────────

export function useActiveSessionQuery() {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.active,
    queryFn: async () => {
      const result = await getActiveSession();
      if (!result.ok) throw new Error(result.error);
      return result.data; // null이면 active session 없음
    },
    staleTime: Infinity, // 직접 invalidate 전까지 재요청 안 함
    retry: false,
  });
}

// ─── 오늘 history 조회 ──────────────────────────────────

export function useTodayHistoryQuery() {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.history,
    queryFn: async () => {
      const result = await getTodaySessionHistory();
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    staleTime: Infinity,
    retry: false,
  });
}

// ─── active session upsert ──────────────────────────────

export function useUpsertActiveSession() {
  return useMutation({
    mutationFn: (input: {
      timerMode: PomodoroMode;
      startedAt: Date;
      durationSeconds: number;
      totalFocusSeconds: number;
      remainingSeconds: number;
      isRunning: boolean;
      sessionMode: SessionMode;
      activeRoutine: ActiveRoutine | null;
    }) => upsertActiveSession(input),
    // 저장 실패해도 UI는 계속 동작해야 하므로 onError는 콘솔만
    onError: error => {
      console.error('[upsertActiveSession]', error);
    },
  });
}

// ─── active session 삭제 ────────────────────────────────

export function useDeleteActiveSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteActiveSession,
    onSuccess: () => {
      // 삭제 후 캐시도 비워줌
      queryClient.setQueryData(SESSION_QUERY_KEYS.active, null);
    },
    onError: error => {
      console.error('[deleteActiveSession]', error);
    },
  });
}

// ─── session history 저장 ───────────────────────────────

export function useCreateSessionHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: PomodoroSession) => createSessionHistory(session),
    onSuccess: (_, session) => {
      // invalidateQueries 대신 캐시에 직접 추가
      // → 리패치 없이 즉시 반영되므로 localRecords와 중복이 생기지 않음
      queryClient.setQueryData<PomodoroSession[]>(
        SESSION_QUERY_KEYS.history,
        prev => [...(prev ?? []), session]
      );
    },
    onError: error => {
      console.error('[createSessionHistory]', error);
    },
  });
}

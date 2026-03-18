'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import {
  useActiveSessionQuery,
  useTodayHistoryQuery,
  useUpsertActiveSession,
  useDeleteActiveSession,
  useCreateSessionHistory,
} from '@/components/features/task-plan/application/useActiveSession';
import type { SessionMode, ActiveRoutine, TimerSettings } from '../types';
import type { PomodoroSession } from '@/types/pomodoro';

interface UseSessionOrchestratorOptions {
  initialFocusMinutes?: number;
  initialBreakMinutes?: number;
  onToast?: (message: string, type: 'success' | 'info' | 'warning') => void;
}

export function useSessionOrchestrator({
  initialFocusMinutes = 30,
  initialBreakMinutes = 15,
  onToast,
}: UseSessionOrchestratorOptions = {}) {
  const [sessionMode, setSessionMode] = useState<SessionMode>('idle');
  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutine | null>(
    null
  );

  const sessionStartedAtRef = useRef<Date | null>(null);
  const focusPresetRef = useRef(initialFocusMinutes);
  const isFocusRecordingRef = useRef(false);
  const isBreakRecordingRef = useRef(false);

  // ─── TanStack Query 훅 ──────────────────────────────────
  const { data: activeSessionData, isLoading: isSessionLoading } =
    useActiveSessionQuery();
  const { data: todayHistory = [] } = useTodayHistoryQuery();
  const { mutate: upsertSession } = useUpsertActiveSession();
  const { mutate: deleteSession } = useDeleteActiveSession();
  const { mutate: saveHistory } = useCreateSessionHistory();

  const saveHistoryRef = useRef(saveHistory);
  useEffect(() => {
    saveHistoryRef.current = saveHistory;
  });

  // ─── 기록 추가 ──────────────────────────────────────────
  const addRecord = useCallback(
    (status: PomodoroSession['status'], durationSeconds: number) => {
      if (status === 'focus-done' || status === 'focus-incomplete') {
        if (isFocusRecordingRef.current) return;
        isFocusRecordingRef.current = true;
        setTimeout(() => {
          isFocusRecordingRef.current = false;
        }, 0);
      } else {
        if (isBreakRecordingRef.current) return;
        isBreakRecordingRef.current = true;
        setTimeout(() => {
          isBreakRecordingRef.current = false;
        }, 0);
      }

      const record: PomodoroSession = {
        id: crypto.randomUUID(),
        status,
        durationSeconds,
        startedAt: sessionStartedAtRef.current ?? new Date(),
        routineId: activeRoutine?.id,
        routineTitle: activeRoutine?.title,
      };

      saveHistoryRef.current(record);

      return record;
    },
    [activeRoutine]
  );

  // ─── active session 동기화 헬퍼 ─────────────────────────
  const syncActiveSession = useCallback(
    (overrides?: {
      sessionMode?: SessionMode;
      activeRoutine?: ActiveRoutine | null;
    }) => {
      if (!sessionStartedAtRef.current) return;

      upsertSession({
        timerMode: timer.mode,
        startedAt: sessionStartedAtRef.current,
        durationSeconds:
          timer.mode === 'focus'
            ? timer.focusPresetMinutes * 60
            : timer.breakPresetMinutes * 60,
        totalFocusSeconds: timer.totalFocusSeconds,
        sessionMode: overrides?.sessionMode ?? sessionMode,
        activeRoutine:
          overrides?.activeRoutine !== undefined
            ? overrides.activeRoutine
            : activeRoutine,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [upsertSession, sessionMode, activeRoutine]
  );

  // ─── usePomodoroTimer ───────────────────────────────────
  const timer = usePomodoroTimer({
    initialFocusMinutes,
    initialBreakMinutes,
    autoStart: false,

    onFocusComplete: () => {
      addRecord('focus-done', focusPresetRef.current * 60);
      deleteSession();
      onToast?.('집중이 완료됐어요. 다음 흐름을 이어가세요.', 'success');
    },
    onBreakComplete: () => {
      onToast?.('휴식이 끝났어요. 다시 집중을 시작할 수 있어요.', 'info');
    },
    onFocusFail: elapsed => {
      addRecord('focus-incomplete', elapsed);
    },
    onBreakRecorded: elapsed => {
      addRecord('break', elapsed);
    },
  });

  focusPresetRef.current = timer.focusPresetMinutes;

  // ─── 페이지 진입 시 active session 복원 ─────────────────
  const restoredRef = useRef(false);

  useEffect(() => {
    if (isSessionLoading) return;
    if (restoredRef.current) return;
    if (!activeSessionData) {
      restoredRef.current = true;
      return;
    }

    restoredRef.current = true;

    const {
      timer_mode,
      started_at,
      duration_seconds,
      total_focus_seconds,
      session_mode,
      routine_id,
      routine_title,
      routine_index,
      routine_total_count,
    } = activeSessionData;

    setSessionMode(session_mode);

    if (
      routine_id &&
      routine_title &&
      routine_index !== null &&
      routine_total_count !== null
    ) {
      setActiveRoutine({
        id: routine_id,
        title: routine_title,
        index: routine_index,
        totalCount: routine_total_count,
      });
    }

    const startedAt = new Date(started_at);
    sessionStartedAtRef.current = startedAt;

    timer.restoreSession({
      mode: timer_mode,
      startedAt,
      durationSeconds: duration_seconds,
      totalFocusSeconds: total_focus_seconds,
    });

    onToast?.('이전 세션을 이어서 진행해요.', 'info');
  }, [isSessionLoading, activeSessionData]);

  // ─── 탭 복귀 시 timestamp 재계산 ────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!timer.isRunning) return;
      if (!sessionStartedAtRef.current) return;

      const totalDuration =
        timer.mode === 'focus'
          ? timer.focusPresetMinutes * 60
          : timer.breakPresetMinutes * 60;

      timer.restoreSession({
        mode: timer.mode,
        startedAt: sessionStartedAtRef.current,
        durationSeconds: totalDuration,
        totalFocusSeconds: timer.totalFocusSeconds,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timer]);

  // ─── 세션 진입 액션 ─────────────────────────────────────

  const startManual = useCallback(
    (routine: Pick<ActiveRoutine, 'id' | 'title'>) => {
      const startedAt = new Date();
      sessionStartedAtRef.current = startedAt;
      const newRoutine = { ...routine, index: 0, totalCount: 1 };

      setSessionMode('manual');
      setActiveRoutine(newRoutine);
      timer.startFocus();

      upsertSession({
        timerMode: 'focus',
        startedAt,
        durationSeconds: timer.focusPresetMinutes * 60,
        totalFocusSeconds: 0,
        sessionMode: 'manual',
        activeRoutine: newRoutine,
      });

      onToast?.(`'${routine.title}' 타이머를 시작했어요.`, 'success');
    },
    [timer, upsertSession, onToast]
  );

  const startRoutine = useCallback(
    (routines: Pick<ActiveRoutine, 'id' | 'title'>[]) => {
      if (routines.length === 0) {
        onToast?.('시작할 루틴이 없어요.', 'warning');
        return;
      }
      const startedAt = new Date();
      sessionStartedAtRef.current = startedAt;
      const newRoutine = {
        ...routines[0],
        index: 0,
        totalCount: routines.length,
      };

      setSessionMode('routine');
      setActiveRoutine(newRoutine);
      timer.startFocus();

      upsertSession({
        timerMode: 'focus',
        startedAt,
        durationSeconds: timer.focusPresetMinutes * 60,
        totalFocusSeconds: 0,
        sessionMode: 'routine',
        activeRoutine: newRoutine,
      });

      onToast?.(`'${routines[0].title}' 루틴을 시작했어요.`, 'success');
    },
    [timer, upsertSession, onToast]
  );

  // ─── 세션 제어 액션 ─────────────────────────────────────

  const handleToggleRunning = useCallback(() => {
    if (sessionMode === 'idle') {
      sessionStartedAtRef.current = new Date();
      setSessionMode('manual');
    }
    timer.toggleRunning();
    syncActiveSession();
    onToast?.(
      timer.isRunning
        ? '타이머가 멈췄어요🐢'
        : '타이머 시작! 집중해서 끝내봐요🍀',
      timer.isRunning ? 'info' : 'success'
    );
  }, [sessionMode, timer, syncActiveSession, onToast]);

  const handleSkip = useCallback(() => {
    if (timer.mode === 'focus') {
      const elapsed = timer.focusPresetMinutes * 60 - timer.remainingSeconds;
      if (elapsed >= 1) {
        addRecord('focus-incomplete', elapsed);
      }
      timer.startBreak();
      syncActiveSession();
      onToast?.('휴식 시간으로 넘어갔어요.', 'info');
      return;
    }

    const breakElapsed = timer.breakPresetMinutes * 60 - timer.remainingSeconds;
    if (breakElapsed >= 1) {
      addRecord('break', breakElapsed);
    }
    timer.skipToFocus();
    syncActiveSession();
    onToast?.("'다음 작업'을 시작하려면 재생버튼을 눌러주세요.", 'info');
  }, [timer, addRecord, syncActiveSession, onToast]);

  const handleReset = useCallback(() => {
    timer.resetTimer();
    syncActiveSession();
    onToast?.('현재 타이머를 초기화했어요.', 'info');
  }, [timer, syncActiveSession, onToast]);

  const handleEnd = useCallback(() => {
    if (timer.mode === 'focus') {
      const elapsed = timer.focusPresetMinutes * 60 - timer.remainingSeconds;
      if (elapsed >= 1) {
        addRecord('focus-incomplete', elapsed);
      }
    } else {
      const breakElapsed =
        timer.breakPresetMinutes * 60 - timer.remainingSeconds;
      if (breakElapsed >= 1) {
        addRecord('break', breakElapsed);
      }
    }

    timer.endSession();
    setSessionMode('idle');
    setActiveRoutine(null);
    sessionStartedAtRef.current = null;
    deleteSession();
    onToast?.('현재 세션을 종료했어요.', 'success');
  }, [timer, addRecord, deleteSession, onToast]);

  const handleSaveSettings = useCallback(
    (settings: TimerSettings) => {
      timer.setFocusPresetMinutes(settings.focusPresetMinutes);
      timer.setBreakPresetMinutes(settings.breakPresetMinutes);
      onToast?.('타이머 설정을 저장했어요.', 'success');
    },
    [timer, onToast]
  );

  return {
    timerMode: timer.mode,
    isRunning: timer.isRunning,
    remainingSeconds: timer.remainingSeconds,
    totalFocusSeconds: timer.totalFocusSeconds,
    focusPresetMinutes: timer.focusPresetMinutes,
    breakPresetMinutes: timer.breakPresetMinutes,

    sessionMode,
    activeRoutine,
    isSessionLoading,

    records: todayHistory,

    startManual,
    startRoutine,
    handleToggleRunning,
    handleSkip,
    handleReset,
    handleEnd,
    handleSaveSettings,
  };
}

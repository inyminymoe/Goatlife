'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  // 전체 루틴 배열 — routine 모드에서 다음 루틴 이동에 사용
  const routineQueueRef = useRef<Pick<ActiveRoutine, 'id' | 'title'>[]>([]);

  // 콜백 클로저에서 항상 최신값을 읽기 위한 ref (렌더 중 직접 할당)
  const sessionModeRef = useRef<SessionMode>('idle');
  const activeRoutineRef = useRef<ActiveRoutine | null>(null);
  sessionModeRef.current = sessionMode;
  activeRoutineRef.current = activeRoutine;

  // focus-done 중복 저장 방지: 세션 키가 바뀔 때만 저장 허용
  // setTimeout(0) 방식은 렌더 사이클과 경쟁하므로 세션-키 기반으로 대체한다.
  const currentFocusSessionKeyRef = useRef('');
  const focusDoneRecordedKeyRef = useRef('');

  // ─── TanStack Query 훅 ──────────────────────────────────
  const { data: activeSessionData, isLoading: isSessionLoading } =
    useActiveSessionQuery();
  const { data: todayHistory = [] } = useTodayHistoryQuery();
  const { mutate: upsertSession } = useUpsertActiveSession();
  const { mutate: deleteSession } = useDeleteActiveSession();
  const { mutate: saveHistory } = useCreateSessionHistory();

  // mutate 함수를 ref로 관리해 콜백 클로저에서 항상 최신을 참조한다.
  const saveHistoryRef = useRef(saveHistory);
  const upsertSessionRef = useRef(upsertSession);
  const deleteSessionRef = useRef(deleteSession);
  useEffect(() => {
    saveHistoryRef.current = saveHistory;
  });
  useEffect(() => {
    upsertSessionRef.current = upsertSession;
  });
  useEffect(() => {
    deleteSessionRef.current = deleteSession;
  });

  // ─── 기록 저장 ──────────────────────────────────────────
  const addRecord = useCallback(
    (
      status: PomodoroSession['status'],
      durationSeconds: number,
      routineOverride?: Pick<ActiveRoutine, 'id' | 'title'> | null
    ) => {
      // focus-done 중복 방지: 동일 세션 키에 대해 두 번 저장하지 않는다.
      if (status === 'focus-done') {
        if (
          focusDoneRecordedKeyRef.current === currentFocusSessionKeyRef.current
        )
          return;
        focusDoneRecordedKeyRef.current = currentFocusSessionKeyRef.current;
      }

      const routine =
        routineOverride !== undefined
          ? routineOverride
          : activeRoutineRef.current;
      const record: PomodoroSession = {
        id: crypto.randomUUID(),
        status,
        durationSeconds,
        startedAt: sessionStartedAtRef.current ?? new Date(),
        routineId: routine?.id,
        routineTitle: routine?.title,
      };

      saveHistoryRef.current(record);
    },
    [] // activeRoutineRef를 렌더 중 직접 갱신하므로 deps 불필요
  );

  // ─── active session DB 동기화 ───────────────────────────
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

  // ─── 다음 루틴으로 전환 ──────────────────────────────────
  // onFocusComplete 콜백 안에서 호출된다. ref 패턴으로 stale closure 방지.
  const advanceToNextRoutineRef = useRef<() => void>(() => {});

  // ─── usePomodoroTimer ───────────────────────────────────
  const timer = usePomodoroTimer({
    initialFocusMinutes,
    initialBreakMinutes,
    autoStart: false,

    onFocusComplete: () => {
      const completedRoutine = activeRoutineRef.current;
      // 중복 저장 방지: 세션 키로 이미 저장된 경우 건너뜀
      addRecord('focus-done', focusPresetRef.current * 60, completedRoutine);

      if (sessionModeRef.current === 'routine') {
        advanceToNextRoutineRef.current();
      } else {
        deleteSessionRef.current();
        onToast?.('집중이 완료됐어요. 다음 흐름을 이어가세요.', 'success');
      }
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

  // 렌더마다 최신 preset / timer 액션을 ref에 반영
  focusPresetRef.current = timer.focusPresetMinutes;

  // advanceToNextRoutineRef를 렌더마다 갱신 (timer / upsertSession 등 stale 방지)
  advanceToNextRoutineRef.current = () => {
    const current = activeRoutineRef.current;
    if (!current) return;

    const nextIndex = current.index + 1;
    const nextRoutine = routineQueueRef.current[nextIndex];

    if (!nextRoutine) {
      // 마지막 루틴 완료 → 전체 세션 종료
      setSessionMode('idle');
      setActiveRoutine(null);
      sessionStartedAtRef.current = null;
      routineQueueRef.current = [];
      deleteSessionRef.current();
      onToast?.('모든 루틴을 완료했어요! 🎉', 'success');
      return;
    }

    // 다음 루틴으로 전환: 누적 집중 시간 유지 (continueToNextFocus)
    const newRoutine: ActiveRoutine = {
      ...nextRoutine,
      index: nextIndex,
      totalCount: current.totalCount,
    };
    const startedAt = new Date();
    sessionStartedAtRef.current = startedAt;
    // 새 세션 키 발급 — 다음 루틴의 focus-done 저장 허용
    currentFocusSessionKeyRef.current = crypto.randomUUID();

    setActiveRoutine(newRoutine);
    timer.continueToNextFocus();

    upsertSessionRef.current({
      timerMode: 'focus',
      startedAt,
      durationSeconds: timer.focusPresetMinutes * 60,
      totalFocusSeconds: timer.totalFocusSeconds,
      sessionMode: 'routine',
      activeRoutine: newRoutine,
    });

    onToast?.(`'${nextRoutine.title}' 시작!`, 'success');
  };

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
    currentFocusSessionKeyRef.current = crypto.randomUUID();

    timer.restoreSession({
      mode: timer_mode,
      startedAt,
      durationSeconds: duration_seconds,
      totalFocusSeconds: total_focus_seconds,
    });

    onToast?.('이전 세션을 이어서 진행해요.', 'info');
  }, [isSessionLoading, activeSessionData]);

  // ─── 탭 복귀 시 interval 기준점 재보정 ──────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!timer.isRunning) return;
      timer.recalibrate();
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
      currentFocusSessionKeyRef.current = crypto.randomUUID();
      const newRoutine = { ...routine, index: 0, totalCount: 1 };

      routineQueueRef.current = [routine];
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

      routineQueueRef.current = routines;
      const startedAt = new Date();
      sessionStartedAtRef.current = startedAt;
      currentFocusSessionKeyRef.current = crypto.randomUUID();
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
      currentFocusSessionKeyRef.current = crypto.randomUUID();
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
      if (elapsed >= 1) addRecord('focus-incomplete', elapsed);
      timer.startBreak();
      syncActiveSession();
      onToast?.('휴식 시간으로 넘어갔어요.', 'info');
      return;
    }

    const breakElapsed = timer.breakPresetMinutes * 60 - timer.remainingSeconds;
    if (breakElapsed >= 1) addRecord('break', breakElapsed);

    if (sessionMode === 'routine') {
      advanceToNextRoutineRef.current();
    } else {
      timer.skipToFocus();
      syncActiveSession();
      onToast?.("'다음 작업'을 시작하려면 재생버튼을 눌러주세요.", 'info');
    }
  }, [timer, addRecord, syncActiveSession, sessionMode, onToast]);

  const handleReset = useCallback(() => {
    timer.resetTimer();
    syncActiveSession();
    onToast?.('현재 타이머를 초기화했어요.', 'info');
  }, [timer, syncActiveSession, onToast]);

  const handleEnd = useCallback(() => {
    if (timer.mode === 'focus') {
      const elapsed = timer.focusPresetMinutes * 60 - timer.remainingSeconds;
      if (elapsed >= 1) addRecord('focus-incomplete', elapsed);
    } else {
      const breakElapsed =
        timer.breakPresetMinutes * 60 - timer.remainingSeconds;
      if (breakElapsed >= 1) addRecord('break', breakElapsed);
    }

    timer.endSession();
    setSessionMode('idle');
    setActiveRoutine(null);
    sessionStartedAtRef.current = null;
    routineQueueRef.current = [];
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

  // 다음 루틴 이름 (TimerCard 표시용)
  const nextRoutineName = useMemo(() => {
    if (!activeRoutine || sessionMode !== 'routine') return undefined;
    return routineQueueRef.current[activeRoutine.index + 1]?.title;
  }, [activeRoutine, sessionMode]);

  return {
    timerMode: timer.mode,
    isRunning: timer.isRunning,
    remainingSeconds: timer.remainingSeconds,
    totalFocusSeconds: timer.totalFocusSeconds,
    focusPresetMinutes: timer.focusPresetMinutes,
    breakPresetMinutes: timer.breakPresetMinutes,

    sessionMode,
    activeRoutine,
    nextRoutineName,
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

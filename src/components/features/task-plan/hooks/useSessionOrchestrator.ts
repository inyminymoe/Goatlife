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

// usePomodoroTimer(순수 타이머 로직)와 DB 연동(active session, 기록 저장)을
// 조합해 실제 세션 흐름을 조율하는 오케스트레이터 훅.
export function useSessionOrchestrator({
  initialFocusMinutes = 30,
  initialBreakMinutes = 15,
  onToast,
}: UseSessionOrchestratorOptions = {}) {
  // sessionMode: 현재 세션의 종류 ('idle' | 'manual' | 'routine')
  const [sessionMode, setSessionMode] = useState<SessionMode>('idle');
  // activeRoutine: 현재 진행 중인 루틴 정보 (루틴 세션이 아니면 null)
  const [activeRoutine, setActiveRoutine] = useState<ActiveRoutine | null>(
    null
  );

  // sessionStartedAtRef: 세션이 시작된 시각. 기록(PomodoroSession)의 startedAt으로 사용된다.
  const sessionStartedAtRef = useRef<Date | null>(null);
  // focusPresetRef: 콜백 클로저에서 최신 focusPresetMinutes를 읽기 위한 ref.
  const focusPresetRef = useRef(initialFocusMinutes);
  // 중복 기록 저장 방지 플래그 (focus / break 각각 관리)
  const isFocusRecordingRef = useRef(false);
  const isBreakRecordingRef = useRef(false);

  // ─── TanStack Query 훅 ──────────────────────────────────
  // activeSessionData: DB에 저장된 현재 진행 중인 세션 (새로고침 복원에 사용)
  const { data: activeSessionData, isLoading: isSessionLoading } =
    useActiveSessionQuery();
  // todayHistory: 오늘 완료된 세션 기록 목록
  const { data: todayHistory = [] } = useTodayHistoryQuery();
  const { mutate: upsertSession } = useUpsertActiveSession();
  const { mutate: deleteSession } = useDeleteActiveSession();
  const { mutate: saveHistory } = useCreateSessionHistory();

  // saveHistory를 ref로 관리해 콜백 클로저에서 항상 최신 mutate 함수를 참조한다.
  const saveHistoryRef = useRef(saveHistory);
  useEffect(() => {
    saveHistoryRef.current = saveHistory;
  });

  // ─── 기록 저장 ──────────────────────────────────────────
  // 집중/휴식 완료·중단 시 호출해 DB에 세션 기록을 저장한다.
  // isFocusRecordingRef / isBreakRecordingRef로 동일 이벤트의 중복 저장을 막는다.
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

  // ─── active session DB 동기화 ───────────────────────────
  // 타이머 상태가 바뀔 때마다 DB의 active_session 레코드를 최신 상태로 갱신한다.
  // 새로고침 후 복원의 원천 데이터가 된다.
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
  // 순수 타이머 로직 훅. 완료/실패/기록 콜백에서 addRecord와 DB 작업을 수행한다.
  const timer = usePomodoroTimer({
    initialFocusMinutes,
    initialBreakMinutes,
    autoStart: false,

    // focus 타이머가 0이 되었을 때: 기록 저장 후 active session 삭제
    onFocusComplete: () => {
      addRecord('focus-done', focusPresetRef.current * 60);
      deleteSession();
      onToast?.('집중이 완료됐어요. 다음 흐름을 이어가세요.', 'success');
    },
    onBreakComplete: () => {
      onToast?.('휴식이 끝났어요. 다시 집중을 시작할 수 있어요.', 'info');
    },
    // focus 타이머가 중간에 중단되었을 때 (skip / end 등)
    onFocusFail: elapsed => {
      addRecord('focus-incomplete', elapsed);
    },
    // break 타이머가 완료되거나 skip되었을 때
    onBreakRecorded: elapsed => {
      addRecord('break', elapsed);
    },
  });

  // focusPresetRef를 항상 최신 preset으로 유지 (onFocusComplete 클로저에서 사용)
  focusPresetRef.current = timer.focusPresetMinutes;

  // ─── 페이지 진입 시 active session 복원 ─────────────────
  // DB에 저장된 active session이 있으면 타이머와 세션 상태를 복원한다.
  // restoredRef로 한 번만 실행되도록 보호한다 (Strict Mode 이중 실행 등 방지).
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

    // restoreSession 내부에서 "저장 시각 → 현재"까지 경과한 시간을
    // totalFocusSeconds에 자동으로 반영하므로 새로고침 후에도 집중 시간이 정확하다.
    timer.restoreSession({
      mode: timer_mode,
      startedAt,
      durationSeconds: duration_seconds,
      totalFocusSeconds: total_focus_seconds,
    });

    onToast?.('이전 세션을 이어서 진행해요.', 'info');
  }, [isSessionLoading, activeSessionData]);

  // ─── 탭 복귀 시 interval 기준점 재보정 ──────────────────
  // 백그라운드 탭에서 setInterval이 throttle되어 타이머가 느려지는 문제를 보정한다.
  // restoreSession과 달리 startedAtRef(interval 기준점)만 재설정하므로
  // totalFocusSeconds가 중복 누적되지 않는다.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!timer.isRunning) return;
      timer.recalibrate(); //  startedAtRef만 재보정, 집중 시간 누적 건드리지 않음
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [timer]);

  // ─── 세션 진입 액션 ─────────────────────────────────────

  // 단일 태스크 수동 타이머 시작
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

  // 루틴(복수 태스크) 순서대로 시작. 첫 번째 태스크부터 집중 타이머를 돌린다.
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

  // 재생/일시정지. idle 상태에서 첫 재생 시 manual 세션으로 전환한다.
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

  // 현재 모드를 건너뜀. focus → break 또는 break → focus(일시정지)로 전환한다.
  // 중단 기록(focus-incomplete / break)을 저장한 뒤 전환한다.
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
    timer.skipToFocus();
    syncActiveSession();
    onToast?.("'다음 작업'을 시작하려면 재생버튼을 눌러주세요.", 'info');
  }, [timer, addRecord, syncActiveSession, onToast]);

  // 현재 모드의 타이머를 preset 시간으로 리셋한다. 누적 집중 시간은 유지된다.
  const handleReset = useCallback(() => {
    timer.resetTimer();
    syncActiveSession();
    onToast?.('현재 타이머를 초기화했어요.', 'info');
  }, [timer, syncActiveSession, onToast]);

  // 세션 전체 종료. 진행 중인 기록을 저장하고 모든 상태를 초기화한다.
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
    deleteSession();
    onToast?.('현재 세션을 종료했어요.', 'success');
  }, [timer, addRecord, deleteSession, onToast]);

  // focus / break preset 시간 변경 후 DB에도 반영한다.
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

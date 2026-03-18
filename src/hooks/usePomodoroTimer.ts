'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PomodoroMode = 'focus' | 'break';

interface PomodoroTimerOptions {
  initialFocusMinutes?: number;
  initialBreakMinutes?: number;
  autoStart?: boolean;
  autoReturnToFocus?: boolean;
  onFocusComplete?: () => void;
  onBreakComplete?: () => void;
  onFocusFail?: (elapsedSeconds: number) => void;
  onBreakRecorded?: (elapsedSeconds: number) => void;
}

interface PomodoroTimerResult {
  mode: PomodoroMode;
  isRunning: boolean;
  remainingSeconds: number;
  totalFocusSeconds: number;
  focusPresetMinutes: number;
  breakPresetMinutes: number;
  setFocusPresetMinutes: (minutes: number) => void;
  setBreakPresetMinutes: (minutes: number) => void;
  toggleRunning: () => void;
  startBreak: () => void;
  startFocus: () => void;
  skipToFocus: () => void;
  resetTimer: () => void;
  endSession: () => void;
  restoreSession: (params: RestoreSessionParams) => void;
}

export interface RestoreSessionParams {
  mode: PomodoroMode;
  startedAt: Date;
  durationSeconds: number;
  pausedSecondsElapsed?: number;
  totalFocusSeconds?: number;
}

export function usePomodoroTimer(
  options: PomodoroTimerOptions = {}
): PomodoroTimerResult {
  const {
    initialFocusMinutes = 30,
    initialBreakMinutes = 15,
    autoStart = true,
    autoReturnToFocus = true,
    onFocusComplete,
    onBreakComplete,
    onFocusFail,
    onBreakRecorded,
  } = options;

  const onFocusCompleteRef = useRef(onFocusComplete);
  const onBreakCompleteRef = useRef(onBreakComplete);
  const onFocusFailRef = useRef(onFocusFail);
  const onBreakRecordedRef = useRef(onBreakRecorded);

  useEffect(() => {
    onFocusCompleteRef.current = onFocusComplete;
    onBreakCompleteRef.current = onBreakComplete;
    onFocusFailRef.current = onFocusFail;
    onBreakRecordedRef.current = onBreakRecorded;
  });

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [focusPresetMinutes, setFocusPresetMinutesState] =
    useState(initialFocusMinutes);
  const [breakPresetMinutes, setBreakPresetMinutesState] =
    useState(initialBreakMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(
    initialFocusMinutes * 60
  );
  const [isRunning, setIsRunning] = useState(autoStart);
  const [totalFocusSeconds, setTotalFocusSeconds] = useState(0);

  const completionNotifiedRef = useRef(false);
  const breakElapsedSecondsRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const remainingSecondsRef = useRef(initialFocusMinutes * 60);

  // ─── timestamp 기반 총 집중시간 추적용 ref ──────────────
  // focus 모드가 시작된 시각 (pause/모드전환 시 null로 초기화)
  const focusStartedAtRef = useRef<number | null>(null);
  // pause 또는 모드 전환 전까지 누적된 집중 시간
  const accumulatedFocusRef = useRef(0);

  // ─── focus 누적 flush 헬퍼 ──────────────────────────────
  // pause / 모드전환 / 세션종료 시점에 현재까지 집중 시간을 누적에 반영
  const flushFocusElapsed = useCallback(() => {
    if (focusStartedAtRef.current === null) return;
    const elapsed = (Date.now() - focusStartedAtRef.current) / 1000;
    accumulatedFocusRef.current += elapsed;
    focusStartedAtRef.current = null;
  }, []);

  const flushBreakRecord = useCallback(() => {
    if (breakElapsedSecondsRef.current <= 0) return;
    onBreakRecordedRef.current?.(breakElapsedSecondsRef.current);
    breakElapsedSecondsRef.current = 0;
  }, []);

  // ─── 메인 interval ──────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      // pause 시점: focus 누적 flush
      if (mode === 'focus') {
        flushFocusElapsed();
      }
      startedAtRef.current = null;
      return;
    }

    const now = Date.now();
    const totalDuration =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    const alreadyElapsed = totalDuration - remainingSecondsRef.current;
    startedAtRef.current = now - alreadyElapsed * 1000;

    // focus 모드 시작 시각 기록 (재개 포함)
    if (mode === 'focus') {
      focusStartedAtRef.current = now;
    }

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;

      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const next = Math.max(0, Math.round(totalDuration - elapsed));

      const prev = remainingSecondsRef.current;
      if (next === prev) return;

      const delta = prev - next;

      // break 경과 시간은 기존 방식 유지
      if (delta > 0 && mode === 'break') {
        breakElapsedSecondsRef.current += delta;
      }

      remainingSecondsRef.current = next;
      setRemainingSeconds(next);

      // totalFocusSeconds: timestamp 기반으로 계산
      if (mode === 'focus' && focusStartedAtRef.current !== null) {
        const focusElapsed = (Date.now() - focusStartedAtRef.current) / 1000;
        setTotalFocusSeconds(
          Math.round(accumulatedFocusRef.current + focusElapsed)
        );
      }
    }, 500);

    return () => window.clearInterval(interval);
  }, [
    isRunning,
    mode,
    focusPresetMinutes,
    breakPresetMinutes,
    flushFocusElapsed,
  ]);

  // ─── 완료 감지 ──────────────────────────────────────────
  useEffect(() => {
    if (remainingSeconds !== 0 || completionNotifiedRef.current) return;

    completionNotifiedRef.current = true;
    setIsRunning(false);

    if (mode === 'focus') {
      // 완료 시점 flush → totalFocusSeconds 정확하게 확정
      flushFocusElapsed();
      setTotalFocusSeconds(Math.round(accumulatedFocusRef.current));
      onFocusCompleteRef.current?.();
      return;
    }

    flushBreakRecord();
    onBreakCompleteRef.current?.();

    if (autoReturnToFocus) {
      setMode('focus');
      const newRemaining = focusPresetMinutes * 60;
      remainingSecondsRef.current = newRemaining;
      setRemainingSeconds(newRemaining);
    }
  }, [
    autoReturnToFocus,
    flushBreakRecord,
    flushFocusElapsed,
    focusPresetMinutes,
    mode,
    remainingSeconds,
  ]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      completionNotifiedRef.current = false;
    }
  }, [remainingSeconds]);

  // ─── restoreSession ─────────────────────────────────────
  const restoreSession = useCallback(
    ({
      mode: restoredMode,
      startedAt,
      durationSeconds,
      pausedSecondsElapsed = 0,
      totalFocusSeconds: restoredTotal = 0,
    }: RestoreSessionParams) => {
      const elapsed =
        (Date.now() - startedAt.getTime()) / 1000 - pausedSecondsElapsed;
      const remaining = Math.max(0, Math.round(durationSeconds - elapsed));

      // focus 모드라면 복원 시점까지 경과한 시간을 누적에 반영
      const focusElapsedSinceStart =
        restoredMode === 'focus' ? Math.max(0, elapsed) : 0;
      accumulatedFocusRef.current = restoredTotal + focusElapsedSinceStart;

      focusStartedAtRef.current = null; // interval 재시작 시 세팅됨

      setMode(restoredMode);
      remainingSecondsRef.current = remaining;
      setRemainingSeconds(remaining);
      setTotalFocusSeconds(Math.round(accumulatedFocusRef.current));
      completionNotifiedRef.current = false;

      if (remaining > 0) {
        setIsRunning(true);
      }
    },
    []
  );

  // ─── preset 변경 ────────────────────────────────────────
  const setFocusPresetMinutes = useCallback(
    (minutes: number) => {
      setFocusPresetMinutesState(minutes);
      if (mode === 'focus') {
        remainingSecondsRef.current = minutes * 60;
        setRemainingSeconds(minutes * 60);
      }
    },
    [mode]
  );

  const setBreakPresetMinutes = useCallback(
    (minutes: number) => {
      setBreakPresetMinutesState(minutes);
      if (mode === 'break') {
        remainingSecondsRef.current = minutes * 60;
        setRemainingSeconds(minutes * 60);
      }
    },
    [mode]
  );

  // ─── 제어 액션 ──────────────────────────────────────────
  const toggleRunning = useCallback(() => {
    if (!isRunning && remainingSeconds === 0) {
      const newRemaining =
        mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
      remainingSecondsRef.current = newRemaining;
      setRemainingSeconds(newRemaining);
    }
    setIsRunning(prev => !prev);
  }, [
    breakPresetMinutes,
    focusPresetMinutes,
    isRunning,
    mode,
    remainingSeconds,
  ]);

  const startBreak = useCallback(() => {
    if (mode === 'break') return;

    // focus → break 전환 시 집중 시간 flush
    flushFocusElapsed();
    setTotalFocusSeconds(Math.round(accumulatedFocusRef.current));

    breakElapsedSecondsRef.current = 0;
    completionNotifiedRef.current = false;
    setMode('break');
    const newRemaining = breakPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setIsRunning(true);
  }, [breakPresetMinutes, flushFocusElapsed, mode]);

  const skipToFocus = useCallback(() => {
    if (mode !== 'break') return;
    setIsRunning(false);
    breakElapsedSecondsRef.current = 0;
    completionNotifiedRef.current = false;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
  }, [focusPresetMinutes, mode]);

  const resetTimer = useCallback(() => {
    // focus 모드 reset 시 현재 구간 flush 후 다시 시작 대비 초기화
    if (mode === 'focus') {
      flushFocusElapsed();
      // reset은 현재 타이머만 초기화, 누적 집중시간은 유지
    }
    setIsRunning(false);
    completionNotifiedRef.current = false;
    const newRemaining =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
  }, [breakPresetMinutes, flushFocusElapsed, focusPresetMinutes, mode]);

  const endSession = useCallback(() => {
    // 세션 종료 시 모든 누적 초기화
    flushFocusElapsed();
    accumulatedFocusRef.current = 0;
    focusStartedAtRef.current = null;

    setIsRunning(false);
    completionNotifiedRef.current = false;
    breakElapsedSecondsRef.current = 0;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setTotalFocusSeconds(0);
  }, [flushFocusElapsed, focusPresetMinutes]);

  const startFocus = useCallback(() => {
    if (mode === 'break') {
      flushBreakRecord();
      breakElapsedSecondsRef.current = 0;
    }
    // focus 새로 시작 시 누적 초기화
    flushFocusElapsed();
    accumulatedFocusRef.current = 0;
    focusStartedAtRef.current = null;

    completionNotifiedRef.current = false;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setIsRunning(true);
  }, [flushBreakRecord, flushFocusElapsed, focusPresetMinutes, mode]);

  return {
    mode,
    isRunning,
    remainingSeconds,
    totalFocusSeconds,
    focusPresetMinutes,
    breakPresetMinutes,
    setFocusPresetMinutes,
    setBreakPresetMinutes,
    toggleRunning,
    startBreak,
    startFocus,
    skipToFocus,
    resetTimer,
    endSession,
    restoreSession,
  };
}

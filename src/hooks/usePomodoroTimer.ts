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
}

const MIN_ELAPSED_FOR_STAMP = 60;

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

  const getElapsedFocusSeconds = useCallback(() => {
    return focusPresetMinutes * 60 - remainingSeconds;
  }, [focusPresetMinutes, remainingSeconds]);

  const flushBreakRecord = useCallback(() => {
    if (breakElapsedSecondsRef.current <= 0) return;

    onBreakRecorded?.(breakElapsedSecondsRef.current);
    breakElapsedSecondsRef.current = 0;
  }, [onBreakRecorded]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) return 0;

        if (mode === 'focus') {
          setTotalFocusSeconds(total => total + 1);
        } else {
          breakElapsedSecondsRef.current += 1;
        }

        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    if (remainingSeconds !== 0 || completionNotifiedRef.current) return;

    completionNotifiedRef.current = true;
    setIsRunning(false);

    if (mode === 'focus') {
      onFocusComplete?.();
      return;
    }

    flushBreakRecord();
    onBreakComplete?.();

    if (autoReturnToFocus) {
      setMode('focus');
      setRemainingSeconds(focusPresetMinutes * 60);
    }
  }, [
    autoReturnToFocus,
    flushBreakRecord,
    focusPresetMinutes,
    mode,
    onBreakComplete,
    onFocusComplete,
    remainingSeconds,
  ]);

  useEffect(() => {
    if (remainingSeconds > 0) {
      completionNotifiedRef.current = false;
    }
  }, [remainingSeconds]);

  const setFocusPresetMinutes = useCallback(
    (minutes: number) => {
      setFocusPresetMinutesState(minutes);

      if (mode === 'focus') {
        setRemainingSeconds(minutes * 60);
      }
    },
    [mode]
  );

  const setBreakPresetMinutes = useCallback(
    (minutes: number) => {
      setBreakPresetMinutesState(minutes);

      if (mode === 'break') {
        setRemainingSeconds(minutes * 60);
      }
    },
    [mode]
  );

  const toggleRunning = useCallback(() => {
    if (!isRunning && remainingSeconds === 0) {
      setRemainingSeconds(
        mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60
      );
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

    if (remainingSeconds > 0) {
      const elapsed = getElapsedFocusSeconds();
      if (elapsed >= MIN_ELAPSED_FOR_STAMP) {
        onFocusFail?.(elapsed);
      }
    }

    breakElapsedSecondsRef.current = 0;
    completionNotifiedRef.current = false;
    setMode('break');
    setRemainingSeconds(breakPresetMinutes * 60);
    setIsRunning(true);
  }, [
    breakPresetMinutes,
    getElapsedFocusSeconds,
    mode,
    onFocusFail,
    remainingSeconds,
  ]);

  const skipToFocus = useCallback(() => {
    if (mode !== 'break') return;

    setIsRunning(false);
    flushBreakRecord();
    completionNotifiedRef.current = false;
    setMode('focus');
    setRemainingSeconds(focusPresetMinutes * 60);
  }, [flushBreakRecord, focusPresetMinutes, mode]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    completionNotifiedRef.current = false;

    if (mode === 'focus') {
      setRemainingSeconds(focusPresetMinutes * 60);
      return;
    }

    setRemainingSeconds(breakPresetMinutes * 60);
  }, [breakPresetMinutes, focusPresetMinutes, mode]);

  const endSession = useCallback(() => {
    if (mode === 'focus' && remainingSeconds > 0) {
      const elapsed = getElapsedFocusSeconds();
      if (elapsed >= MIN_ELAPSED_FOR_STAMP) {
        onFocusFail?.(elapsed);
      }
    }

    if (mode === 'break') {
      flushBreakRecord();
    }

    setIsRunning(false);
    completionNotifiedRef.current = false;
    breakElapsedSecondsRef.current = 0;
    setMode('focus');
    setRemainingSeconds(focusPresetMinutes * 60);
    setTotalFocusSeconds(0);
  }, [
    flushBreakRecord,
    focusPresetMinutes,
    getElapsedFocusSeconds,
    mode,
    onFocusFail,
    remainingSeconds,
  ]);

  const startFocus = useCallback(() => {
    setMode('focus');
    setRemainingSeconds(focusPresetMinutes * 60);
    setIsRunning(true);
  }, [focusPresetMinutes]);

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
  };
}

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
  resetFocus: (start?: boolean) => void;
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

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 0) return 0;
        if (mode === 'focus') {
          setTotalFocusSeconds(total => total + 1);
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, mode]);

  useEffect(() => {
    if (remainingSeconds === 0 && !completionNotifiedRef.current) {
      completionNotifiedRef.current = true;
      setIsRunning(false);

      if (mode === 'focus') {
        onFocusComplete?.();
      } else {
        onBreakComplete?.();
        if (autoReturnToFocus) {
          setMode('focus');
          setRemainingSeconds(focusPresetMinutes * 60);
        }
      }
    }

    if (remainingSeconds > 0) {
      completionNotifiedRef.current = false;
    }
  }, [
    remainingSeconds,
    mode,
    autoReturnToFocus,
    focusPresetMinutes,
    onFocusComplete,
    onBreakComplete,
  ]);

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
      const nextSeconds =
        mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
      setRemainingSeconds(nextSeconds);
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
    setMode('break');
    setRemainingSeconds(breakPresetMinutes * 60);
    setIsRunning(true);
  }, [breakPresetMinutes]);

  const resetFocus = useCallback(
    (start = false) => {
      setMode('focus');
      setRemainingSeconds(focusPresetMinutes * 60);
      setIsRunning(start);
    },
    [focusPresetMinutes]
  );

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
    resetFocus,
  };
}

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
  //  외부(orchestrator)에서 복원할 때 쓰는 함수
  restoreSession: (params: RestoreSessionParams) => void;
}

// 복원에 필요한 파라미터 타입
export interface RestoreSessionParams {
  mode: PomodoroMode;
  startedAt: Date; // 세션이 시작된 실제 시각
  durationSeconds: number; // 원래 설정된 총 시간
  pausedSecondsElapsed?: number; // 일시정지된 동안 흐른 시간 (있으면 차감)
  totalFocusSeconds?: number;
}

const MIN_ELAPSED_FOR_STAMP = 1;

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

  // ✅ 콜백을 ref로 관리 → 항상 최신 함수 참조, stale closure 방지
  const onFocusCompleteRef = useRef(onFocusComplete);
  const onBreakCompleteRef = useRef(onBreakComplete);
  const onFocusFailRef = useRef(onFocusFail);
  const onBreakRecordedRef = useRef(onBreakRecorded);

  // 매 렌더마다 최신 콜백으로 업데이트
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

  // setInterval 대신 "언제 시작했는지"를 기준으로 남은 시간을 계산하기 위해
  // null = 현재 실행 중이 아님
  const startedAtRef = useRef<number | null>(null);

  // 마지막으로 계산된 remainingSeconds를 ref로도 보관
  // setInterval 콜백에서 최신 값을 클로저 없이 참조하기 위해
  const remainingSecondsRef = useRef(initialFocusMinutes * 60);

  const getElapsedFocusSeconds = useCallback(() => {
    return focusPresetMinutes * 60 - remainingSeconds;
  }, [focusPresetMinutes, remainingSeconds]);

  const flushBreakRecord = useCallback(() => {
    if (breakElapsedSecondsRef.current <= 0) return;
    // ✅ ref로 호출
    onBreakRecordedRef.current?.(breakElapsedSecondsRef.current);
    breakElapsedSecondsRef.current = 0;
  }, []); // 의존성 없음

  useEffect(() => {
    if (!isRunning) {
      // 멈출 때 startedAt 초기화
      startedAtRef.current = null;
      return;
    }

    // 시작 시점 기록
    // 이미 실행 중이던 타이머가 재시작되는 경우:
    // remainingSecondsRef에 남은 시간이 있으므로
    // "지금 시각 - 남은시간만큼 앞"을 startedAt으로 설정해서
    // 계산 기준점을 맞춰줌
    const now = Date.now();

    // 더 명확하게: 현재 남은 시간이 x초라면,
    // "x초 전에 시작한 것처럼" 기준점을 잡음
    // 예) 남은 시간 20:00 → startedAt = 지금 (방금 시작)
    // 예) 남은 시간 15:00 → startedAt = 5분 전 (이미 5분 경과된 것으로 취급)
    const totalDuration =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    const alreadyElapsed = totalDuration - remainingSecondsRef.current;
    startedAtRef.current = now - alreadyElapsed * 1000;

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) {
        return;
      }

      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const next = Math.max(0, Math.round(totalDuration - elapsed));

      // 이전 값과 같으면 업데이트 안 함 (불필요한 리렌더 방지)
      const prev = remainingSecondsRef.current;
      if (next === prev) return; // 변화 없으면 스킵

      const delta = prev - next; // 줄어든 초

      // focus 모드일 때 집중 시간 누적
      // 이전 값 - 현재 값 = 이번 틱에서 줄어든 초
      if (delta > 0) {
        if (mode === 'focus') {
          setTotalFocusSeconds(total => total + delta);
        } else {
          breakElapsedSecondsRef.current += delta;
        }
      }

      // ✅ delta 계산 완료 후에 ref 업데이트
      remainingSecondsRef.current = next;
      setRemainingSeconds(next);
    }, 500);

    return () => window.clearInterval(interval);
  }, [isRunning, mode, focusPresetMinutes, breakPresetMinutes]);
  // 의존성에 remainingSeconds를 넣지 않는 이유:
  // remainingSeconds가 바뀔 때마다 interval이 재시작되면
  // startedAt이 계속 리셋돼서 시간이 제대로 안 줄어들기 때문

  // 완료 감지
  useEffect(() => {
    if (remainingSeconds !== 0 || completionNotifiedRef.current) return;

    console.log('[완료 감지]', mode, '| remainingSeconds:', remainingSeconds);

    completionNotifiedRef.current = true;
    setIsRunning(false);

    if (mode === 'focus') {
      // ✅ ref로 호출
      onFocusCompleteRef.current?.();
      return;
    }

    flushBreakRecord();
    // ✅ ref로 호출
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
    focusPresetMinutes,
    mode,
    remainingSeconds,
  ]);
  // ✅ onFocusComplete, onBreakComplete 의존성 제거 (ref로 관리하니까)

  useEffect(() => {
    if (remainingSeconds > 0) {
      completionNotifiedRef.current = false;
    }
  }, [remainingSeconds]);

  // 외부에서 세션 상태를 복원할 때 쓰는 함수
  // Supabase에서 active_session을 읽어온 뒤 orchestrator가 호출함
  const restoreSession = useCallback(
    ({
      mode: restoredMode,
      startedAt,
      durationSeconds,
      pausedSecondsElapsed = 0,
      totalFocusSeconds: restoredTotal = 0,
    }: RestoreSessionParams) => {
      // 경과 시간 = 지금 - 시작 시각 - 일시정지로 멈춰있던 시간
      const elapsed =
        (Date.now() - startedAt.getTime()) / 1000 - pausedSecondsElapsed;
      const remaining = Math.max(0, Math.round(durationSeconds - elapsed));

      setMode(restoredMode);
      remainingSecondsRef.current = remaining;
      setRemainingSeconds(remaining);
      setTotalFocusSeconds(restoredTotal);
      completionNotifiedRef.current = false;

      // 남은 시간이 있으면 자동으로 다시 실행
      if (remaining > 0) {
        setIsRunning(true);
      }
    },
    []
  );

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

    // ✅ onFocusFail 호출 제거 - orchestrator가 직접 처리
    breakElapsedSecondsRef.current = 0;
    completionNotifiedRef.current = false;
    setMode('break');
    const newRemaining = breakPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setIsRunning(true);
  }, [breakPresetMinutes, mode]);
  // ✅ onFocusFail 의존성 제거

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
    setIsRunning(false);
    completionNotifiedRef.current = false;
    const newRemaining =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
  }, [breakPresetMinutes, focusPresetMinutes, mode]);

  const endSession = useCallback(() => {
    setIsRunning(false);
    completionNotifiedRef.current = false;
    breakElapsedSecondsRef.current = 0;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setTotalFocusSeconds(0);
  }, [focusPresetMinutes]);

  const startFocus = useCallback(() => {
    if (mode === 'break') {
      flushBreakRecord();
      breakElapsedSecondsRef.current = 0;
    }
    completionNotifiedRef.current = false;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    setIsRunning(true);
  }, [flushBreakRecord, focusPresetMinutes, mode]);

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

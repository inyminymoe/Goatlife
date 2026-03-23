'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// ─── 모듈 레벨 중복 완료 방지 ───────────────────────────────
// React StrictMode / concurrent mode에서 컴포넌트가 언마운트/리마운트될 때
// useRef는 초기값으로 재생성되어 가드가 무력화된다.
// 모듈 레벨 변수는 리마운트와 무관하게 살아남으므로 안전하게 dedup할 수 있다.
let _lastFocusCompletionAt = 0;

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
  continueToNextFocus: () => void;
  skipToFocus: () => void;
  resetTimer: () => void;
  endSession: () => void;
  restoreSession: (params: RestoreSessionParams) => void;
  recalibrate: () => void;
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

  // 콜백을 ref로 관리: useEffect dependency에 넣으면 매 렌더마다 interval이
  // 재생성되므로 ref에 최신 콜백을 저장하고 interval 내부에서 ref를 통해 호출한다.
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

  // ─── 타이머 상태 ────────────────────────────────────────
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

  // ─── interval 제어용 ref ────────────────────────────────
  // completionNotifiedRef: 완료 이벤트 중복 발생 방지 플래그
  const completionNotifiedRef = useRef(false);
  // breakElapsedSecondsRef: break 경과 시간 누적 (onBreakRecorded 콜백 인자)
  const breakElapsedSecondsRef = useRef(0);
  // startedAtRef: 현재 interval의 시작 timestamp (ms).
  //   "총 durationSeconds 중 얼마나 지났는지"를 매 tick마다 재계산하는 기준점.
  const startedAtRef = useRef<number | null>(null);
  // remainingSecondsRef: state와 동기화된 remainingSeconds의 ref 버전.
  //   interval 클로저 안에서 최신값을 읽기 위해 사용 (stale closure 방지).
  const remainingSecondsRef = useRef(initialFocusMinutes * 60);

  // ─── 총 집중시간 추적용 ref ─────────────────────────────
  // focusStartedAtRef: 현재 focus 구간이 시작된 timestamp (ms).
  //   pause / 모드 전환 / 세션 종료 시 null로 초기화된다.
  const focusStartedAtRef = useRef<number | null>(null);
  // accumulatedFocusRef: 이전 focus 구간들의 누적 집중 시간 (초).
  //   현재 진행 중인 구간은 포함하지 않으며, flush 시점에 합산된다.
  const accumulatedFocusRef = useRef(0);

  // ─── focus 누적 flush 헬퍼 ──────────────────────────────
  // 현재 진행 중인 focus 구간의 경과 시간을 accumulatedFocusRef에 합산하고
  // focusStartedAtRef를 null로 초기화한다.
  // pause / 모드 전환 / 세션 종료 직전에 반드시 호출해야 정확한 집중 시간이 보장된다.
  const flushFocusElapsed = useCallback(() => {
    if (focusStartedAtRef.current === null) return;
    const elapsed = (Date.now() - focusStartedAtRef.current) / 1000;
    accumulatedFocusRef.current += elapsed;
    focusStartedAtRef.current = null;
  }, []);

  // break가 끝나거나 skip될 때 경과 시간을 onBreakRecorded 콜백으로 전달하고 초기화한다.
  const flushBreakRecord = useCallback(() => {
    if (breakElapsedSecondsRef.current <= 0) return;
    onBreakRecordedRef.current?.(breakElapsedSecondsRef.current);
    breakElapsedSecondsRef.current = 0;
  }, []);

  // ─── 메인 interval ──────────────────────────────────────
  // isRunning / mode / preset이 바뀔 때마다 interval을 재생성한다.
  useEffect(() => {
    if (!isRunning) {
      // pause 시점: 현재 focus 구간의 경과 시간을 누적에 반영한다.
      if (mode === 'focus') flushFocusElapsed();
      startedAtRef.current = null;
      return;
    }

    const now = Date.now();
    const totalDuration =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;

    // 이미 경과한 시간만큼 startedAt을 과거로 당겨서
    // "타이머가 처음부터 돌고 있었던 것처럼" 기준점을 맞춘다.
    const alreadyElapsed = totalDuration - remainingSecondsRef.current;
    startedAtRef.current = now - alreadyElapsed * 1000;

    // focus 재개 시 이 구간의 시작 시각을 기록한다.
    if (mode === 'focus') focusStartedAtRef.current = now;

    const interval = window.setInterval(() => {
      if (startedAtRef.current === null) return;

      // startedAt 기준으로 실제 경과 시간을 계산해 남은 시간을 갱신한다.
      // setInterval의 drift(누적 오차)를 방지하기 위해 매 tick마다 재계산한다.
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const next = Math.max(0, Math.round(totalDuration - elapsed));

      const prev = remainingSecondsRef.current;
      if (next === prev) return; // 변화 없으면 리렌더 스킵

      const delta = prev - next;

      if (delta > 0 && mode === 'break') {
        breakElapsedSecondsRef.current += delta;
      }

      remainingSecondsRef.current = next;
      setRemainingSeconds(next);

      // 총 집중시간: 누적값 + 현재 구간 경과시간을 실시간으로 반영한다.
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
  // remainingSeconds가 0이 되면 모드에 따라 완료 처리를 수행한다.
  // completionNotifiedRef로 동일 완료 이벤트가 중복 발화되는 것을 막는다.
  useEffect(() => {
    if (remainingSeconds !== 0 || completionNotifiedRef.current) return;
    // React 18 StrictMode/concurrent mode 이중 실행 방지:
    // ref는 리마운트 시 초기화되므로 모듈 레벨 변수로 가드한다.
    const now = Date.now();
    if (now - _lastFocusCompletionAt < 2000) return;
    _lastFocusCompletionAt = now;

    completionNotifiedRef.current = true;
    setIsRunning(false);

    if (mode === 'focus') {
      // focus 완료: 마지막 구간을 flush해 totalFocusSeconds를 확정한 뒤 콜백 호출
      flushFocusElapsed();
      setTotalFocusSeconds(Math.round(accumulatedFocusRef.current));
      onFocusCompleteRef.current?.();
      return;
    }

    // break 완료: break 경과 기록을 저장하고 콜백 호출
    flushBreakRecord();
    onBreakCompleteRef.current?.();

    // autoReturnToFocus가 true면 자동으로 focus 모드로 복귀한다.
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

  // remainingSeconds가 다시 0보다 커지면 완료 플래그를 리셋한다.
  useEffect(() => {
    if (remainingSeconds > 0) completionNotifiedRef.current = false;
  }, [remainingSeconds]);

  // ─── restoreSession ─────────────────────────────────────
  // 새로고침 시 DB에 저장된 세션 정보를 기반으로 타이머 상태를 복원한다.
  const restoreSession = useCallback(
    ({
      mode: restoredMode,
      startedAt,
      durationSeconds,
      pausedSecondsElapsed = 0,
      totalFocusSeconds: restoredTotal = 0,
    }: RestoreSessionParams) => {
      // DB 저장 시각(startedAt)부터 현재까지 실제로 경과한 시간을 계산한다.
      // pausedSecondsElapsed만큼은 실제 집중/휴식이 아니므로 차감한다.
      const elapsed =
        (Date.now() - startedAt.getTime()) / 1000 - pausedSecondsElapsed;
      const remaining = Math.max(0, Math.round(durationSeconds - elapsed));

      // focus 모드라면 DB 저장 이후 경과 시간까지 누적에 반영한다.
      // 이렇게 해야 새로고침 후에도 집중 시간이 0으로 초기화되지 않는다.
      const focusElapsedSinceStart =
        restoredMode === 'focus' ? Math.max(0, elapsed) : 0;
      accumulatedFocusRef.current = restoredTotal + focusElapsedSinceStart;

      // focusStartedAtRef는 null로 두고, isRunning이 true로 바뀔 때
      // 메인 interval effect에서 현재 시각으로 세팅되도록 한다.
      focusStartedAtRef.current = null;

      setMode(restoredMode);
      remainingSecondsRef.current = remaining;
      setRemainingSeconds(remaining);
      // 복원 즉시 화면에도 정확한 총 집중시간을 표시한다.
      setTotalFocusSeconds(Math.round(accumulatedFocusRef.current));
      completionNotifiedRef.current = false;

      if (remaining > 0) setIsRunning(true);
    },
    []
  );

  // ─── recalibrate ────────────────────────────────────────
  // 백그라운드 탭 복귀 시 호출한다.
  // setInterval은 백그라운드에서 throttle되어 remainingSecondsRef가 stale해질 수 있으므로
  // startedAtRef와 focusStartedAtRef를 현재 remainingSeconds 기준으로 함께 재설정한다.
  //
  // focusStartedAtRef 재설정 공식:
  //   focusStartedAtRef = startedAtRef + accumulatedFocusRef * 1000
  // → totalFocusSeconds = accumulated + (now - focusStartedAtRef)
  //                      = accumulated + (alreadyElapsed - accumulated)
  //                      = alreadyElapsed (카운트다운과 일치)
  // pause/resume 세션도 올바르게 처리됨:
  //   accumulated = elapsed_before_pause, alreadyElapsed = elapsed_before_pause + time_since_resume
  //   → totalFocusSeconds = elapsed_before_pause + time_since_resume ✓
  const recalibrate = useCallback(() => {
    if (!isRunning) return;
    const totalDuration =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    const alreadyElapsed = totalDuration - remainingSecondsRef.current;
    const now = Date.now();
    startedAtRef.current = now - alreadyElapsed * 1000;
    // focusStartedAtRef도 동기화 — startedAtRef만 재설정하면 totalFocusSeconds가
    // 카운트다운 대비 최대 수십 초 앞서가는 오차가 발생한다.
    if (mode === 'focus' && focusStartedAtRef.current !== null) {
      focusStartedAtRef.current =
        startedAtRef.current + accumulatedFocusRef.current * 1000;
    }
  }, [isRunning, mode, focusPresetMinutes, breakPresetMinutes]);

  // ─── preset 변경 ────────────────────────────────────────
  // 타이머가 해당 모드로 동작 중일 때 preset을 바꾸면 남은 시간도 즉시 갱신한다.
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

  // 재생/일시정지 토글. 타이머가 0인 상태에서 재생하면 preset 시간으로 리셋된다.
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

  // focus → break 전환. 이미 break 중이면 무시한다.
  const startBreak = useCallback(() => {
    if (mode === 'break') return;
    // 전환 전 현재 focus 구간 경과 시간을 누적에 반영한다.
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

  // break → focus 전환 (일시정지 상태로). break 중이 아니면 무시한다.
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

  // 현재 모드의 타이머만 preset 시간으로 리셋한다.
  // 누적 집중 시간(accumulatedFocusRef)은 유지된다.
  const resetTimer = useCallback(() => {
    if (mode === 'focus') flushFocusElapsed();
    setIsRunning(false);
    completionNotifiedRef.current = false;
    const newRemaining =
      mode === 'focus' ? focusPresetMinutes * 60 : breakPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
  }, [breakPresetMinutes, flushFocusElapsed, focusPresetMinutes, mode]);

  // 세션 전체를 종료하고 모든 상태를 초기값으로 되돌린다.
  const endSession = useCallback(() => {
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

  // focus를 새로 시작한다. break 중이었다면 break 기록을 먼저 저장한다.
  // 누적 집중 시간은 새 세션이므로 0으로 초기화된다.
  const startFocus = useCallback(() => {
    if (mode === 'break') {
      flushBreakRecord();
      breakElapsedSecondsRef.current = 0;
    }
    flushFocusElapsed();
    accumulatedFocusRef.current = 0;
    completionNotifiedRef.current = false;
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);
    // isRunning이 이미 true인 경우 setIsRunning(true)는 변화 없음
    // → interval effect 재실행 안 됨 → 기존 startedAtRef 유지 → 타이머 리셋 안 됨
    // continueToNextFocus와 동일하게 ref를 직접 갱신해 interval 기준점을 교체한다.
    const now = Date.now();
    startedAtRef.current = now;
    focusStartedAtRef.current = now;
    setIsRunning(true);
  }, [flushBreakRecord, flushFocusElapsed, focusPresetMinutes, mode]);

  // 루틴 모드에서 다음 루틴으로 이동할 때 사용한다.
  // startFocus와 동일하지만 accumulatedFocusRef를 초기화하지 않아
  // 이전 루틴까지의 집중 시간이 총 집중 시간에 누적된다.
  //
  // ⚠️ startedAtRef / focusStartedAtRef를 직접 갱신하는 이유:
  // onFocusComplete 콜백은 completion detection useEffect 내부에서 실행되므로
  // setIsRunning(false → true)이 같은 React 배치로 처리된다.
  // 이때 isRunning의 최종값이 true → true (변화 없음)으로 감지되어
  // main interval effect가 재실행되지 않는다.
  // 재실행되지 않으면 기존 interval이 완료된 세션의 startedAtRef를 그대로 사용해
  // remainingSeconds가 즉시 0으로 계산되고 무한 체이닝이 발생한다.
  // startedAtRef를 현재 시각으로 직접 갱신하면
  // 기존 interval이 새 세션 기준으로 올바르게 카운트다운한다.
  const continueToNextFocus = useCallback(() => {
    flushFocusElapsed();
    // accumulatedFocusRef.current는 유지 (총 집중 시간 누적)
    //
    // ⚠️ 여기서 completionNotifiedRef.current = false 리셋 금지:
    // 이 함수는 onFocusComplete 콜백 내부에서 동기 호출된다.
    // 그 전에 advanceToNextRoutineRef가 currentFocusSessionKeyRef를 새 UUID로 교체하므로,
    // 여기서 리셋하면 완료 감지 effect가 remainingSeconds=0 상태에서 재실행될 때
    // dedup 가드를 뚫고 focus-done이 중복 저장된다.
    // 리셋은 "remainingSeconds > 0" effect에서 처리한다.
    setMode('focus');
    const newRemaining = focusPresetMinutes * 60;
    remainingSecondsRef.current = newRemaining;
    setRemainingSeconds(newRemaining);

    // interval 기준점을 현재 시각으로 직접 갱신
    const now = Date.now();
    startedAtRef.current = now;
    focusStartedAtRef.current = now;

    setIsRunning(true);
  }, [flushFocusElapsed, focusPresetMinutes]);

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
    continueToNextFocus,
    skipToFocus,
    resetTimer,
    endSession,
    restoreSession,
    recalibrate,
  };
}

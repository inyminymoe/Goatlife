'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import TimerCard from './TimerCard';
import TimelineCard from './TimelineCard';
import Toast from '@/components/ui/Toast';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { PomodoroSession } from '@/types/pomodoro';
import type { TimerSettings } from './types';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'warning';
}

function sendWindowNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export default function WorkPlanTimerSection() {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);

  const focusPresetRef = useRef(30);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'success') => {
      setToast({ message, type });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const addSession = useCallback(
    (status: PomodoroSession['status'], durationSeconds: number) => {
      setSessions(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          status,
          durationSeconds,
          startedAt: new Date(),
        },
      ]);
    },
    []
  );

  const {
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
    skipToFocus,
    resetTimer,
    endSession,
  } = usePomodoroTimer({
    initialFocusMinutes: 30,
    initialBreakMinutes: 15,
    autoStart: false,
    onFocusComplete: () => {
      addSession('focus-done', focusPresetRef.current * 60);
      showToast('집중이 완료됐어요. 다음 흐름을 이어가세요.', 'success');
      sendWindowNotification(
        '집중 완료',
        '설정한 집중 시간이 끝났어요. 다음 작업을 이어갈 수 있어요.'
      );
    },
    onBreakComplete: () => {
      showToast('휴식이 끝났어요. 다시 집중을 시작할 수 있어요.', 'info');
      sendWindowNotification(
        '휴식 종료',
        '휴식 시간이 끝났어요. 다시 집중을 시작할 수 있어요.'
      );
    },
    onFocusFail: elapsed => addSession('focus-incomplete', elapsed),
    onBreakRecorded: elapsed => addSession('break', elapsed),
  });

  focusPresetRef.current = focusPresetMinutes;

  const handleToggleRunning = useCallback(() => {
    toggleRunning();
    showToast(
      isRunning ? '타이머가 멈췄어요🐢' : '타이머 시작! 집중해서 끝내봐요🍀',
      isRunning ? 'info' : 'success'
    );
  }, [isRunning, showToast, toggleRunning]);

  const handleSkip = useCallback(() => {
    if (mode === 'focus') {
      startBreak();
      showToast('휴식 시간으로 넘어갔어요.', 'info');
      return;
    }

    skipToFocus();
    showToast("'다음 작업'을 시작하려면 재생버튼을 눌러주세요.", 'info');
  }, [mode, showToast, skipToFocus, startBreak]);

  const handleReset = useCallback(() => {
    resetTimer();
    showToast('현재 타이머를 초기화했어요.', 'info');
  }, [resetTimer, showToast]);

  const handleEnd = useCallback(() => {
    endSession();
    showToast('현재 세션을 종료했어요.', 'success');
  }, [endSession, showToast]);

  const handleSaveSettings = useCallback(
    (settings: TimerSettings) => {
      setFocusPresetMinutes(settings.focusPresetMinutes);
      setBreakPresetMinutes(settings.breakPresetMinutes);
      showToast('타이머 설정을 저장했어요.', 'success');
    },
    [setBreakPresetMinutes, setFocusPresetMinutes, showToast]
  );

  return (
    <>
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <TimerCard
          mode={mode}
          isRunning={isRunning}
          remainingSeconds={remainingSeconds}
          totalFocusSeconds={totalFocusSeconds}
          focusPresetMinutes={focusPresetMinutes}
          breakPresetMinutes={breakPresetMinutes}
          onToggleRunning={handleToggleRunning}
          onSkip={handleSkip}
          onReset={handleReset}
          onEnd={handleEnd}
          onSaveSettings={handleSaveSettings}
        />
        <TimelineCard sessions={sessions} />
      </section>

      <Toast
        show={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={dismissToast}
      />
    </>
  );
}

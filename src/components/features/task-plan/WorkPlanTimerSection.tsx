'use client';

import { useCallback, useEffect, useState } from 'react';
import TimerCard from './TimerCard';
import TimelineCard from './TimelineCard';
import Toast from '@/components/ui/Toast';
import { useSessionOrchestrator } from './hooks/useSessionOrchestrator';
import {
  ROUTINE_TIMER_START_EVENT,
  RoutineTimerStartDetail,
} from './routineStartEvent';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function WorkPlanTimerSection() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastState['type'] = 'success') => {
      setToast({ message, type });
    },
    []
  );

  const {
    timerMode,
    isRunning,
    remainingSeconds,
    totalFocusSeconds,
    focusPresetMinutes,
    breakPresetMinutes,
    activeRoutine,
    records,
    startManual,
    startRoutine,
    handleToggleRunning,
    handleSkip,
    handleReset,
    handleEnd,
    handleSaveSettings,
  } = useSessionOrchestrator({
    initialFocusMinutes: 30,
    initialBreakMinutes: 15,
    onToast: showToast,
  });

  //  RoadmapCard dispatch 이벤트 수신 → 타이머 시작
  useEffect(() => {
    const handleRoutineStart = (e: Event) => {
      const { routines } = (e as CustomEvent<RoutineTimerStartDetail>).detail;
      if (!routines || routines.length === 0) return;

      if (routines.length === 1) {
        // 개별 루틴 → Manual Mode
        startManual({ id: routines[0].id, title: routines[0].title });
      } else {
        // 전체 루틴 → Routine Mode
        startRoutine(routines.map(r => ({ id: r.id, title: r.title })));
      }
    };

    window.addEventListener(ROUTINE_TIMER_START_EVENT, handleRoutineStart);
    return () =>
      window.removeEventListener(ROUTINE_TIMER_START_EVENT, handleRoutineStart);
  }, [startManual, startRoutine]);

  return (
    <>
      <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <TimerCard
          mode={timerMode}
          isRunning={isRunning}
          remainingSeconds={remainingSeconds}
          totalFocusSeconds={totalFocusSeconds}
          focusPresetMinutes={focusPresetMinutes}
          breakPresetMinutes={breakPresetMinutes}
          routineName={activeRoutine?.title}
          onToggleRunning={handleToggleRunning}
          onSkip={handleSkip}
          onReset={handleReset}
          onEnd={handleEnd}
          onSaveSettings={handleSaveSettings}
        />
        <TimelineCard sessions={records} />
      </section>

      <Toast
        show={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </>
  );
}

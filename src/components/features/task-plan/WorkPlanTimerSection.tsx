'use client';

import { useCallback, useState } from 'react';
import TimerCard from './TimerCard';
import TimelineCard from './TimelineCard';
import Toast from '@/components/ui/Toast';
import { useSessionOrchestrator } from './hooks/useSessionOrchestrator';

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
          routineName={activeRoutine?.title} // ← 현재 루틴 이름 표시
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

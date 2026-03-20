'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import BottomSheet from '@/components/ui/BottomSheet';
import TimerSettingContent from './TimerSettingContent';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import {
  ROUTINE_TIMER_START_EVENT,
  type RoutineTimerStartDetail,
} from './routineStartEvent';
import { useToast } from '@/providers/ToastProvider';

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatTotalFocus(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const totalMinutes = Math.floor(safeSeconds / 60);

  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  };
}

interface PomodoroTimerCardProps {
  onFocusDone?: (durationSeconds: number) => void;
  onFocusFail?: (elapsedSeconds: number) => void;
  onBreakRecorded?: (elapsedSeconds: number) => void;
}

export default function PomodoroTimerCard({
  onFocusDone,
  onFocusFail,
  onBreakRecorded,
}: PomodoroTimerCardProps = {}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toast = useToast();

  const dismissToast = useCallback(() => setToastMessage(null), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const focusPresetRef = useRef(30);

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
    startFocus,
  } = usePomodoroTimer({
    initialFocusMinutes: 30,
    initialBreakMinutes: 15,
    onFocusComplete: () => {
      setToastMessage('1 뽀모도로 완성🍅');
      onFocusDone?.(focusPresetRef.current * 60);
    },
    onBreakComplete: () => setToastMessage('잘 쉬었나요? 다시 힘차게 달려요✊'),
    onFocusFail,
    onBreakRecorded,
  });

  focusPresetRef.current = focusPresetMinutes;

  const totalFocus = useMemo(
    () => formatTotalFocus(totalFocusSeconds),
    [totalFocusSeconds]
  );

  useEffect(() => {
    const handleRoutineTimerStart = (event: Event) => {
      const customEvent = event as CustomEvent<RoutineTimerStartDetail>;
      startFocus();
      const title = customEvent.detail?.routines?.[0]?.title?.trim();
      if (title) {
        toast.success(`'${title}' 타이머를 시작했어요.`);
      }
    };

    window.addEventListener(ROUTINE_TIMER_START_EVENT, handleRoutineTimerStart);
    return () => {
      window.removeEventListener(
        ROUTINE_TIMER_START_EVENT,
        handleRoutineTimerStart
      );
    };
  }, [startFocus, toast]);

  const handleSaveSettings = useCallback(
    (settings: { focusPresetMinutes: number; breakPresetMinutes: number }) => {
      setFocusPresetMinutes(settings.focusPresetMinutes);
      setBreakPresetMinutes(settings.breakPresetMinutes);
      setToastMessage('타이머 설정을 저장했어요.');
    },
    [setBreakPresetMinutes, setFocusPresetMinutes]
  );

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon
              icon="icon-park:tomato"
              className="w-6 h-6 icon-dark-invert"
              aria-hidden="true"
            />
            <h2 className="brand-h3 text-grey-900">Timer</h2>
          </div>
          <button
            type="button"
            className="p-1 rounded-full transition-colors hover:bg-grey-200"
            aria-label="타이머 설정 열기"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Icon
              icon="icon-park:more-one"
              className="w-6 h-6 icon-dark-invert"
            />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="body-sm font-semibold text-grey-500">Timer</span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 tabular-nums text-primary-500">
                {formatTime(remainingSeconds)}
              </span>
              <span className="body-xs text-grey-500">
                {mode === 'focus' ? '남은 집중시간' : '남은 휴식시간'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="body-sm font-semibold text-grey-500">
              총 집중시간
            </span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 tabular-nums text-primary-500">
                {totalFocus.hours}
              </span>
              <span className="body-xs text-grey-500">시간</span>
              <span className="brand-h1 tabular-nums text-primary-500">
                {totalFocus.minutes}
              </span>
              <span className="body-xs text-grey-500">분</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth onClick={toggleRunning}>
            {isRunning ? '일시정지' : '시작'}
          </Button>
          <Button variant="text" fullWidth onClick={startBreak}>
            휴식하기
          </Button>
        </div>
      </section>

      <BottomSheet
        open={isDrawerOpen}
        onClose={closeDrawer}
        title="타이머 설정"
      >
        <TimerSettingContent
          focusPresetMinutes={focusPresetMinutes}
          breakPresetMinutes={breakPresetMinutes}
          onSave={handleSaveSettings}
          onClose={closeDrawer}
        />
      </BottomSheet>

      <Toast
        show={!!toastMessage}
        message={toastMessage ?? ''}
        type="success"
        onClose={dismissToast}
      />
    </>
  );
}

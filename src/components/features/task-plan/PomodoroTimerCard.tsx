'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import BottomSheet from '@/components/ui/BottomSheet';
import TimerSettingContent from './TimerSettingContent';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';

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

export default function PomodoroTimerCard() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  } = usePomodoroTimer({
    initialFocusMinutes: 30,
    initialBreakMinutes: 15,
    onFocusComplete: () => setToastMessage('1 뽀모도로 완성🍅'),
    onBreakComplete: () => setToastMessage('잘 쉬었나요? 다시 힘차게 달려요✊'),
  });

  const totalFocus = useMemo(
    () => formatTotalFocus(totalFocusSeconds),
    [totalFocusSeconds]
  );

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon
              icon="icon-park:tomato"
              className="w-6 h-6 text-grey-900"
              aria-hidden="true"
            />
            <h2 className="brand-h3 text-grey-900">Timer</h2>
          </div>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-grey-200 transition-colors"
            aria-label="타이머 설정 열기"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Icon icon="icon-park:more-one" className="w-6 h-6 text-grey-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="body-sm text-grey-300 font-semibold">Timer</span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {formatTime(remainingSeconds)}
              </span>
              <span className="body-xs text-grey-500">
                {mode === 'focus' ? '남은 집중시간' : '남은 휴식시간'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="body-sm text-grey-300 font-semibold">
              총 집중시간
            </span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {totalFocus.hours}
              </span>
              <span className="body-xs text-grey-500">시간</span>
              <span className="brand-h1 text-primary-500 tabular-nums">
                {totalFocus.minutes}
              </span>
              <span className="body-xs text-grey-500">분</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth onClick={toggleRunning}>
            {isRunning ? '일시정지' : '재시작'}
          </Button>
          <Button variant="text" fullWidth onClick={startBreak}>
            휴식하기
          </Button>
        </div>
      </section>

      <BottomSheet
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="타이머 설정"
      >
        <TimerSettingContent
          focusPresetMinutes={focusPresetMinutes}
          breakPresetMinutes={breakPresetMinutes}
          setFocusPresetMinutes={setFocusPresetMinutes}
          setBreakPresetMinutes={setBreakPresetMinutes}
        />
      </BottomSheet>

      <Toast
        show={!!toastMessage}
        message={toastMessage ?? ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import BottomSheet from '@/components/ui/BottomSheet';
import TimerSettingContent from './TimerSettingContent';
import type { TimerMode, TimerSettings } from './types';

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

type ConfirmAction = 'skip' | 'end' | null;

interface ControlIconButtonProps {
  tooltip: string;
  ariaLabel: string;
  icon: string;
  onClick: () => void;
}

function ControlIconButton({
  tooltip,
  ariaLabel,
  icon,
  onClick,
}: ControlIconButtonProps) {
  return (
    <div className="group relative flex">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="text-fixed-grey-200 transition-colors hover:text-fixed-white"
      >
        <Icon icon={icon} className="h-5 w-5" />
      </button>
      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+8px)] opacity-0 transition-all duration-200 ease-out group-hover:-translate-y-[calc(100%+12px)] group-hover:opacity-100 group-focus-within:-translate-y-[calc(100%+12px)] group-focus-within:opacity-100">
        <div className="whitespace-nowrap rounded-[6px] bg-fixed-grey-900 px-2 py-1 text-12 font-medium text-fixed-white shadow-lg">
          {tooltip}
        </div>
      </div>
    </div>
  );
}

interface TimerCardProps {
  mode: TimerMode;
  isRunning: boolean;
  remainingSeconds: number;
  totalFocusSeconds: number;
  focusPresetMinutes: number;
  breakPresetMinutes: number;
  routineName?: string;
  nextRoutineName?: string;
  onToggleRunning: () => void;
  onSkip: () => void;
  onReset: () => void;
  onEnd: () => void;
  onSaveSettings: (settings: TimerSettings) => void;
}

export default function TimerCard({
  mode,
  isRunning,
  remainingSeconds,
  totalFocusSeconds,
  focusPresetMinutes,
  breakPresetMinutes,
  routineName,
  nextRoutineName,
  onToggleRunning,
  onSkip,
  onReset,
  onEnd,
  onSaveSettings,
}: TimerCardProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const totalFocus = useMemo(
    () => formatTotalFocus(totalFocusSeconds),
    [totalFocusSeconds]
  );

  const sessionLabel =
    routineName ?? (mode === 'focus' ? '집중 중' : '휴식 중');
  const skipTargetLabel =
    mode === 'focus' ? (nextRoutineName ?? '휴식 시간') : '다음 단계';
  const confirmTitle =
    confirmAction === 'skip' ? '다음 단계로 넘어갈까요?' : '세션 종료';
  const confirmDescription =
    confirmAction === 'skip'
      ? `'${skipTargetLabel}'으로 넘어가면 현재 기록이 중단됩니다.`
      : '세션을 종료하면 진행 중인 기록이 중단됩니다.';

  const closeConfirm = useCallback(() => setConfirmAction(null), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleConfirmAction = useCallback(() => {
    if (confirmAction === 'skip') {
      onSkip();
    }

    if (confirmAction === 'end') {
      onEnd();
    }

    closeConfirm();
  }, [closeConfirm, confirmAction, onEnd, onSkip]);

  return (
    <>
      <section className="flex flex-col gap-5 rounded-[5px] bg-grey-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon
              icon="icon-park:tomato"
              className="h-6 w-6 icon-dark-invert"
              aria-hidden="true"
            />
            <h2 className="brand-h3 text-grey-900">Timer</h2>
          </div>
          <button
            type="button"
            className="rounded-full p-1 transition-colors hover:bg-grey-200"
            aria-label="타이머 설정 열기"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Icon
              icon="icon-park:more-one"
              className="h-6 w-6 icon-dark-invert"
            />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
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

        <div className="flex items-center justify-between rounded-[5px] bg-fixed-grey-900 px-4 py-3">
          <span className="body-sm mr-3 truncate font-semibold text-fixed-white">
            {sessionLabel}
          </span>
          <div className="flex flex-shrink-0 items-center gap-3">
            <ControlIconButton
              tooltip={isRunning ? '타이머 일시정지' : '타이머 시작'}
              ariaLabel={isRunning ? '일시정지' : '시작'}
              icon={
                isRunning
                  ? 'material-symbols:pause-rounded'
                  : 'material-symbols:play-arrow-rounded'
              }
              onClick={onToggleRunning}
            />
            <ControlIconButton
              tooltip={
                mode === 'focus' ? '다음 단계로 이동' : '다음 단계로 넘어가기'
              }
              ariaLabel={
                mode === 'focus' ? '다음 단계로 이동' : '다음 단계로 넘어가기'
              }
              icon="material-symbols:skip-next-rounded"
              onClick={() => setConfirmAction('skip')}
            />
            <ControlIconButton
              tooltip="타이머 다시 시작"
              ariaLabel="타이머 초기화"
              icon="material-symbols:refresh-rounded"
              onClick={onReset}
            />
            <ControlIconButton
              tooltip="현재 세션 종료"
              ariaLabel="세션 종료"
              icon="material-symbols:cancel-rounded"
              onClick={() => setConfirmAction('end')}
            />
          </div>
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
          onSave={onSaveSettings}
          onClose={closeDrawer}
        />
      </BottomSheet>

      <BottomSheet
        open={confirmAction !== null}
        onClose={closeConfirm}
        title={confirmTitle}
      >
        <div className="flex flex-col gap-4">
          <p className="text-14 text-grey-700">{confirmDescription}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="w-full rounded-[8px] bg-primary-500 px-4 py-2 text-14 font-medium text-fixed-white"
              onClick={handleConfirmAction}
            >
              확인
            </button>
            <button
              type="button"
              className="w-full rounded-[8px] border border-dark bg-dark px-4 py-2 text-14 font-medium text-dark"
              onClick={closeConfirm}
            >
              취소
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

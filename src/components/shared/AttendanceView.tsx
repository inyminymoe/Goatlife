'use client';

import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { Icon } from '@iconify/react';
import type {
  AttendanceViewState,
  AttendanceLifecycle,
  ToastState,
} from '@/hooks/useAttendance';
import { useMemo } from 'react';

export type AttendanceViewMode = 'compact' | 'full';

interface AttendanceViewProps {
  attendance: AttendanceViewState;
  attendanceRate: number;
  todayMinutes: number;
  lifecycle: AttendanceLifecycle;
  isMutating: boolean;
  toast: ToastState;
  onDismissToast: () => void;
  actions: {
    clockIn: () => void;
    earlyLeave: () => void;
    clockOut: () => void;
  };
  mode?: AttendanceViewMode;
}

function formatHourClock(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function Skeleton() {
  return (
    <section
      className="bg-grey-100 rounded-[5px] p-6"
      aria-labelledby="attendance-title"
    >
      <div className="flex items-end gap-1 mb-4">
        <div className="w-6 h-6 bg-grey-300 rounded animate-pulse" />
        <div className="h-6 w-24 bg-grey-300 rounded animate-pulse" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="h-20 bg-grey-200 rounded animate-pulse" />
        <div className="h-20 bg-grey-200 rounded animate-pulse" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="h-10 bg-grey-300 rounded animate-pulse" />
        <div className="h-10 bg-grey-300 rounded animate-pulse" />
      </div>
    </section>
  );
}

export default function AttendanceView({
  attendance,
  attendanceRate,
  todayMinutes,
  lifecycle,
  isMutating,
  toast,
  onDismissToast,
  actions,
  mode = 'compact',
}: AttendanceViewProps) {
  const formattedToday = useMemo(
    () => formatHourClock(todayMinutes),
    [todayMinutes]
  );

  const todaySecondaryLabel = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return '동안 근무 중';
      case 'early':
        return '동안 근무';
      case 'out':
        return '동안 근무';
      default:
        return '동안 근무 중';
    }
  }, [attendance.status]);

  const primaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return {
          label: '조퇴하기',
          variant: 'secondary' as const,
          onClick: actions.earlyLeave,
          disabled: isMutating,
        };
      case 'early':
        return {
          label: '조퇴하기',
          variant: 'secondary' as const,
          onClick: actions.earlyLeave,
          disabled: true,
        };
      case 'out':
        return {
          label: '출근하기',
          variant: 'primary' as const,
          onClick: actions.clockIn,
          disabled: true,
        };
      default:
        return {
          label: '출근하기',
          variant: 'primary' as const,
          onClick: actions.clockIn,
          disabled: isMutating,
        };
    }
  }, [actions.clockIn, actions.earlyLeave, attendance.status, isMutating]);

  const secondaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'none':
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: actions.clockOut,
          disabled: true,
        };
      case 'out':
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: actions.clockOut,
          disabled: true,
        };
      default:
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: actions.clockOut,
          disabled: isMutating,
        };
    }
  }, [actions.clockOut, attendance.status, isMutating]);

  if (lifecycle === 'loading') {
    return <Skeleton />;
  }

  if (lifecycle === 'error') {
    return (
      <section className="bg-grey-100 rounded-[5px] p-6 text-center text-grey-400">
        데이터를 불러오지 못했습니다. 다시 시도해주세요.
      </section>
    );
  }

  return (
    <>
      <section
        className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5"
        aria-labelledby="attendance-title"
        data-mode={mode}
      >
        <div className="flex items-end gap-1">
          <Icon
            icon="icon-park:briefcase"
            className="w-6 h-6 text-grey-900"
            aria-hidden="true"
          />
          <h2 id="attendance-title" className="brand-h3 text-grey-900">
            근태관리
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-x-0 gap-y-4 items-start">
          <div className="flex flex-col gap-1 items-start text-left min-w-0">
            <div className="inline-flex items-center gap-2.5">
              <span className="text-grey-300 body-sm font-semibold">Today</span>
            </div>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {formattedToday}
              </span>
              <span className="body-xs text-grey-500">
                {todaySecondaryLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 items-start text-left min-w-0">
            <div className="inline-flex items-center gap-2.5">
              <span className="text-grey-300 body-sm font-semibold">Total</span>
            </div>
            <div className="inline-flex items-baseline gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {Number(attendanceRate.toFixed(0))}
              </span>
              <span className="body-xs text-grey-500">% 출근율</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={primaryButton.variant}
            fullWidth
            disabled={primaryButton.disabled}
            onClick={primaryButton.onClick}
          >
            {primaryButton.label}
          </Button>
          <Button
            variant={secondaryButton.variant}
            fullWidth
            disabled={secondaryButton.disabled}
            onClick={secondaryButton.onClick}
          >
            {secondaryButton.label}
          </Button>
        </div>
      </section>

      <Toast
        show={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={onDismissToast}
      />
    </>
  );
}

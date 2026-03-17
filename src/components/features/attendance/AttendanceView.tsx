'use client';

import { ATTENDANCE_POLICY } from '@/lib/attendance';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import Toast from '@/components/ui/Toast';
import { Icon } from '@iconify/react';
import type {
  AttendanceLifecycle,
  AttendanceViewState,
  ToastState,
} from '@/hooks/useAttendance';
import { useCallback, useMemo, useState } from 'react';

export type AttendanceViewMode = 'compact' | 'full';
const DAILY_TARGET_SECONDS = ATTENDANCE_POLICY.dailyTargetMinutes * 60;

interface AttendanceViewProps {
  attendance: AttendanceViewState;
  attendanceRate: number;
  todaySeconds: number;
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

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

function Skeleton() {
  return (
    <section
      className="flex h-full flex-col rounded-[5px] bg-grey-100 p-6"
      aria-labelledby="attendance-title"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-grey-300 animate-pulse" />
          <div className="h-6 w-24 rounded bg-grey-300 animate-pulse" />
          <div className="h-6 w-16 rounded-full bg-grey-300 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="h-20 rounded bg-grey-200 animate-pulse" />
          <div className="h-20 rounded bg-grey-200 animate-pulse" />
        </div>
      </div>
      <div className="mt-auto grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
        <div className="h-11 rounded bg-grey-300 animate-pulse" />
        <div className="h-11 rounded bg-grey-300 animate-pulse" />
      </div>
    </section>
  );
}

export default function AttendanceView({
  attendance,
  attendanceRate,
  todaySeconds,
  lifecycle,
  isMutating,
  toast,
  onDismissToast,
  actions,
  mode = 'compact',
}: AttendanceViewProps) {
  const [isClockOutSheetOpen, setIsClockOutSheetOpen] = useState(false);

  const operationStatus = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return {
          label: '근무 중',
          badgeClassName: 'attendance-status-badge-live',
        };
      case 'out':
      case 'early':
        return {
          label: '퇴근',
          badgeClassName: 'attendance-status-badge-complete',
        };
      default:
        return {
          label: '근무 전',
          badgeClassName: 'attendance-status-badge-idle',
        };
    }
  }, [attendance.status]);

  const formattedToday = useMemo(
    () => formatDuration(todaySeconds),
    [todaySeconds]
  );
  const isUnderDailyTarget =
    todaySeconds > 0 && todaySeconds < DAILY_TARGET_SECONDS;
  const targetDurationLabel = useMemo(
    () => formatDuration(DAILY_TARGET_SECONDS),
    []
  );

  const todaySecondaryLabel = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return '동안 근무중';
      case 'out':
      case 'early':
        return '동안 근무함';
      default:
        return '근무 전';
    }
  }, [attendance.status]);

  const primaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'out':
      case 'early':
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
          disabled: attendance.status === 'in' || isMutating,
        };
    }
  }, [actions.clockIn, attendance.status, isMutating]);

  const secondaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'none':
      case 'out':
      case 'early':
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

  const openClockOutSheet = useCallback(() => {
    if (secondaryButton.disabled) return;
    setIsClockOutSheetOpen(true);
  }, [secondaryButton.disabled]);

  const closeClockOutSheet = useCallback(() => {
    setIsClockOutSheetOpen(false);
  }, []);

  const handleConfirmClockOut = useCallback(() => {
    setIsClockOutSheetOpen(false);
    actions.clockOut();
  }, [actions]);

  if (lifecycle === 'loading') {
    return <Skeleton />;
  }

  if (lifecycle === 'error') {
    return (
      <section className="flex h-full items-center justify-center rounded-[5px] bg-grey-100 p-6 text-center text-grey-400">
        데이터를 불러오지 못했습니다. 다시 시도해주세요.
      </section>
    );
  }

  return (
    <>
      <section
        className="flex h-full flex-col rounded-[5px] bg-grey-100 p-6"
        aria-labelledby="attendance-title"
        data-mode={mode}
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <Icon
              icon="icon-park:briefcase"
              className="h-6 w-6 icon-dark-invert"
              aria-hidden="true"
            />
            <h2 id="attendance-title" className="brand-h3 text-grey-900">
              근태관리
            </h2>
            <Badge
              variant="calendar"
              size="xs"
              dot
              className={`relative h-auto rounded-2xl !bg-transparent px-3 py-1.5 text-[10px] leading-none ${operationStatus.badgeClassName}`}
              style={{ backgroundColor: 'transparent' }}
              aria-label={`현재 상태 ${operationStatus.label}`}
            >
              {operationStatus.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-5 items-start">
            <div className="flex min-w-0 flex-col gap-1 text-left">
              <div className="inline-flex items-center gap-2.5">
                <span className="body-sm font-semibold text-grey-300">
                  Today
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-x-1 gap-y-0.5">
                <span className="brand-h1 tabular-nums text-primary-500">
                  {formattedToday}
                </span>
                <span className="body-xs text-grey-500">
                  {todaySecondaryLabel}
                </span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 text-left">
              <div className="inline-flex items-center gap-2.5">
                <span className="body-sm font-semibold text-grey-300">
                  이번 달
                </span>
              </div>
              <div className="flex flex-wrap items-end gap-x-1 gap-y-0.5">
                <span className="brand-h1 tabular-nums text-primary-500">
                  {Number(attendanceRate.toFixed(0))}
                </span>
                <span className="body-xs text-grey-500">% 출근율</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto grid w-full grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
          <Button
            variant={primaryButton.variant}
            fullWidth
            disabled={primaryButton.disabled}
            onClick={primaryButton.onClick}
            className="px-4 py-3 font-semibold"
          >
            {primaryButton.label}
          </Button>
          <Button
            variant={secondaryButton.variant}
            fullWidth
            disabled={secondaryButton.disabled}
            onClick={openClockOutSheet}
            className="px-4 py-3 font-semibold"
          >
            {secondaryButton.label}
          </Button>
        </div>
      </section>

      <BottomSheet
        open={isClockOutSheetOpen}
        onClose={closeClockOutSheet}
        title="퇴근 처리할까요?"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-[10px] bg-grey-100 p-4">
            <p className="body-xs font-medium text-grey-500">현재 누적 시간</p>
            <p className="mt-1 brand-h2 text-primary-500">{formattedToday}</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="body-sm text-grey-700">
              {isUnderDailyTarget
                ? `아직 목표 근무 시간 ${targetDurationLabel}을 채우지 않았어요. 지금 퇴근하면 오늘 근무가 이 시점 기준으로 종료됩니다.`
                : '지금 퇴근하면 오늘 근무가 종료됩니다.'}
            </p>
            <p className="body-xs text-grey-500">
              실수로 눌렀다면 계속 근무하기를 눌러 돌아갈 수 있어요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              fullWidth
              onClick={closeClockOutSheet}
              className="px-4 py-3 font-semibold"
            >
              계속 근무하기
            </Button>
            <Button
              fullWidth
              onClick={handleConfirmClockOut}
              disabled={isMutating}
              className="px-4 py-3 font-semibold"
            >
              퇴근 처리하기
            </Button>
          </div>
        </div>
      </BottomSheet>

      <Toast
        show={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={onDismissToast}
      />
    </>
  );
}

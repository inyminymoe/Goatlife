'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import {
  AttendanceLog,
  AttendanceStatus,
  clockIn,
  clockOut,
  earlyLeave,
  getAttendanceRate,
  getTodayStatus,
} from '@/app/_actions/attendance';

type AttendanceState = {
  status: AttendanceStatus;
  clockInAt: string | null;
  earlyLeaveAt: string | null;
  clockOutAt: string | null;
  workMinutes: number;
};

type ToastState = {
  message: string;
  type: 'success' | 'error';
} | null;

const initialAttendanceState: AttendanceState = {
  status: 'none',
  clockInAt: null,
  earlyLeaveAt: null,
  clockOutAt: null,
  workMinutes: 0,
};

const MS_IN_MINUTE = 60_000;

function deriveAttendanceState(log: AttendanceLog | null): AttendanceState {
  if (!log) return initialAttendanceState;

  return {
    status: (log.status as AttendanceStatus) ?? 'none',
    clockInAt: log.clock_in_at,
    earlyLeaveAt: log.early_leave_at,
    clockOutAt: log.clock_out_at,
    workMinutes: log.work_minutes ?? 0,
  };
}

function diffMinutes(from?: string | null, to?: string | null) {
  if (!from || !to) return 0;
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / MS_IN_MINUTE);
}

function formatHourClock(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
}

export default function AttendanceCard() {
  const [attendance, setAttendance] = useState<AttendanceState>(
    initialAttendanceState
  );
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [liveMinutes, setLiveMinutes] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
    },
    []
  );

  const refreshAttendanceRate = useCallback(async () => {
    const rateRes = await getAttendanceRate();
    if (rateRes.ok) {
      setAttendanceRate(rateRes.rate);
    } else if (rateRes.error !== 'UNAUTHENTICATED') {
      showToast('출근율 정보를 갱신하지 못했어요.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setIsLoading(true);

        // 타임아웃 래퍼 함수 (3초 제한)
        const withTimeout = <T,>(
          promise: Promise<T>,
          timeoutMs = 3000
        ): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
            ),
          ]);
        };

        const [statusRes, rateRes] = await Promise.all([
          withTimeout(getTodayStatus()).catch(() => ({
            ok: false as const,
            error: 'TIMEOUT',
          })),
          withTimeout(getAttendanceRate()).catch(() => ({
            ok: false as const,
            error: 'TIMEOUT',
          })),
        ]);

        if (!mounted) return;

        if (statusRes.ok) {
          setAttendance(deriveAttendanceState(statusRes.data ?? null));
        } else if (
          statusRes.error !== 'UNAUTHENTICATED' &&
          statusRes.error !== 'TIMEOUT'
        ) {
          showToast('근태 정보를 불러오지 못했어요.', 'error');
        }

        if (rateRes.ok) {
          setAttendanceRate(rateRes.rate);
        } else if (
          rateRes.error !== 'UNAUTHENTICATED' &&
          rateRes.error !== 'TIMEOUT'
        ) {
          showToast('출근율 정보를 불러오지 못했어요.', 'error');
        }
      } catch {
        if (mounted) {
          showToast('근태 데이터를 불러오는 중 문제가 발생했어요.', 'error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (attendance.status !== 'in' || !attendance.clockInAt) {
      setLiveMinutes(0);
      return;
    }

    const updateMinutes = () => {
      const diff = diffMinutes(attendance.clockInAt, new Date().toISOString());
      setLiveMinutes(diff);
    };

    updateMinutes();

    const timer = setInterval(updateMinutes, MS_IN_MINUTE);
    return () => clearInterval(timer);
  }, [attendance.status, attendance.clockInAt]);

  const todayMinutes = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return liveMinutes;
      case 'early':
        return (
          diffMinutes(attendance.clockInAt, attendance.earlyLeaveAt) ||
          attendance.workMinutes
        );
      case 'out':
        return attendance.workMinutes;
      default:
        return 0;
    }
  }, [attendance, liveMinutes]);

  const todayPrimaryValue = useMemo(() => {
    if (isLoading) return '0:00';
    return formatHourClock(todayMinutes);
  }, [isLoading, todayMinutes]);

  const todaySecondaryLabel = useMemo(() => {
    if (isLoading) return '만큼 근무 중';
    switch (attendance.status) {
      case 'in':
        return '만큼 근무 중';
      case 'early':
        return '만큼 근무';
      case 'out':
        return '만큼 근무';
      default:
        return '만큼 근무 중';
    }
  }, [attendance.status, isLoading]);

  const handleClockIn = useCallback(() => {
    if (isPending) return;

    const optimisticState: AttendanceState = {
      status: 'in',
      clockInAt: new Date().toISOString(),
      earlyLeaveAt: null,
      clockOutAt: null,
      workMinutes: 0,
    };

    const previous = attendance;
    setAttendance(optimisticState);

    startTransition(async () => {
      const result = await clockIn();
      if (!result.ok) {
        setAttendance(previous);
        showToast(
          result.error === 'UNAUTHENTICATED'
            ? '로그인이 필요해요.'
            : '출근 처리에 실패했어요.',
          'error'
        );
        return;
      }

      const log = result.data;
      if (!log) {
        setAttendance(previous);
        showToast('출근 정보가 확인되지 않아요.', 'error');
        return;
      }

      setAttendance(deriveAttendanceState(log));
      await refreshAttendanceRate();
      showToast('출근 완료! 활기찬 하루 되세요.', 'success');
    });
  }, [
    attendance,
    isPending,
    refreshAttendanceRate,
    showToast,
    startTransition,
  ]);

  const handleEarlyLeave = useCallback(() => {
    if (isPending || attendance.status !== 'in') return;

    const optimisticState: AttendanceState = {
      ...attendance,
      status: 'early',
      earlyLeaveAt: new Date().toISOString(),
    };
    const previous = attendance;
    setAttendance(optimisticState);

    startTransition(async () => {
      const result = await earlyLeave();
      if (!result.ok) {
        setAttendance(previous);
        const message =
          result.error === 'UNAUTHENTICATED'
            ? '로그인이 필요해요.'
            : result.error.includes('No clock-in record')
              ? '오늘 출근 기록이 없습니다.'
              : '조퇴 처리에 실패했어요.';
        showToast(message, 'error');
        return;
      }

      const log = result.data;
      if (!log) {
        setAttendance(previous);
        showToast('조퇴 정보가 확인되지 않아요.', 'error');
        return;
      }

      setAttendance(deriveAttendanceState(log));
      showToast('조퇴가 기록되었어요.', 'success');
    });
  }, [attendance, isPending, showToast, startTransition]);

  const handleClockOut = useCallback(() => {
    if (isPending || attendance.status === 'none') return;

    const optimisticState: AttendanceState = {
      ...attendance,
      status: 'out',
      clockOutAt: new Date().toISOString(),
      workMinutes:
        attendance.status === 'early'
          ? diffMinutes(attendance.clockInAt, attendance.earlyLeaveAt)
          : diffMinutes(attendance.clockInAt, new Date().toISOString()),
    };

    const previous = attendance;
    setAttendance(optimisticState);

    startTransition(async () => {
      const result = await clockOut();
      if (!result.ok) {
        setAttendance(previous);
        const message =
          result.error === 'UNAUTHENTICATED'
            ? '로그인이 필요해요.'
            : result.error.includes('No clock-in record')
              ? '오늘 출근 기록이 없습니다.'
              : '퇴근 처리에 실패했어요.';
        showToast(message, 'error');
        return;
      }

      const log = result.data;
      if (!log) {
        setAttendance(previous);
        showToast('퇴근 정보가 확인되지 않아요.', 'error');
        return;
      }

      setAttendance(deriveAttendanceState(log));
      await refreshAttendanceRate();
      showToast('퇴근 완료! 수고하셨습니다.', 'success');
    });
  }, [
    attendance,
    isPending,
    refreshAttendanceRate,
    showToast,
    startTransition,
  ]);

  const primaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'in':
      case 'early':
        return {
          label: '조퇴하기',
          variant: 'secondary' as const,
          onClick: handleEarlyLeave,
          disabled: attendance.status === 'early' || isPending,
        };
      case 'out':
        return {
          label: '출근하기',
          variant: 'primary' as const,
          onClick: handleClockIn,
          disabled: true,
        };
      default:
        return {
          label: '출근하기',
          variant: 'primary' as const,
          onClick: handleClockIn,
          disabled: isPending,
        };
    }
  }, [attendance.status, handleClockIn, handleEarlyLeave, isPending]);

  const secondaryButton = useMemo(() => {
    switch (attendance.status) {
      case 'none':
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: handleClockOut,
          disabled: true,
        };
      case 'out':
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: handleClockOut,
          disabled: true,
        };
      default:
        return {
          label: '퇴근하기',
          variant: 'text' as const,
          onClick: handleClockOut,
          disabled: isPending,
        };
    }
  }, [attendance.status, handleClockOut, isPending]);

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6">
        {/* Header: Icon + Title (DNF Bit style applied via brand classes) */}
        <div className="flex items-end gap-1">
          <Icon icon="icon-park:briefcase" className="w-6 h-6 text-grey-900" />
          <h2 className="brand-h3 text-grey-900">근태관리</h2>
        </div>

        {/* Today / Total row (Figma compact style) */}
        <div className="mt-4 grid grid-cols-2 gap-x-0 gap-y-4 items-start">
          {/* Today */}
          <div className="flex flex-col gap-1 items-start text-left min-w-0">
            <div className="inline-flex items-center gap-2.5">
              <span className="text-grey-300 body-sm font-semibold">Today</span>
            </div>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {todayPrimaryValue}
              </span>
              <span className="body-xs text-grey-500">
                {todaySecondaryLabel}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex flex-col gap-1 items-start text-left min-w-0">
            <div className="inline-flex items-center gap-2.5">
              <span className="text-grey-300 body-sm font-semibold">Total</span>
            </div>
            <div className="inline-flex items-baseline gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {isLoading ? 0 : Number(attendanceRate.toFixed(0))}
              </span>
              <span className="body-xs text-grey-500">% 출근율</span>
            </div>
          </div>
        </div>

        {/* Buttons - dynamic layout based on attendance status */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button
            variant={primaryButton.variant}
            fullWidth
            onClick={primaryButton.onClick}
            disabled={primaryButton.disabled}
          >
            {primaryButton.label}
          </Button>
          <Button
            variant={secondaryButton.variant}
            fullWidth
            onClick={secondaryButton.onClick}
            disabled={secondaryButton.disabled}
          >
            {secondaryButton.label}
          </Button>
        </div>
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

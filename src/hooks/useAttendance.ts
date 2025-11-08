'use client';

import {
  fetchAttendanceRate,
  fetchTodayAttendance,
  requestClockIn,
  requestClockOut,
  requestEarlyLeave,
  type AttendanceLog,
  type AttendanceStatus,
} from '@/services/attendance';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';

export type AttendanceMode = 'compact' | 'full';
export type AttendanceLifecycle = 'idle' | 'loading' | 'ready' | 'error';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

export type AttendanceViewState = {
  status: AttendanceStatus;
  clockInAt: string | null;
  earlyLeaveAt: string | null;
  clockOutAt: string | null;
  workMinutes: number;
};

export interface UseAttendanceOptions {
  autoLoad?: boolean;
  mode?: AttendanceMode;
}

export interface UseAttendanceResult {
  lifecycle: AttendanceLifecycle;
  attendance: AttendanceViewState;
  attendanceRate: number;
  todayMinutes: number;
  isLoading: boolean;
  isMutating: boolean;
  toast: ToastState;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  actions: {
    clockIn: () => void;
    earlyLeave: () => void;
    clockOut: () => void;
  };
  mode: AttendanceMode;
  error: string | null;
}

const MS_IN_MINUTE = 60_000;

const initialAttendanceState: AttendanceViewState = {
  status: 'none',
  clockInAt: null,
  earlyLeaveAt: null,
  clockOutAt: null,
  workMinutes: 0,
};

function deriveAttendanceState(log: AttendanceLog | null): AttendanceViewState {
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

export function useAttendance(
  options: UseAttendanceOptions = {}
): UseAttendanceResult {
  const { autoLoad = true, mode = 'compact' } = options;

  const [lifecycle, setLifecycle] = useState<AttendanceLifecycle>('idle');
  const [attendance, setAttendance] = useState<AttendanceViewState>(
    initialAttendanceState
  );
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [liveMinutes, setLiveMinutes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const refreshRate = useCallback(async () => {
    const result = await fetchAttendanceRate();
    if (result.ok) {
      setAttendanceRate(result.rate ?? 0);
    } else if (result.error !== 'UNAUTHENTICATED') {
      showToast('출근율 정보를 갱신하지 못했어요.', 'error');
    }
  }, [showToast]);

  const loadInitial = useCallback(async () => {
    setLifecycle('loading');
    setError(null);
    try {
      const [statusRes, rateRes] = await Promise.all([
        fetchTodayAttendance(),
        fetchAttendanceRate(),
      ]);

      if (statusRes.ok) {
        setAttendance(deriveAttendanceState(statusRes.data));
      } else if (statusRes.error === 'UNAUTHENTICATED') {
        setError('UNAUTHENTICATED');
      } else {
        showToast('근태 정보를 불러오지 못했어요.', 'error');
        setError(statusRes.error);
      }

      if (rateRes.ok) {
        setAttendanceRate(rateRes.rate ?? 0);
      } else if (rateRes.error !== 'UNAUTHENTICATED') {
        showToast('출근율 정보를 불러오지 못했어요.', 'error');
      }

      setLifecycle('ready');
    } catch (err) {
      console.error('[useAttendance] initial load failed', err);
      setLifecycle('error');
      setError('UNKNOWN');
      showToast('근태 데이터를 불러오는 중 문제가 발생했어요.', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    if (!autoLoad) return;
    void loadInitial();
  }, [autoLoad, loadInitial]);

  useEffect(() => {
    if (attendance.status !== 'in' || !attendance.clockInAt) {
      setLiveMinutes(0);
      return;
    }

    const updateMinutes = () => {
      const diff = diffMinutes(
        attendance.clockInAt ?? undefined,
        new Date().toISOString()
      );
      setLiveMinutes(diff);
    };

    updateMinutes();
    const timer = setInterval(updateMinutes, 10_000);
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

  const handleClockIn = useCallback(() => {
    if (isPending) return;

    const previous = attendance;
    const nextState: AttendanceViewState = {
      status: 'in',
      clockInAt: new Date().toISOString(),
      earlyLeaveAt: null,
      clockOutAt: null,
      workMinutes: 0,
    };

    setAttendance(nextState);

    startTransition(() => {
      void (async () => {
        const result = await requestClockIn();
        if (!result.ok) {
          setAttendance(previous);
          const message =
            result.error === 'UNAUTHENTICATED'
              ? '로그인이 필요해요.'
              : '출근 처리에 실패했어요.';
          showToast(message, 'error');
          return;
        }

        if (!result.data) {
          setAttendance(previous);
          showToast('출근 정보가 확인되지 않아요.', 'error');
          return;
        }

        setAttendance(deriveAttendanceState(result.data));
        await refreshRate();
        showToast('출근 완료! 활기찬 갓생 보내세요.', 'success');
      })();
    });
  }, [attendance, isPending, refreshRate, showToast]);

  const handleEarlyLeave = useCallback(() => {
    if (isPending || attendance.status !== 'in') return;

    const previous = attendance;
    const nextState: AttendanceViewState = {
      ...attendance,
      status: 'early',
      earlyLeaveAt: new Date().toISOString(),
    };
    setAttendance(nextState);

    startTransition(() => {
      void (async () => {
        const result = await requestEarlyLeave();
        if (!result.ok) {
          setAttendance(previous);
          const errorMessage =
            result.error === 'UNAUTHENTICATED'
              ? '로그인이 필요해요.'
              : result.error.includes('No clock-in record')
                ? '오늘 출근 기록이 없습니다.'
                : '조퇴 처리에 실패했어요.';
          showToast(errorMessage, 'error');
          return;
        }

        if (!result.data) {
          setAttendance(previous);
          showToast('조퇴 정보가 확인되지 않아요.', 'error');
          return;
        }

        setAttendance(deriveAttendanceState(result.data));
        showToast('조퇴가 기록되었어요.', 'success');
      })();
    });
  }, [attendance, isPending, showToast]);

  const handleClockOut = useCallback(() => {
    if (isPending || attendance.status === 'none') return;

    const nowIso = new Date().toISOString();
    const previous = attendance;
    const optimistic: AttendanceViewState = {
      ...attendance,
      status: 'out',
      clockOutAt: nowIso,
      workMinutes:
        attendance.status === 'early'
          ? diffMinutes(attendance.clockInAt, attendance.earlyLeaveAt)
          : diffMinutes(attendance.clockInAt, nowIso),
    };

    setAttendance(optimistic);

    startTransition(() => {
      void (async () => {
        const result = await requestClockOut();
        if (!result.ok) {
          setAttendance(previous);
          const errorMessage =
            result.error === 'UNAUTHENTICATED'
              ? '로그인이 필요해요.'
              : result.error.includes('No clock-in record')
                ? '오늘 출근 기록이 없습니다.'
                : '퇴근 처리에 실패했어요.';
          showToast(errorMessage, 'error');
          return;
        }

        if (!result.data) {
          setAttendance(previous);
          showToast('퇴근 정보가 확인되지 않아요.', 'error');
          return;
        }

        setAttendance(deriveAttendanceState(result.data));
        await refreshRate();
        showToast('퇴근 완료! 수고하셨습니다.', 'success');
      })();
    });
  }, [attendance, isPending, refreshRate, showToast]);

  return {
    lifecycle,
    attendance,
    attendanceRate,
    todayMinutes,
    isLoading: lifecycle === 'loading',
    isMutating: isPending,
    toast,
    dismissToast,
    refresh: loadInitial,
    actions: {
      clockIn: handleClockIn,
      earlyLeave: handleEarlyLeave,
      clockOut: handleClockOut,
    },
    mode,
    error,
  };
}

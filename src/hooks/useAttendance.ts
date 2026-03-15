'use client';

import {
  ATTENDANCE_ERROR_MESSAGES,
  calculateWorkMinutes,
} from '@/lib/attendance';
import { useAttendanceActions } from '@/hooks/useAttendanceActions';
import { useAttendanceSummary } from '@/hooks/useAttendanceSummary';
import { useAttendanceToday } from '@/hooks/useAttendanceToday';
import type { AttendanceRecord } from '@/types/attendance';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AttendanceMode = 'compact' | 'full';
export type AttendanceLifecycle = 'idle' | 'loading' | 'ready' | 'error';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

export type AttendanceViewState = {
  status: 'none' | 'in' | 'early' | 'out';
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

const initialAttendanceState: AttendanceViewState = {
  status: 'none',
  clockInAt: null,
  earlyLeaveAt: null,
  clockOutAt: null,
  workMinutes: 0,
};

function resolveAttendanceErrorMessage(error: string | null | undefined) {
  if (!error) {
    return ATTENDANCE_ERROR_MESSAGES.UNKNOWN;
  }

  return (
    ATTENDANCE_ERROR_MESSAGES[
      error as keyof typeof ATTENDANCE_ERROR_MESSAGES
    ] ?? ATTENDANCE_ERROR_MESSAGES.UNKNOWN
  );
}

function deriveAttendanceState(
  record: AttendanceRecord | null
): AttendanceViewState {
  if (!record) {
    return initialAttendanceState;
  }

  if (record.status === 'vacation' || record.status === 'absent') {
    return initialAttendanceState;
  }

  if (record.status === 'early_leave') {
    return {
      status: 'early',
      clockInAt: record.checkInAt,
      earlyLeaveAt: record.earlyLeaveAt,
      clockOutAt: record.checkOutAt,
      workMinutes:
        record.workMinutes ||
        calculateWorkMinutes(record.checkInAt, record.earlyLeaveAt),
    };
  }

  if (record.checkOutAt) {
    return {
      status: 'out',
      clockInAt: record.checkInAt,
      earlyLeaveAt: record.earlyLeaveAt,
      clockOutAt: record.checkOutAt,
      workMinutes:
        record.workMinutes ||
        calculateWorkMinutes(record.checkInAt, record.checkOutAt),
    };
  }

  if (record.checkInAt) {
    return {
      status: 'in',
      clockInAt: record.checkInAt,
      earlyLeaveAt: record.earlyLeaveAt,
      clockOutAt: record.checkOutAt,
      workMinutes: record.workMinutes,
    };
  }

  return initialAttendanceState;
}

export function useAttendance(
  options: UseAttendanceOptions = {}
): UseAttendanceResult {
  const { mode = 'compact' } = options;
  const [toast, setToast] = useState<ToastState>(null);
  const [liveMinutes, setLiveMinutes] = useState(0);

  const todayQuery = useAttendanceToday();
  const summaryQuery = useAttendanceSummary({ period: 'month' });
  const attendanceActions = useAttendanceActions();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const attendance = useMemo(
    () => deriveAttendanceState(todayQuery.record),
    [todayQuery.record]
  );

  useEffect(() => {
    if (attendance.status !== 'in' || !attendance.clockInAt) {
      setLiveMinutes(0);
      return;
    }

    const updateMinutes = () => {
      setLiveMinutes(
        calculateWorkMinutes(attendance.clockInAt, new Date().toISOString())
      );
    };

    updateMinutes();
    const timer = setInterval(updateMinutes, 10_000);

    return () => clearInterval(timer);
  }, [attendance.clockInAt, attendance.status]);

  const lifecycle = useMemo<AttendanceLifecycle>(() => {
    if (todayQuery.isLoading || summaryQuery.isLoading) {
      return 'loading';
    }

    if (
      (todayQuery.error && todayQuery.error !== 'UNAUTHENTICATED') ||
      (summaryQuery.error && summaryQuery.error !== 'UNAUTHENTICATED')
    ) {
      return 'error';
    }

    return 'ready';
  }, [
    summaryQuery.error,
    summaryQuery.isLoading,
    todayQuery.error,
    todayQuery.isLoading,
  ]);

  const todayMinutes = useMemo(() => {
    switch (attendance.status) {
      case 'in':
        return liveMinutes;
      case 'early':
        return (
          attendance.workMinutes ||
          calculateWorkMinutes(attendance.clockInAt, attendance.earlyLeaveAt)
        );
      case 'out':
        return (
          attendance.workMinutes ||
          calculateWorkMinutes(attendance.clockInAt, attendance.clockOutAt)
        );
      default:
        return 0;
    }
  }, [attendance, liveMinutes]);

  const attendanceRate = summaryQuery.summary?.attendanceRate ?? 0;
  // UNAUTHENTICATED는 auth guard가 리다이렉트 처리하므로 소비자에게 노출하지 않음
  const error =
    (todayQuery.error !== 'UNAUTHENTICATED' ? todayQuery.error : null) ??
    (summaryQuery.error !== 'UNAUTHENTICATED' ? summaryQuery.error : null) ??
    null;

  const refresh = useCallback(async () => {
    await Promise.all([todayQuery.refetch(), summaryQuery.refetch()]);
  }, [summaryQuery, todayQuery]);

  const handleClockIn = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.checkIn.mutateAsync();

    if (!result.ok) {
      showToast(resolveAttendanceErrorMessage(result.error), 'error');
      return;
    }

    showToast('출근 완료! 활기찬 갓생 보내세요.', 'success');
  }, [attendanceActions, showToast]);

  const handleEarlyLeave = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.earlyLeave.mutateAsync();

    if (!result.ok) {
      showToast(resolveAttendanceErrorMessage(result.error), 'error');
      return;
    }

    showToast('조퇴가 기록되었어요.', 'success');
  }, [attendanceActions, showToast]);

  const handleClockOut = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.checkOut.mutateAsync();

    if (!result.ok) {
      showToast(resolveAttendanceErrorMessage(result.error), 'error');
      return;
    }

    showToast('퇴근 완료! 수고하셨습니다.', 'success');
  }, [attendanceActions, showToast]);

  return {
    lifecycle,
    attendance,
    attendanceRate,
    todayMinutes,
    isLoading: lifecycle === 'loading',
    isMutating: attendanceActions.isMutating,
    toast,
    dismissToast,
    refresh,
    actions: {
      clockIn: () => void handleClockIn(),
      earlyLeave: () => void handleEarlyLeave(),
      clockOut: () => void handleClockOut(),
    },
    mode,
    error,
  };
}

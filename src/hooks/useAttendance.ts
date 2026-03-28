'use client';

import {
  ATTENDANCE_ERROR_MESSAGES,
  calculateWorkMinutes,
  calculateWorkSeconds,
  getKstDateString,
} from '@/lib/attendance';
import { useAttendanceActions } from '@/hooks/useAttendanceActions';
import { useAttendanceSummary } from '@/hooks/useAttendanceSummary';
import { useAttendanceToday } from '@/hooks/useAttendanceToday';
import type { AttendanceRecord } from '@/types/attendance';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AttendanceMode = 'compact' | 'full';
export type AttendanceLifecycle = 'idle' | 'loading' | 'ready' | 'error';
export type AttendanceOperationStatus =
  | 'before_work'
  | 'working'
  | 'completed'
  | 'stale_session';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

export type AttendanceViewState = {
  date: string | null;
  operationStatus: AttendanceOperationStatus;
  resultStatus: AttendanceRecord['status'] | null;
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
  operationStatus: AttendanceOperationStatus;
  canClockIn: boolean;
  canClockOut: boolean;
  canUndoClockOut: boolean;
  todaySeconds: number;
  isLoading: boolean;
  isMutating: boolean;
  toast: ToastState;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  actions: {
    clockIn: () => void;
    clockOut: () => void;
    undoClockOut: () => void;
    closeStaleSession: (clockOutAt: string) => void;
    autoCloseStaleSession: () => void;
  };
  mode: AttendanceMode;
  error: string | null;
}

const initialAttendanceState: AttendanceViewState = {
  date: null,
  operationStatus: 'before_work',
  resultStatus: null,
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

  // 어제 출근 기록이 미처리된 stale 세션
  const todayDate = getKstDateString();
  if (
    record.date < todayDate &&
    record.checkInAt !== null &&
    record.checkOutAt === null
  ) {
    return {
      date: record.date,
      operationStatus: 'stale_session',
      resultStatus: record.status,
      clockInAt: record.checkInAt,
      earlyLeaveAt: null,
      clockOutAt: null,
      workMinutes: 0,
    };
  }

  const completedAt = record.checkOutAt ?? record.earlyLeaveAt;

  return {
    date: record.date,
    operationStatus: completedAt
      ? 'completed'
      : record.checkInAt
        ? 'working'
        : 'before_work',
    resultStatus: record.status,
    clockInAt: record.checkInAt,
    earlyLeaveAt: record.earlyLeaveAt,
    clockOutAt: record.checkOutAt,
    workMinutes:
      record.workMinutes || calculateWorkMinutes(record.checkInAt, completedAt),
  };
}

export function useAttendance(
  options: UseAttendanceOptions = {}
): UseAttendanceResult {
  const { mode = 'compact' } = options;
  const [toast, setToast] = useState<ToastState>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);

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
    if (attendance.operationStatus !== 'working' || !attendance.clockInAt) {
      setLiveSeconds(0);
      return;
    }

    const updateSeconds = () => {
      setLiveSeconds(
        calculateWorkSeconds(attendance.clockInAt, new Date().toISOString())
      );
    };

    updateSeconds();
    const timer = setInterval(updateSeconds, 1_000);

    return () => clearInterval(timer);
  }, [attendance.clockInAt, attendance.operationStatus]);

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

  const todaySeconds = useMemo(() => {
    switch (attendance.operationStatus) {
      case 'working':
        return liveSeconds;
      case 'completed':
        return (
          calculateWorkSeconds(
            attendance.clockInAt,
            attendance.clockOutAt ?? attendance.earlyLeaveAt
          ) || attendance.workMinutes * 60
        );
      default:
        return 0;
    }
  }, [attendance, liveSeconds]);

  const operationStatus = attendance.operationStatus;
  const canClockIn =
    operationStatus === 'before_work' &&
    attendance.resultStatus !== 'vacation' &&
    attendance.resultStatus !== 'absent';
  const canClockOut = operationStatus === 'working';
  const canUndoClockOut = operationStatus === 'completed';

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

  const handleClockOut = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.checkOut.mutateAsync(
      attendance.date ?? undefined
    );

    if (!result.ok) {
      showToast(resolveAttendanceErrorMessage(result.error), 'error');
      return;
    }

    showToast('퇴근 완료! 필요하면 언제든 퇴근취소할 수 있어요.', 'success');
  }, [attendance.date, attendanceActions, showToast]);

  const handleUndoClockOut = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.undoClockOut.mutateAsync(
      attendance.date ?? undefined
    );

    if (!result.ok) {
      showToast(
        result.error === 'UNKNOWN'
          ? '퇴근취소 처리 중 문제가 발생했어요. Supabase SQL이 최신 상태인지 확인해 주세요.'
          : resolveAttendanceErrorMessage(result.error),
        'error'
      );
      return;
    }

    showToast('퇴근이 취소되었어요. 계속 근무할 수 있어요.', 'success');
  }, [attendance.date, attendanceActions, showToast]);

  const handleAutoCloseStaleSession = useCallback(async () => {
    if (attendanceActions.isMutating) return;

    const result = await attendanceActions.autoCloseStaleSession.mutateAsync(
      attendance.date ?? undefined
    );

    if (!result.ok) {
      showToast(resolveAttendanceErrorMessage(result.error), 'error');
      return;
    }

    showToast('어제 근무가 자동 마감되었어요.', 'success');
  }, [attendance.date, attendanceActions, showToast]);

  const handleCloseStaleSession = useCallback(
    async (clockOutAt: string) => {
      if (attendanceActions.isMutating) return;
      if (!attendance.date) return;

      const result = await attendanceActions.closeStaleSession.mutateAsync({
        workDate: attendance.date,
        clockOutAt,
      });

      if (!result.ok) {
        showToast(resolveAttendanceErrorMessage(result.error), 'error');
        return;
      }

      showToast('어제 퇴근이 처리되었어요.', 'success');
    },
    [attendance.date, attendanceActions, showToast]
  );

  return {
    lifecycle,
    attendance,
    attendanceRate,
    operationStatus,
    canClockIn,
    canClockOut,
    canUndoClockOut,
    todaySeconds,
    isLoading: lifecycle === 'loading',
    isMutating: attendanceActions.isMutating,
    toast,
    dismissToast,
    refresh,
    actions: {
      clockIn: () => void handleClockIn(),
      clockOut: () => void handleClockOut(),
      undoClockOut: () => void handleUndoClockOut(),
      closeStaleSession: (clockOutAt: string) =>
        void handleCloseStaleSession(clockOutAt),
      autoCloseStaleSession: () => void handleAutoCloseStaleSession(),
    },
    mode,
    error,
  };
}

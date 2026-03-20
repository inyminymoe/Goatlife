'use client';

import { useQuery } from '@tanstack/react-query';
import { attendanceKeys } from '@/hooks/attendanceKeys';
import { fetchAttendanceSummary } from '@/services/attendance';
import type {
  AttendanceSummaryPeriod,
  AttendanceUiState,
} from '@/types/attendance';

export function useAttendanceSummary({
  period,
}: {
  period: AttendanceSummaryPeriod;
}) {
  const query = useQuery({
    queryKey: attendanceKeys.summary(period),
    queryFn: () => fetchAttendanceSummary(period),
    staleTime: 60 * 1000,
  });

  const result = query.data;
  const summary = result?.ok ? result.data : null;
  const error = result?.ok === false ? result.error : null;

  let uiState: AttendanceUiState;

  if (query.isLoading) {
    uiState = { state: 'loading', error: null };
  } else if (error) {
    uiState = { state: 'error', error };
  } else if (!summary || summary.totalDays === 0) {
    uiState = {
      state: 'empty',
      error: null,
      emptyKey: 'attendance_summary_empty',
    };
  } else {
    uiState = { state: 'ready', error: null };
  }

  return {
    ...query,
    summary,
    error,
    uiState,
  };
}

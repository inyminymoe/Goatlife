'use client';

import { useQuery } from '@tanstack/react-query';
import { attendanceKeys } from '@/hooks/attendanceKeys';
import { fetchAttendanceToday } from '@/services/attendance';
import type { AttendanceUiState } from '@/types/attendance';

export function useAttendanceToday() {
  const query = useQuery({
    queryKey: attendanceKeys.today(),
    queryFn: fetchAttendanceToday,
    staleTime: 30 * 1000,
  });

  const result = query.data;
  const record = result?.ok ? result.data : null;
  const error = result?.ok === false ? result.error : null;

  let uiState: AttendanceUiState;

  if (query.isLoading) {
    uiState = { state: 'loading', error: null };
  } else if (error) {
    uiState = { state: 'error', error };
  } else if (!record) {
    uiState = {
      state: 'empty',
      error: null,
      emptyKey: 'attendance_today_empty',
    };
  } else {
    uiState = { state: 'ready', error: null };
  }

  return {
    ...query,
    record,
    error,
    uiState,
  };
}

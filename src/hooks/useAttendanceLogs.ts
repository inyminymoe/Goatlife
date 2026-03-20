'use client';

import { useQuery } from '@tanstack/react-query';
import { attendanceKeys } from '@/hooks/attendanceKeys';
import { fetchAttendanceLogs } from '@/services/attendance';
import type {
  AttendanceLogsParams,
  AttendanceUiState,
} from '@/types/attendance';

export function useAttendanceLogs(params: AttendanceLogsParams) {
  const query = useQuery({
    queryKey: attendanceKeys.logs(params),
    queryFn: () => fetchAttendanceLogs(params),
    staleTime: 60 * 1000,
  });

  const result = query.data;
  const logs = result?.ok ? result.data : [];
  const error = result?.ok === false ? result.error : null;

  let uiState: AttendanceUiState;

  if (query.isLoading) {
    uiState = { state: 'loading', error: null };
  } else if (error) {
    uiState = { state: 'error', error };
  } else if (logs.length === 0) {
    uiState = {
      state: 'empty',
      error: null,
      emptyKey: 'attendance_logs_empty',
    };
  } else {
    uiState = { state: 'ready', error: null };
  }

  return {
    ...query,
    logs,
    error,
    uiState,
  };
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceKeys } from '@/hooks/attendanceKeys';
import {
  requestCheckIn,
  requestCheckOut,
  requestUndoClockOut,
} from '@/services/attendance';

async function invalidateAttendanceQueries(
  queryClient: ReturnType<typeof useQueryClient>
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: attendanceKeys.today() }),
    queryClient.invalidateQueries({ queryKey: attendanceKeys.all }),
  ]);
}

export function useAttendanceActions() {
  const queryClient = useQueryClient();

  const checkIn = useMutation({
    mutationFn: requestCheckIn,
    onSettled: async () => {
      await invalidateAttendanceQueries(queryClient);
    },
  });

  const checkOut = useMutation({
    mutationFn: requestCheckOut,
    onSettled: async () => {
      await invalidateAttendanceQueries(queryClient);
    },
  });

  const undoClockOut = useMutation({
    mutationFn: requestUndoClockOut,
    onSettled: async () => {
      await invalidateAttendanceQueries(queryClient);
    },
  });

  return {
    checkIn,
    checkOut,
    undoClockOut,
    isMutating:
      checkIn.isPending || checkOut.isPending || undoClockOut.isPending,
  };
}

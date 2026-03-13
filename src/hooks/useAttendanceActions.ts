'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceKeys } from '@/hooks/attendanceKeys';
import {
  requestCheckIn,
  requestCheckOut,
  requestEarlyLeave,
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
    onSuccess: async result => {
      if (result.ok) {
        await invalidateAttendanceQueries(queryClient);
      }
    },
  });

  const earlyLeave = useMutation({
    mutationFn: requestEarlyLeave,
    onSuccess: async result => {
      if (result.ok) {
        await invalidateAttendanceQueries(queryClient);
      }
    },
  });

  const checkOut = useMutation({
    mutationFn: requestCheckOut,
    onSuccess: async result => {
      if (result.ok) {
        await invalidateAttendanceQueries(queryClient);
      }
    },
  });

  return {
    checkIn,
    earlyLeave,
    checkOut,
    isMutating: checkIn.isPending || earlyLeave.isPending || checkOut.isPending,
  };
}

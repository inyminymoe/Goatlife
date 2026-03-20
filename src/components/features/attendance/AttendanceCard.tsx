'use client';

import AttendanceView from './AttendanceView';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendanceCard() {
  const {
    lifecycle,
    attendance,
    attendanceRate,
    todaySeconds,
    isMutating,
    toast,
    dismissToast,
    actions,
    mode,
  } = useAttendance({ mode: 'compact' });

  return (
    <AttendanceView
      attendance={attendance}
      attendanceRate={attendanceRate}
      todaySeconds={todaySeconds}
      lifecycle={lifecycle}
      isMutating={isMutating}
      toast={toast}
      onDismissToast={dismissToast}
      actions={actions}
      mode={mode}
    />
  );
}

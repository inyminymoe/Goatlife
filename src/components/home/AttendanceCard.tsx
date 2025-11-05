'use client';

import AttendanceView from '@/components/shared/AttendanceView';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendanceCard() {
  const {
    lifecycle,
    attendance,
    attendanceRate,
    todayMinutes,
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
      todayMinutes={todayMinutes}
      lifecycle={lifecycle}
      isMutating={isMutating}
      toast={toast}
      onDismissToast={dismissToast}
      actions={actions}
      mode={mode}
    />
  );
}

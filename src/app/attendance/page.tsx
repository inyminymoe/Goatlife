'use client';

import AttendanceView from '@/components/shared/AttendanceView';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendancePage() {
  const {
    lifecycle,
    attendance,
    attendanceRate,
    todayMinutes,
    isMutating,
    toast,
    dismissToast,
    actions,
  } = useAttendance({ mode: 'full' });

  return (
    <main className="app-container py-8">
      <AttendanceView
        attendance={attendance}
        attendanceRate={attendanceRate}
        todayMinutes={todayMinutes}
        lifecycle={lifecycle}
        isMutating={isMutating}
        toast={toast}
        onDismissToast={dismissToast}
        actions={actions}
        mode="full"
      />
    </main>
  );
}

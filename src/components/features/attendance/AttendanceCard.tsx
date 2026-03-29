'use client';

import { useEffect, useState } from 'react';
import AttendanceView from './AttendanceView';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendanceCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
      lifecycle={mounted ? lifecycle : 'loading'}
      isMutating={isMutating}
      toast={toast}
      onDismissToast={dismissToast}
      actions={actions}
      mode={mode}
    />
  );
}

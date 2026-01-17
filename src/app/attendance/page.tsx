'use client';

import AttendanceDashboardCard from '@/components/features/attendance/AttendanceDashboardCard';
import AttendanceCard from '@/components/home/AttendanceCard';
import { Calendar } from '@/components/ui/Calendar';
import { AttendanceHeatmap } from '@/components/features/attendance/AttendanceHeatmap';

export default function AttendancePage() {
  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <AttendanceCard />
          <AttendanceDashboardCard />
        </div>

        <Calendar year={2025} month={10} />
        <AttendanceHeatmap />
      </div>
    </div>
  );
}

'use client';

import AttendanceDashboardCard from '@/components/features/attendance/AttendanceDashboardCard';
import AttendanceCard from '@/components/home/AttendanceCard';
import { Calendar } from '@/components/ui/Calendar';

export default function AttendancePage() {
  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* A. 상단 카드 행 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <AttendanceCard />
          <AttendanceDashboardCard />
        </div>

        {/* B. 캘린더 영역 placeholder — TODO: 캘린더 컴포넌트 삽입 */}
        <Calendar year={2025} month={10} />

        {/* C. 올해 근태 히트맵/업무기록 placeholder — TODO: 히트맵 + Drawer 영역 */}
        <section className="bg-grey-100 rounded-[5px] h-[260px] w-full" />
      </div>
    </div>
  );
}

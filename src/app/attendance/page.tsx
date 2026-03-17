import { redirect } from 'next/navigation';
import AttendanceDashboardCard from '@/components/features/attendance/AttendanceDashboardCard';
import AttendanceCard from '@/components/features/attendance/AttendanceCard';
import { Calendar } from '@/components/ui/Calendar';
import { AttendanceHeatmap } from '@/components/features/attendance/AttendanceHeatmap';
import { createServerSupabase } from '@/lib/supabase/server';

export default async function AttendancePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="grid grid-cols-1 gap-6 items-stretch md:grid-cols-2">
          <AttendanceCard />
          <AttendanceDashboardCard />
        </div>

        <Calendar year={2025} month={10} />
        <AttendanceHeatmap />
      </div>
    </div>
  );
}

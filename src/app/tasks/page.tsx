import PomodoroTimerCard from '@/components/features/task-plan/PomodoroTimerCard';

export default function TaskPlanPage() {
  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <PomodoroTimerCard />
        </div>
      </div>
    </div>
  );
}

import PomodoroTimerCard from '@/components/features/task-plan/PomodoroTimerCard';
import TimelineCard from '@/components/features/task-plan/TimelineCard';
import RoadmapCard from '@/components/features/task-plan/RoadmapCard';
import KanbanView from '@/components/features/kanban/components/KanbanView';

export default function Page() {
  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <PomodoroTimerCard />
          <TimelineCard />
        </section>
        <section className="bg-grey-100 rounded-[5px] px-[25px] py-5 min-h-[320px]">
          <KanbanView />
        </section>
        <RoadmapCard />
      </div>
    </div>
  );
}

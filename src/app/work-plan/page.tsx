import WorkPlanTimerSection from '@/components/features/task-plan/WorkPlanTimerSection';
import RoadmapCard from '@/components/features/task-plan/RoadmapCard';
import KanbanView from '@/components/features/kanban/components/KanbanView';

export default function Page() {
  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <WorkPlanTimerSection />
        <section className="bg-grey-100 rounded-[5px] px-[25px] py-5 min-h-[320px]">
          <KanbanView />
        </section>
        <RoadmapCard />
      </div>
    </div>
  );
}

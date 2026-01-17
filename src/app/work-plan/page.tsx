import KanbanView from '@/components/features/kanban/components/KanbanView';

export default function Page() {
  return (
    <main className="bg-grey-100 rounded-[5px] px-[25px] py-5 mb-5 col-span-2">
      {/* timer, timeline.. 추가 */}
      <KanbanView />
    </main>
  );
}

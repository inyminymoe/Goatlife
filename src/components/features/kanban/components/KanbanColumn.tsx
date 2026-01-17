import { TaskStatus } from '@/services/tasks';

interface KanbanColumnProps {
  board: TaskStatus;
  taskCount: number;
}

const STATUS_COLUMN = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const KanbanColumn = ({ board, taskCount }: KanbanColumnProps) => {
  return (
    <>
      <div className="flex items-center gap-x-2 pb-1.5">
        <h2 className="text-xs font-[600] text-primary-500">
          {STATUS_COLUMN[board]}
        </h2>
        <div className="size-5 flex items-center justify-center rounded-md bg-neutral-200 text-xs text-neutral-700 font-medium">
          {taskCount}
        </div>
      </div>
    </>
  );
};

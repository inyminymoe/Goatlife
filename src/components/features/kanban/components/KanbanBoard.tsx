'use client';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useCallback, useMemo, useState } from 'react';
import TodoItem from '@/components/ui/TodoItem';
import TodoDrawer from '@/components/TodoDrawer';
import Button from '@/components/ui/Button';
import TaskInput from './TaskInput';
import { KanbanColumn } from './KanbanColumn';
import { useTaskDrawer } from '../hooks/useTaskDrawer';
import { BOARDS } from '../lib/types';
import {
  calculateProgressFromState,
  organizeTasksByStatus,
  applyLocalChanges,
} from '../lib/utils';
import { useKanbanMutations } from '../hooks/useKanbanMutations';
import { useKanbanData } from '../hooks/useKanbanData';
import { useToast } from '@/providers/ToastProvider';
import { TaskStatus } from '@/services/tasks';

interface LocalChange {
  taskId: string;
  newStatus: TaskStatus;
  newIndex: number;
  sourceStatus: TaskStatus;
}

export function KanbanBoard() {
  const toast = useToast();
  const { tasks: serverTasks, isLoading } = useKanbanData();

  const [localChanges, setLocalChanges] = useState<LocalChange[]>([]);

  const { isOpen, selectedTask, open, close } = useTaskDrawer();
  const mutations = useKanbanMutations(toast);

  // 서버 데이터 + 로컬 변경사항을 합쳐서 최종 상태 계산
  const tasks = useMemo(() => {
    const organized = organizeTasksByStatus(serverTasks);
    return applyLocalChanges(organized, localChanges);
  }, [serverTasks, localChanges]);

  // 변경사항 유무 체크
  const hasChanges = localChanges.length > 0;

  const progress = useMemo(() => calculateProgressFromState(tasks), [tasks]);

  const handleOpenSettings = useCallback(
    (taskId: string) => {
      const task = Object.values(tasks)
        .flat()
        .find(t => t.id === taskId);
      if (task) open(task);
    },
    [tasks, open]
  );

  const handleSave = useCallback(
    (data: {
      id?: string;
      title: string;
      description: string;
      estimatedTime: string;
    }) => {
      if (data.id) {
        mutations.updateTask.mutate({
          taskId: data.id,
          updates: {
            title: data.title,
            description: data.description,
            estimated_time: data.estimatedTime,
          },
        });
      }
    },
    [mutations.updateTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      mutations.deleteTask.mutate(id);
    },
    [mutations.deleteTask]
  );

  const handleSubmit = useCallback(() => {
    mutations.submitTasks.mutate(tasks);
    setLocalChanges([]);
  }, [tasks, mutations.submitTasks]);

  /**
   * 드래그 앤 드롭 완료 시 실행되는 핸들러
   * - 로컬 변경사항만 기록
   * - 실제 상태는 파생 계산으로 자동 업데이트
   */
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const sourceStatus = source.droppableId as TaskStatus;
    const destStatus = destination.droppableId as TaskStatus;

    setLocalChanges(prev => {
      // 같은 태스크의 이전 변경사항 제거
      const filtered = prev.filter(change => change.taskId !== draggableId);

      return [
        ...filtered,
        {
          taskId: draggableId,
          newStatus: destStatus,
          newIndex: destination.index,
          sourceStatus: sourceStatus,
        },
      ];
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-grey-500">업무계획서를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <>
      <TodoDrawer
        isOpen={isOpen}
        onClose={close}
        todo={
          selectedTask
            ? {
                id: selectedTask.id,
                text: selectedTask.title,
                description: selectedTask.description || '',
              }
            : undefined
        }
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <div className="absolute top-1 right-0 flex items-center justify-end gap-2 text-sm">
        <p className="text-primary-500 font-medium">진행률</p>
        <strong>
          {progress.doneCount}/{progress.totalCount}
        </strong>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex overflow-x-auto">
          {BOARDS.map(board => (
            <div key={board} className="flex-1 p-1.5 pt-0 min-w-[200px]">
              <KanbanColumn board={board} taskCount={tasks[board].length} />
              <Droppable droppableId={board}>
                {provided => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[200px] py-1.5"
                  >
                    {tasks[board].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-1.5"
                          >
                            <TodoItem
                              id={task.id}
                              text={task.title}
                              onSettings={() => handleOpenSettings(task.id)}
                              completed={task.status === 'done'}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {board === 'todo' && (
                      <TaskInput
                        onSubmit={title =>
                          mutations.createTask.mutate({ title })
                        }
                        isLoading={mutations.createTask.isPending}
                      />
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <div className="text-right pt-4 border-t border-t-[#EAEAEA] flex items-center justify-end gap-2">
        {hasChanges && (
          <span className="text-sm text-orange-500">
            • 저장되지 않은 변경사항이 있습니다
          </span>
        )}
        <Button
          onClick={handleSubmit}
          disabled={mutations.submitTasks.isPending}
        >
          {mutations.submitTasks.isPending ? '제출 중...' : '제출'}
        </Button>
      </div>
    </>
  );
}

'use client';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import TodoItem from '@/components/ui/TodoItem';
import TodoDrawer from '@/components/TodoDrawer';
import Button from '@/components/ui/Button';
import TaskInput from './TaskInput';
import { KanbanColumn } from './KanbanColumn';
import { useTaskDrawer } from '../hooks/useTaskDrawer';
import { BOARDS } from '../lib/types';
import { organizeTasksByStatus, applyLocalChanges } from '../lib/utils';
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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const prevIsMobileRef = useRef<boolean | null>(null);

  const { isOpen, selectedTask, open, close } = useTaskDrawer();
  const mutations = useKanbanMutations(toast, () => setLocalChanges([]));

  // 반응형 레이아웃 변경 감지
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768; // md breakpoint

      // 이전 값이 존재하고, 레이아웃이 실제로 변경되었을 때
      if (
        prevIsMobileRef.current !== null &&
        prevIsMobileRef.current !== newIsMobile
      ) {
        setLocalChanges(prev => {
          // 저장되지 않은 변경사항이 있으면 초기화하고 경고
          if (prev.length > 0) {
            // 렌더링 사이클 밖에서 토스트 표시
            setTimeout(() => {
              toast.warning(
                '화면 크기 변경으로 저장되지 않은 변경사항이 초기화되었습니다.'
              );
            }, 0);
            return [];
          }
          return prev;
        });
      }

      prevIsMobileRef.current = newIsMobile;
      setIsMobile(newIsMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [toast]);

  // 서버 데이터 + 로컬 변경사항을 합쳐서 최종 상태 계산
  const tasks = useMemo(() => {
    const organized = organizeTasksByStatus(serverTasks);
    return applyLocalChanges(organized, localChanges);
  }, [serverTasks, localChanges]);

  const hasChanges = localChanges.length > 0;

  const progress = useMemo(() => {
    const doneCount = serverTasks.filter(t => {
      const change = localChanges.find(c => c.taskId === t.id);
      const status = change ? change.newStatus : t.status;
      return status === 'done';
    }).length;

    return {
      doneCount,
      totalCount: serverTasks.length,
    };
  }, [serverTasks, localChanges]);

  const handleOpenSettings = useCallback(
    (taskId: string) => {
      const task = serverTasks.find(t => t.id === taskId);
      if (task) open(task);
    },
    [serverTasks, open]
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

  const handleToggle = useCallback(
    (taskId: string) => {
      const task = serverTasks.find(t => t.id === taskId);
      if (!task) return;

      const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';

      setLocalChanges(prev => {
        const filtered = prev.filter(change => change.taskId !== taskId);
        return [
          ...filtered,
          {
            taskId,
            newStatus,
            newIndex: 0,
            sourceStatus: task.status,
          },
        ];
      });
    },
    [serverTasks]
  );

  const handleSubmit = useCallback(() => {
    mutations.submitTasks.mutate(tasks);
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

  if (isLoading || isMobile === null) {
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

      <DragDropContext
        key={isMobile ? 'mobile' : 'desktop'}
        onDragEnd={onDragEnd}
      >
        <div className="flex flex-col md:flex-row md:overflow-x-auto gap-5">
          {BOARDS.map(board => (
            <div key={board} className="flex-1 md:min-w-[200px]">
              <KanbanColumn board={board} taskCount={tasks[board].length} />
              <Droppable droppableId={board}>
                {provided => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[60px] py-1.5"
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
                              onToggle={handleToggle}
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

      <div className="pt-4 border-t border-t-[#EAEAEA] flex items-center gap-2">
        {hasChanges && (
          <span className="text-sm text-orange-500">
            • 저장되지 않은 변경사항이 있습니다
          </span>
        )}
        <Button
          onClick={handleSubmit}
          disabled={mutations.submitTasks.isPending}
          className="ml-auto"
        >
          {mutations.submitTasks.isPending ? '제출 중...' : '제출'}
        </Button>
      </div>
    </>
  );
}

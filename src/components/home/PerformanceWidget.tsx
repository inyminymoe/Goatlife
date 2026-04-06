'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import TodoItem from '@/components/ui/TodoItem';
import TodoDrawer from '@/components/TodoDrawer';
import { useKanbanData } from '../features/kanban/hooks/useKanbanData';
import { useKanbanMutations } from '../features/kanban/hooks/useKanbanMutations';
import { useTaskDrawer } from '../features/kanban/hooks/useTaskDrawer';
import { useToast } from '@/providers/ToastProvider';
import { updateTaskStatus } from '@/app/_actions/tasks';

export interface PerformanceWidgetProps {
  mode?: 'card' | 'page';
}

export default function PerformanceWidget(props: PerformanceWidgetProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { tasks, isLoading, error } = useKanbanData();
  const { isOpen, selectedTask, open, close } = useTaskDrawer();
  const mutations = useKanbanMutations(toast);

  const formatTasks = tasks.filter(item => item.status !== 'done').slice(0, 4);

  const toggleMutation = useMutation({
    mutationFn: (id: string) => updateTaskStatus(id, 'done'),
    onSuccess: result => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        toast.error('상태 변경 중 문제가 발생했어요');
      }
    },
  });

  const handleToggle = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleSettings = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) open(task);
  };

  const handleSave = (data: {
    id?: string;
    title: string;
    description: string;
  }) => {
    if (data.id) {
      mutations.updateTask.mutate({
        taskId: data.id,
        updates: { title: data.title, description: data.description },
      });
    }
  };

  const handleDelete = (id: string) => {
    mutations.deleteTask.mutate(id);
  };

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 icon-dark-invert"
          />
          <h2 className="brand-h3 text-grey-900">성과 현황</h2>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-12 bg-grey-300 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // 에러 상태
  if (error != null) {
    return (
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 icon-dark-invert"
          />
          <h2 className="brand-h3 text-grey-900">성과 현황</h2>
        </div>
        <div className="flex items-center justify-center h-40">
          <p className="body-sm text-grey-500">
            데이터를 불러오는 중 문제가 발생했어요.
          </p>
        </div>
      </section>
    );
  }

  const isEmpty = formatTasks.length === 0;

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 icon-dark-invert"
          />
          <h2 className="brand-h3 text-grey-900">성과 현황</h2>
        </div>

        {isEmpty ? (
          <div className="flex items-center justify-center h-40">
            <p className="body-sm text-grey-500">
              남아있는 업무계획이 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {formatTasks.map(item => (
              <TodoItem
                key={item.id}
                id={item.id}
                text={item.title}
                completed={false}
                onToggle={handleToggle}
                onSettings={handleSettings}
              />
            ))}
          </div>
        )}
      </section>

      <TodoDrawer
        isOpen={isOpen}
        onClose={close}
        todo={
          selectedTask
            ? {
                id: selectedTask.id,
                text: selectedTask.title,
                description: selectedTask.description || undefined,
              }
            : null
        }
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}

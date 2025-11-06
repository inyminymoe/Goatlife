'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import TodoItem from '@/components/ui/TodoItem';
import Toast from '@/components/ui/Toast';
import TodoDrawer from '@/components/TodoDrawer';
import { useTasks } from '@/hooks/useTasks';

export interface PerformanceWidgetProps {
  mode?: 'card' | 'page';
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function PerformanceWidget(props: PerformanceWidgetProps) {
  const { lifecycle, items, toast, dismissToast, actions } = useTasks({
    autoLoad: true,
    limit: 4,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = items.find(item => item.id === selectedTaskId);

  const handleToggle = (id: string) => {
    actions.markDone(id);
  };

  const handleSettings = (id: string) => {
    setSelectedTaskId(id);
    setDrawerOpen(true);
  };

  const handleSave = (data: {
    id?: string;
    title: string;
    description: string;
    estimatedTime: string;
  }) => {
    if (data.id) {
      actions.update(data.id, {
        title: data.title,
        description: data.description,
        estimated_time: data.estimatedTime,
      });
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    actions.remove(id);
    setDrawerOpen(false);
  };

  // 로딩 스켈레톤
  if (lifecycle === 'loading') {
    return (
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 text-primary-500"
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
  if (lifecycle === 'error') {
    return (
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 text-primary-500"
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

  // 빈 상태
  const isEmpty = items.length === 0;

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:pie-seven"
            className="w-6 h-6 text-primary-500"
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
            {items.map(item => (
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

      {toast && (
        <Toast
          show={true}
          message={toast.message}
          type={toast.type}
          onClose={dismissToast}
        />
      )}

      <TodoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
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

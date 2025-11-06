'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import {
  fetchTopTodos,
  changeTaskStatus,
  modifyTask,
  removeTask,
  type Task,
} from '@/services/tasks';

export type TasksLifecycle = 'idle' | 'loading' | 'ready' | 'error';
export type ToastState = { message: string; type: 'success' | 'error' } | null;

export interface UseTasksOptions {
  autoLoad?: boolean;
  limit?: number; // 최대 개수 제한 (기본 4)
}

export interface UseTasksResult {
  lifecycle: TasksLifecycle;
  items: Task[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  toast: ToastState;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  actions: {
    markDone: (taskId: string) => void;
    update: (
      taskId: string,
      updates: {
        title?: string;
        description?: string;
        estimated_time?: string;
      }
    ) => void;
    remove: (taskId: string) => void;
  };
}

export function useTasks(options: UseTasksOptions = {}): UseTasksResult {
  const { autoLoad = true, limit = 4 } = options;

  const [lifecycle, setLifecycle] = useState<TasksLifecycle>('idle');
  const [items, setItems] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToast({ message, type });
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const loadInitial = useCallback(async () => {
    setLifecycle('loading');
    setError(null);

    try {
      const result = await fetchTopTodos();

      if (result.ok) {
        const todoItems = result.data.filter(item => item.status === 'todo');
        setItems(todoItems.slice(0, limit));
        setLifecycle('ready');
      } else if (result.error === 'UNAUTHENTICATED') {
        setError('UNAUTHENTICATED');
        setLifecycle('error');
      } else {
        showToast('업무계획서를 불러오지 못했어요.', 'error');
        setError(result.error);
        setLifecycle('error');
      }
    } catch {
      setLifecycle('error');
      setError('UNKNOWN');
      showToast('업무계획서를 불러오는 중 문제가 발생했어요.', 'error');
    }
  }, [limit, showToast]);

  useEffect(() => {
    if (!autoLoad) return;
    void loadInitial();
  }, [autoLoad, loadInitial]);

  /**
   * 완료 처리 (done으로 변경 → 리스트에서 제거)
   */
  const handleMarkDone = useCallback(
    (taskId: string) => {
      if (isPending) return;

      const taskToRemove = items.find(item => item.id === taskId);
      if (!taskToRemove) return;

      // 낙관적 업데이트: 리스트에서 즉시 제거
      const optimisticItems = items.filter(item => item.id !== taskId);
      setItems(optimisticItems);

      startTransition(() => {
        void (async () => {
          const result = await changeTaskStatus(taskId, 'done');
          if (!result.ok) {
            // 실패시 롤백
            setItems(items);
            const message =
              result.error === 'UNAUTHENTICATED'
                ? '로그인이 필요해요.'
                : '완료 처리에 실패했어요. 잠시 후 다시 시도해주세요.';
            showToast(message, 'error');
            return;
          }

          // 성공
          showToast('업무 완료!', 'success');
        })();
      });
    },
    [items, isPending, showToast]
  );

  /**
   * 태스크 정보 업데이트
   */
  const handleUpdate = useCallback(
    (
      taskId: string,
      updates: {
        title?: string;
        description?: string;
        estimated_time?: string;
      }
    ) => {
      if (isPending) return;

      const originalItems = items;

      // 낙관적 업데이트
      const optimisticItems = items.map(item =>
        item.id === taskId ? { ...item, ...updates } : item
      );
      setItems(optimisticItems);

      startTransition(() => {
        void (async () => {
          const result = await modifyTask(taskId, updates);
          if (!result.ok) {
            // 실패시 롤백
            setItems(originalItems);
            const message =
              result.error === 'UNAUTHENTICATED'
                ? '로그인이 필요해요.'
                : '업데이트에 실패했어요.';
            showToast(message, 'error');
            return;
          }

          // 성공: 서버 데이터로 동기화
          setItems(prevItems =>
            prevItems.map(item =>
              item.id === taskId ? (result.data as Task) : item
            )
          );
          showToast('저장 완료!', 'success');
        })();
      });
    },
    [items, isPending, showToast]
  );

  /**
   * 태스크 삭제
   */
  const handleRemove = useCallback(
    (taskId: string) => {
      if (isPending) return;

      const originalItems = items;

      // 낙관적 업데이트: 리스트에서 즉시 제거
      const optimisticItems = items.filter(item => item.id !== taskId);
      setItems(optimisticItems);

      startTransition(() => {
        void (async () => {
          const result = await removeTask(taskId);
          if (!result.ok) {
            // 실패시 롤백
            setItems(originalItems);
            const message =
              result.error === 'UNAUTHENTICATED'
                ? '로그인이 필요해요.'
                : '삭제에 실패했어요.';
            showToast(message, 'error');
            return;
          }

          // 성공
          showToast('삭제 완료!', 'success');
        })();
      });
    },
    [items, isPending, showToast]
  );

  return {
    lifecycle,
    items,
    isLoading: lifecycle === 'loading',
    isMutating: isPending,
    error,
    toast,
    dismissToast,
    refresh: loadInitial,
    actions: {
      markDone: handleMarkDone,
      update: handleUpdate,
      remove: handleRemove,
    },
  };
}

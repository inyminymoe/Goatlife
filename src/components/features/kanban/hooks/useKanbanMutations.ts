import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createTask,
  updateTask,
  deleteTask,
  batchUpdateTasks,
} from '@/app/_actions/tasks';
import { TaskState } from '../lib/types';
import { createBatchUpdatePayload } from '../lib/utils';

interface ToastHelper {
  success: (message: string) => void;
  error: (message: string) => void;
}

export function useKanbanMutations(toast: ToastHelper) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('태스크가 등록되었어요!');
    },
    onError: () => {
      toast.error('태스크 등록 중 문제가 발생했어요.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: {
        title?: string;
        description?: string;
        estimated_time?: string;
      };
    }) => updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('태스크가 수정되었어요!');
    },
    onError: error => {
      console.error('수정 실패:', error);
      toast.error('태스크 수정 중 문제가 발생했어요.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('태스크가 삭제되었어요!');
    },
    onError: error => {
      console.error('삭제 실패:', error);
      toast.error('태스크 삭제 중 문제가 발생했어요.');
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (tasks: TaskState) => {
      const updates = createBatchUpdatePayload(tasks);
      const result = await batchUpdateTasks(updates);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('업무계획서가 제출되었어요!');
    },
    onError: error => {
      console.error('제출 실패:', error);
      toast.error('제출 중 문제가 발생했어요.');
    },
  });

  return {
    createTask: createMutation,
    updateTask: updateMutation,
    deleteTask: deleteMutation,
    submitTasks: submitMutation,
  };
}

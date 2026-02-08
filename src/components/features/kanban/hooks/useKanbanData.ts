import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '@/services/tasks';

export function useKanbanData() {
  const { data: tasksResult, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => fetchTasks(),
    staleTime: 1000 * 60,
  });

  const tasks = tasksResult?.ok ? tasksResult.data : [];

  return {
    tasks,
    isLoading,
    error: tasksResult?.ok === false ? tasksResult.error : null,
  };
}

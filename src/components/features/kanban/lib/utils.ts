import { Task, TaskStatus } from '@/services/tasks';
import { TaskState } from './types';

/**
 * Task 배열을 상태별로 그룹화하고 정렬
 */
export function organizeTasksByStatus(tasks: Task[]): TaskState {
  const organized: TaskState = {
    todo: [],
    in_progress: [],
    done: [],
  };

  tasks.forEach(task => {
    organized[task.status].push(task);
  });

  Object.keys(organized).forEach(status => {
    organized[status as TaskStatus].sort(
      (a, b) => a.order_index - b.order_index
    );
  });

  return organized;
}

/**
 * 진행률 계산 (Done 개수 / 전체 개수)
 */
export function calculateProgress(tasks: Task[]): {
  doneCount: number;
  totalCount: number;
  percentage: number;
} {
  const totalCount = tasks.length;
  const doneCount = tasks.filter(task => task.status === 'done').length;
  const percentage =
    totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return { doneCount, totalCount, percentage };
}

/**
 * TaskState에서 모든 태스크 추출 후 진행률 계산
 */
export function calculateProgressFromState(taskState: TaskState): {
  doneCount: number;
  totalCount: number;
  percentage: number;
} {
  const allTasks = Object.values(taskState).flat();
  return calculateProgress(allTasks);
}

/**
 * 로컬 변경사항 적용
 */
export function applyLocalChanges(
  organizedTasks: TaskState,
  localChanges: Array<{
    taskId: string;
    newStatus: TaskStatus;
    newIndex: number;
    sourceStatus: TaskStatus;
  }>
): TaskState {
  const result: TaskState = {
    todo: [...organizedTasks.todo],
    in_progress: [...organizedTasks.in_progress],
    done: [...organizedTasks.done],
  };

  localChanges.forEach(change => {
    // 1. 모든 컬럼에서 해당 태스크 찾기
    let foundTask: Task | null = null;
    let originalStatus: TaskStatus | null = null;

    for (const status of Object.keys(result) as TaskStatus[]) {
      const idx = result[status].findIndex(t => t.id === change.taskId);
      if (idx !== -1) {
        [foundTask] = result[status].splice(idx, 1);
        originalStatus = status;
        break;
      }
    }

    if (!foundTask) return;

    // 2. 상태 업데이트
    const updatedTask =
      originalStatus !== change.newStatus
        ? { ...foundTask, status: change.newStatus }
        : foundTask;

    // 3. 새 위치에 삽입
    result[change.newStatus].splice(change.newIndex, 0, updatedTask);
  });

  return result;
}

/**
 * 드래그앤드롭 후 배치 업데이트 데이터 생성
 */
export function createBatchUpdatePayload(tasks: TaskState) {
  return Object.entries(tasks).flatMap(([status, taskList]) =>
    taskList.map((task, index) => ({
      id: task.id,
      status: status as TaskStatus,
      order_index: (index + 1) * 1000,
    }))
  );
}

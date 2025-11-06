import {
  getTopTodos as serverGetTopTodos,
  getTasks as serverGetTasks,
  createTask as serverCreateTask,
  updateTaskStatus as serverUpdateTaskStatus,
  updateTask as serverUpdateTask,
  deleteTask as serverDeleteTask,
  type Task,
  type TaskStatus,
} from '@/app/_actions/tasks';

const DEFAULT_TIMEOUT = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

type TasksResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type { Task, TaskStatus };

/**
 * 상위 TODO 태스크 가져오기 (최대 4개)
 */
export async function fetchTopTodos(): Promise<TasksResult<Task[]>> {
  try {
    const result = await withTimeout(serverGetTopTodos());
    return result.ok
      ? { ok: true, data: result.data ?? [] }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

/**
 * 모든 태스크 가져오기 (상태별 필터링 가능)
 */
export async function fetchTasks(
  status?: TaskStatus
): Promise<TasksResult<Task[]>> {
  try {
    const result = await withTimeout(serverGetTasks(status));
    return result.ok
      ? { ok: true, data: result.data ?? [] }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

/**
 * 태스크 생성
 */
export async function createNewTask(input: {
  title: string;
  description?: string;
  estimated_time?: string;
}): Promise<TasksResult<Task>> {
  try {
    const result = await withTimeout(serverCreateTask(input));
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

/**
 * 태스크 상태 변경
 */
export async function changeTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<TasksResult<Task>> {
  try {
    const result = await withTimeout(serverUpdateTaskStatus(taskId, status));
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

/**
 * 태스크 정보 업데이트
 */
export async function modifyTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    order_index?: number;
    estimated_time?: string;
  }
): Promise<TasksResult<Task>> {
  try {
    const result = await withTimeout(serverUpdateTask(taskId, updates));
    return result.ok
      ? { ok: true, data: result.data }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

/**
 * 태스크 삭제
 */
export async function removeTask(taskId: string): Promise<TasksResult<null>> {
  try {
    const result = await withTimeout(serverDeleteTask(taskId));
    return result.ok
      ? { ok: true, data: null }
      : { ok: false, error: result.error };
  } catch {
    return { ok: false, error: 'UNKNOWN' };
  }
}

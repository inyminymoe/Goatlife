import { Task, TaskStatus } from '@/services/tasks';

export type TaskState = {
  [key in TaskStatus]: Task[];
};

export const BOARDS: TaskStatus[] = ['todo', 'in_progress', 'done'];

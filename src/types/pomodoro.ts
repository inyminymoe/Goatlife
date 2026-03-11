export type SessionStatus = 'focus-done' | 'focus-incomplete' | 'break';

export interface PomodoroSession {
  id: string;
  status: SessionStatus;
  durationSeconds: number;
  startedAt: Date;
}

export const ROUTINE_TIMER_START_EVENT = 'routine-timer-start';

export interface RoutineTimerStartDetail {
  routines: { id: string; title: string }[];
}

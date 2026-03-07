export type {
  RoutineCategory,
  RoutineMode,
  RoutineItemData,
} from '../RoutineItem';

export type RoutinePeriod = 'AM' | 'PM';

export interface RoutineState {
  am: import('../RoutineItem').RoutineItemData[];
  pm: import('../RoutineItem').RoutineItemData[];
}

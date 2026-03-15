import type { RoutineState } from './types';

export const DEFAULT_ROUTINES: RoutineState = {
  am: [
    { id: 'am-1', title: '명상', category: 'break', period: 'AM' },
    { id: 'am-2', title: '회의', category: 'work', period: 'AM' },
    { id: 'am-3', title: '업무계획 작성', category: 'work', period: 'AM' },
    { id: 'am-4', title: '스트레칭', category: 'break', period: 'AM' },
    { id: 'am-5', title: '생산 작업 1차', category: 'work', period: 'AM' },
    { id: 'am-6', title: '간식', category: 'leisure', period: 'AM' },
  ],
  pm: [
    { id: 'pm-1', title: '점심식사', category: 'break', period: 'PM' },
    { id: 'pm-2', title: '산책', category: 'break', period: 'PM' },
    { id: 'pm-3', title: '생산 작업 2차', category: 'work', period: 'PM' },
    { id: 'pm-4', title: '리뷰', category: 'work', period: 'PM' },
    { id: 'pm-5', title: '저녁식사', category: 'break', period: 'PM' },
    { id: 'pm-6', title: '헬스장', category: 'break', period: 'PM' },
    { id: 'pm-7', title: '게임', category: 'leisure', period: 'PM' },
    { id: 'pm-8', title: '웹툰', category: 'leisure', period: 'PM' },
  ],
};

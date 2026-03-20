export type TimerMode = 'focus' | 'break';

export interface TimerSettings {
  focusPresetMinutes: number;
  breakPresetMinutes: number;
}

// 세션 전체 모드: 아무것도 안 하는 상태 / 개별 루틴 시작 / 전체 루틴 순서대로 진행
export type SessionMode = 'idle' | 'manual' | 'routine';

// Routine Mode일 때 현재 어느 루틴을 실행 중인지 추적
export interface ActiveRoutine {
  id: string;
  title: string;
  index: number; // 전체 루틴 배열에서 현재 위치 (0부터 시작)
  totalCount: number; // 전체 루틴 개수
}

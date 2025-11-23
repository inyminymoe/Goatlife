export const COMPANY_BOARDS = [
  '공지사항',
  '성과보고',
  '체력단련실',
  '브레인연료',
  '사내신문고',
] as const;

export const COMPANY_TAGS = ['공지', '정보', '질문', '잡담', '모집'] as const;
export const DEPARTMENT_TAGS = [
  '공지',
  '정보',
  '질문',
  '모집',
  '잡담',
] as const;

export type BoardScope = 'company' | 'department';

export function getTagsByScope(scope: BoardScope) {
  return scope === 'company' ? [...COMPANY_TAGS] : [...DEPARTMENT_TAGS];
}

export function isValidBoard(scope: BoardScope, board?: string, dept?: string) {
  if (scope === 'company') {
    return board
      ? COMPANY_BOARDS.includes(board as (typeof COMPANY_BOARDS)[number])
      : false;
  }

  return !!(dept && dept.trim());
}

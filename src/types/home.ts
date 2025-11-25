import type { BoardScope } from '@/constants/board';

/**
 * 메인 페이지 게시판 위젯용 게시글 요약 타입
 */
export type MainBoardPostSummary = {
  id: string;
  scope: BoardScope;
  categoryName: string; // 게시판 이름 (예: '공지사항', 'IT부')
  title: string;
  createdAt: string; // ISO 8601 형식
};

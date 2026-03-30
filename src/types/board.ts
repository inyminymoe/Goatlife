import type { BoardScope } from '@/constants/board';

export type BoardPostInsert = {
  scope: BoardScope;
  board?: string;
  dept?: string;
  topic: string;
  title: string;
  content: string;
  hashtags?: string[];
};
export interface PostForView {
  id: string;
  scope: string;
  board?: string;
  dept?: string;
  topic: string;
  title: string;
  content: string;
  hashtags: string[];
  author_id: string;
  userName: string;
  viewCount: number;
  commentCount: number;
  dateCreated: string;
  dateUpdated: string;
  boardLabel: string;
  likeCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
}

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  parent_id: string | null; // 루트 댓글이면 null, 답글이면 부모 댓글 id
  reply_to_name: string | null; // 나중에 @멘션 표시용, 지금은 null로
  reply_count: number;
};

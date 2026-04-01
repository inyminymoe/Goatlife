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
  parent_id: string | null;
  reply_to_name: string | null;
  reply_count: number;
  like_count: number;
  is_liked: boolean;
};

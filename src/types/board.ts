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
}

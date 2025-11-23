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

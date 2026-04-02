'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { BoardScope } from '@/constants/board';

export type BoardPostRow = {
  id: string;
  scope: BoardScope;
  board: string | null;
  dept: string | null;
  title: string;
  content: string;
  topic: string | null;
  hashtags: string[] | null;
  author_name: string | null;
  view_count?: number | null;
  comment_count?: number | null;
  created_at: string;
};

export type BoardPostListResult = {
  posts: BoardPostRow[];
  total: number;
};

type ListParams = {
  scope: BoardScope;
  board?: string;
  dept?: string;
  topics?: string[];
  keyword?: string;
  page?: number;
  limit?: number;
};

export async function listBoardPostsForList({
  scope,
  board,
  dept,
  topics = [],
  keyword = '',
  page = 1,
  limit = 15,
}: ListParams): Promise<BoardPostListResult> {
  const supabase = await createServerSupabase();

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('board_posts')
    .select(
      'id, scope, board, dept, topic, title, content, hashtags, author_name, created_at, comment_count, view_count',
      { count: 'exact' }
    )
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (scope === 'company' && board) {
    query = query.eq('board', board);
  }

  if (scope === 'department' && dept) {
    query = query.eq('dept', dept);
  }

  if (topics.length > 0) {
    query = query.in('topic', topics);
  }

  if (keyword.trim()) {
    query = query.ilike('title', `%${keyword.trim()}%`);
  }

  const { data, error, count } = await query;

  if (error || !data) {
    console.error('[listBoardPostsForList] fetch failed', error);
    return { posts: [], total: 0 };
  }

  return { posts: data as BoardPostRow[], total: count ?? 0 };
}

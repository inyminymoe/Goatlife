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

type ListParams = {
  scope: BoardScope;
  board?: string;
  dept?: string;
  limit?: number;
};

export async function listBoardPostsForList({
  scope,
  board,
  dept,
  limit = 20,
}: ListParams): Promise<BoardPostRow[]> {
  const supabase = await createServerSupabase();

  const query = supabase
    .from('board_posts')
    .select(
      'id, scope, board, dept, topic, title, content, hashtags, author_name, created_at'
    )
    .eq('scope', scope)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (scope === 'company' && board) {
    query.eq('board', board);
  }

  if (scope === 'department' && dept) {
    query.eq('dept', dept);
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error('[listBoardPostsForList] fetch failed', error);
    return [];
  }

  return data as BoardPostRow[];
}

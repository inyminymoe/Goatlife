'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { MainBoardPostSummary } from '@/types/home';

/**
 * 로그인 유저용: 모든 게시판(전사 + 부서)의 최신글
 */
export async function getMemberAllBoards(
  limit: number = 6
): Promise<MainBoardPostSummary[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('board_posts')
    .select('id, scope, board, dept, title, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[getMemberAllBoards] fetch failed', error);
    return [];
  }

  return data.map(post => ({
    id: post.id,
    scope: post.scope as 'company' | 'department',
    categoryName:
      post.scope === 'company' ? post.board || '전사' : post.dept || '부서',
    title: post.title,
    createdAt: post.created_at,
  }));
}

/**
 * 게스트용: 전사게시판의 '공지사항' 카테고리 최신글
 */
export async function getGuestAnnouncements(
  limit: number = 6
): Promise<MainBoardPostSummary[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('board_posts')
    .select('id, scope, board, title, created_at')
    .eq('scope', 'company')
    .eq('board', '공지사항')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[getGuestAnnouncements] fetch failed', error);
    return [];
  }

  return data.map(post => ({
    id: post.id,
    scope: 'company' as const,
    categoryName: '공지사항',
    title: post.title,
    createdAt: post.created_at,
  }));
}

/**
 * 게스트용: 전사 + 부서 게시판의 모든 최신글
 */
export async function getGuestCommunity(
  limit: number = 6
): Promise<MainBoardPostSummary[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('board_posts')
    .select('id, scope, board, dept, title, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('[getGuestCommunity] fetch failed', error);
    return [];
  }

  return data.map(post => ({
    id: post.id,
    scope: post.scope as 'company' | 'department',
    categoryName:
      post.scope === 'company' ? post.board || '전사' : post.dept || '부서',
    title: post.title,
    createdAt: post.created_at,
  }));
}

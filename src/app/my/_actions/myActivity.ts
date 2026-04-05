'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export type MyActivityPost = {
  id: string;
  topic: string;
  title: string;
  author_name: string;
  created_at: string;
  scope: string;
  board: string | null;
  dept: string | null;
};

export type MyActivityComment = {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  author_name: string;
  post: MyActivityPost;
};

export type MyActivityResult<T> = {
  items: T[];
  total: number;
};

const PAGE_SIZE = 15;

export async function getMyBookmarks(
  page = 1
): Promise<MyActivityResult<MyActivityPost>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('board_post_bookmarks')
    .select(
      'post:board_posts(id, topic, title, author_name, created_at, scope, board, dept)',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error('[getMyBookmarks] failed', error);
    return { items: [], total: 0 };
  }

  const items = data
    .map(
      row =>
        (Array.isArray(row.post)
          ? row.post[0]
          : row.post) as MyActivityPost | null
    )
    .filter((p): p is MyActivityPost => p !== null);

  return { items, total: count ?? 0 };
}

export async function getMyLikedPosts(
  page = 1
): Promise<MyActivityResult<MyActivityPost>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('board_post_likes')
    .select(
      'post:board_posts(id, topic, title, author_name, created_at, scope, board, dept)',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error('[getMyLikedPosts] failed', error);
    return { items: [], total: 0 };
  }

  const items = data
    .map(
      row =>
        (Array.isArray(row.post)
          ? row.post[0]
          : row.post) as MyActivityPost | null
    )
    .filter((p): p is MyActivityPost => p !== null);

  return { items, total: count ?? 0 };
}

export async function getMyPosts(
  page = 1
): Promise<MyActivityResult<MyActivityPost>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('board_posts')
    .select('id, topic, title, author_name, created_at, scope, board, dept', {
      count: 'exact',
    })
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error('[getMyPosts] failed', error);
    return { items: [], total: 0 };
  }

  return { items: data as MyActivityPost[], total: count ?? 0 };
}

export async function getMyComments(
  page = 1
): Promise<MyActivityResult<MyActivityComment>> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], total: 0 };

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('board_post_comments')
    .select(
      'id, content, created_at, post_id, author_name, post:board_posts(id, topic, title, author_name, created_at, scope, board, dept)',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error || !data) {
    console.error('[getMyComments] failed', error);
    return { items: [], total: 0 };
  }

  const items = data.map(row => ({
    ...row,
    post: (Array.isArray(row.post)
      ? row.post[0]
      : row.post) as MyActivityComment['post'],
  }));

  return { items, total: count ?? 0 };
}

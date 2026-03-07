'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export async function deleteBoardPost(
  postId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요한 기능입니다.' };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('board_posts')
    .select('author_id')
    .eq('id', postId)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' };
  }

  if (existing.author_id !== user.id) {
    return { ok: false, error: '삭제 권한이 없습니다.' };
  }

  const { error: deleteError } = await supabase
    .from('board_posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error('[deleteBoardPost] delete failed', deleteError);
    return { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' };
  }

  return { ok: true };
}

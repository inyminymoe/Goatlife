'use server';

import { admin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

const BUCKET = 'post-images';

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

async function cleanupPostImages(postId: string): Promise<void> {
  const { data: images, error } = await admin
    .from('board_post_images')
    .select('url')
    .eq('post_id', postId);

  if (error || !images?.length) return;

  const paths = images
    .map(img => extractStoragePath(img.url))
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(BUCKET)
      .remove(paths);
    if (storageError) {
      console.error('[deleteBoardPost] storage cleanup failed', storageError);
    }
  }
}

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

  const isAuthor = existing.author_id === user.id;

  if (!isAuthor) {
    const { data: adminRow } = await supabase
      .from('exec_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRow) {
      return { ok: false, error: '삭제 권한이 없습니다.' };
    }
  }

  // DB 삭제 먼저 — 성공한 경우에만 Storage 정리
  // admin 클라이언트 사용: RLS "Allow delete own posts" (auth.uid() = author_id)가 관리자를 막으므로
  const { error: deleteError } = await admin
    .from('board_posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error('[deleteBoardPost] delete failed', deleteError);
    return { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' };
  }

  // Storage 정리는 best-effort — 실패해도 게시글 삭제는 이미 완료
  await cleanupPostImages(postId);

  return { ok: true };
}

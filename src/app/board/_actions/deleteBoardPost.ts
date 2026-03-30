'use server';

import { admin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

const BUCKET = 'post-images';

function extractStoragePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : null;
}

async function cleanupStoragePaths(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await admin.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error('[deleteBoardPost] storage cleanup failed', error);
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

  // CASCADE 삭제 전에 Storage 경로를 미리 수집
  // (board_post_images.post_id → board_posts.id ON DELETE CASCADE 로 인해
  //  게시글 삭제 후 조회하면 row가 이미 없음)
  const { data: images } = await supabase
    .from('board_post_images')
    .select('url')
    .eq('post_id', postId);

  const storagePaths = (images ?? [])
    .map(img => extractStoragePath(img.url))
    .filter((p): p is string => p !== null);

  // RLS "Allow delete own posts" + "Allow delete by admin" 정책이 처리
  // → 유저 세션 클라이언트 사용 (exec_quotes 패턴과 일관성 유지)
  const { error: deleteError } = await supabase
    .from('board_posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    console.error('[deleteBoardPost] delete failed', deleteError);
    return { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' };
  }

  // DB 삭제 성공 후 Storage 정리 (best-effort)
  await cleanupStoragePaths(storagePaths);

  return { ok: true };
}

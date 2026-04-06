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
    const { data: adminRow, error: adminError } = await supabase
      .from('exec_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError) {
      console.error('[deleteBoardPost] admin lookup failed', adminError);
      return { ok: false, error: '권한 확인 중 오류가 발생했습니다.' };
    }

    if (!adminRow) {
      return { ok: false, error: '삭제 권한이 없습니다.' };
    }
  }

  // soft delete 전에 Storage 경로를 미리 수집
  // (deleted_at 세팅 후에는 RLS SELECT 정책이 해당 row를 숨겨 조회 불가)
  const { data: images, error: imagesError } = await supabase
    .from('board_post_images')
    .select('url')
    .eq('post_id', postId);

  if (imagesError) {
    console.error(
      '[deleteBoardPost] image url fetch failed — storage cleanup will be skipped',
      imagesError
    );
  }

  const storagePaths = (images ?? [])
    .map(img => extractStoragePath(img.url))
    .filter((p): p is string => p !== null);

  // soft delete: admin 클라이언트로 RLS 우회
  // (작성자/관리자 권한 검사는 위에서 완료)
  const { error: deleteError } = await admin
    .from('board_posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);

  if (deleteError) {
    console.error('[deleteBoardPost] soft delete failed', deleteError);
    return { ok: false, error: '게시글 삭제 중 오류가 발생했습니다.' };
  }

  // DB soft delete 성공 후 Storage 정리 (best-effort)
  // pg_cron이 30일 후 DB row를 purge할 때 board_post_images도 CASCADE 정리됨
  await cleanupStoragePaths(storagePaths);

  return { ok: true };
}

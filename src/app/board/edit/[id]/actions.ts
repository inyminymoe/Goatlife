'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import {
  BoardPostFieldErrors,
  extractImageUrls,
  parseBoardPostFormData,
} from '../../_actions/boardPost.helpers';

export type UpdateBoardPostResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  fieldErrors?: BoardPostFieldErrors;
};

export async function updateBoardPost(
  formData: FormData
): Promise<UpdateBoardPostResult> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }

  const id = formData.get('id');
  if (!id || typeof id !== 'string') {
    return { ok: false, error: '잘못된 요청입니다.' };
  }

  // ── 작성자 권한 체크 ────────────────────────────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from('board_posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { ok: false, error: '게시글을 찾을 수 없습니다.' };
  }

  if (existing.author_id !== user.id) {
    return { ok: false, error: '수정 권한이 없습니다.' };
  }

  // ── 공통 파싱/validation/정규화 ────────────────────────────────────────────
  const parsed = parseBoardPostFormData(formData);
  if (!parsed.ok) return parsed;

  const {
    scopeValue,
    boardValue,
    deptValue,
    topicValue,
    titleValue,
    contentValue,
    hashtags,
  } = parsed.fields;

  // ── update ─────────────────────────────────────────────────────────────────
  const { data: updated, error: updateError } = await supabase
    .from('board_posts')
    .update({
      topic: topicValue,
      title: titleValue,
      content: contentValue,
      hashtags,
      updated_at: new Date().toISOString(),
      ...(scopeValue === 'company'
        ? { board: boardValue }
        : { dept: deptValue }),
    })
    .eq('id', id)
    .select('id')
    .single();

  if (updateError || !updated?.id) {
    console.error('[updateBoardPost] update failed', updateError);
    return { ok: false, error: '게시글 수정 중 오류가 발생했습니다.' };
  }

  // ── 이미지 트래킹 갱신 ─────────────────────────────────────────────────────
  const imgUrls = extractImageUrls(contentValue);
  await supabase.from('board_post_images').delete().eq('post_id', id);

  if (imgUrls.length > 0) {
    const { error: imgInsertError } = await supabase
      .from('board_post_images')
      .insert(imgUrls.map(url => ({ post_id: updated.id, url })));

    if (imgInsertError) {
      console.error('[updateBoardPost] image tracking failed', imgInsertError);
    }
  }

  return { ok: true, postId: updated.id };
}

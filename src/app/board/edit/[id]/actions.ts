'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { isValidBoard, type BoardScope } from '@/constants/board';

export type UpdateBoardPostResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  fieldErrors?: Partial<
    Record<'title' | 'content' | 'category' | 'topic', string>
  >;
};

/** content HTML에서 Supabase Storage 이미지 URL만 추출 */
function extractImageUrls(content: string): string[] {
  return [
    ...content.matchAll(
      /src="(https?:\/\/[^"]*supabase[^"]*post-images[^"]*)"/g
    ),
  ].map(m => m[1]);
}

export async function updateBoardPost(
  formData: FormData
): Promise<UpdateBoardPostResult> {
  const supabase = await createServerSupabase();

  // ── 인증 ──────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }

  // ── FormData 파싱 ──────────────────────────────────────────────────────────
  const id = formData.get('id');
  const scope = formData.get('scope');
  const topic = formData.get('topic');
  const board = formData.get('board');
  const dept = formData.get('dept');
  const title = formData.get('title');
  const content = formData.get('content');
  const hashtagsRaw = formData.getAll('hashtags');

  if (!id || typeof id !== 'string') {
    return { ok: false, error: '잘못된 요청입니다.' };
  }

  // ── 작성자 권한 체크 ──────────────────────────────────────
  const { data: existing } = await supabase
    .from('board_posts')
    .select('author_id')
    .eq('id', id)
    .single();

  if (existing?.author_id !== user.id) {
    return { ok: false, error: '수정 권한이 없습니다.' };
  }

  const scopeValue =
    scope === 'company' || scope === 'department' ? scope : null;

  if (!scopeValue) {
    return { ok: false, error: '유효하지 않은 게시판 요청입니다.' };
  }

  // ── 서버 validation ────────────────────────────────────────────────────────
  const fieldErrors: UpdateBoardPostResult['fieldErrors'] = {};

  if (scopeValue === 'company') {
    if (!board || typeof board !== 'string' || !board.trim()) {
      fieldErrors.category = '게시판 카테고리를 선택해주세요.';
    }
  }

  if (scopeValue === 'department') {
    if (!dept || typeof dept !== 'string' || !dept.trim()) {
      fieldErrors.category = '부서를 선택해주세요.';
    }
  }

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    fieldErrors.topic = '분류를 선택해주세요.';
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    fieldErrors.title = '제목을 입력해주세요.';
  }

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    fieldErrors.content = '본문은 5자 이상 입력해주세요.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  // ── 값 정규화 ──────────────────────────────────────────────────────────────
  const boardValue = typeof board === 'string' ? board.trim() : '';
  const deptValue = typeof dept === 'string' ? dept.trim() : '';
  const topicValue = typeof topic === 'string' ? topic.trim() : '';
  const titleValue = title!.toString().trim();
  const contentValue = content!.toString().trim();
  const normalizedScope = scopeValue as BoardScope;

  const hashtags = Array.from(
    new Set(
      hashtagsRaw
        .map(tag => String(tag).trim().replace(/^#+/, ''))
        .filter(Boolean)
    )
  ).slice(0, 5);

  if (!isValidBoard(normalizedScope, boardValue, deptValue)) {
    return { ok: false, error: '유효하지 않은 게시판 정보입니다.' };
  }

  // ── 게시글 update ──────────────────────────────────────────────────────────
  const { data: updated, error: updateError } = await supabase
    .from('board_posts')
    .update({
      topic: topicValue,
      title: titleValue,
      content: contentValue,
      hashtags,
      updated_at: new Date().toISOString(),
      ...(normalizedScope === 'company'
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

  // ── 이미지 URL 트래킹 갱신 ────────────────────────────────────────────────
  const imgUrls = extractImageUrls(contentValue);

  // 기존 이미지 레코드 삭제 후 재삽입
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

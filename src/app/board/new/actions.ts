'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { isValidBoard, type BoardScope } from '@/constants/board';
import type { BoardPostInsert } from '@/types/board';

export type CreateBoardPostResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  fieldErrors?: Partial<
    Record<'title' | 'content' | 'hashtags' | 'category' | 'topic', string>
  >;
};

type UploadBoardImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

type ProfileRow = {
  last_name?: string | null;
  rank?: string | null;
};

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function deriveAuthorName(
  user: {
    user_metadata?: Record<string, unknown>;
    email?: string | null;
  },
  profile?: ProfileRow | null
) {
  const metadata = user.user_metadata ?? {};
  const lastName =
    profile?.last_name?.trim() ||
    (metadata['last_name'] as string | undefined)?.trim() ||
    (metadata['profile_nickname'] as string | undefined)?.trim() ||
    (metadata['nickname'] as string | undefined)?.trim() ||
    (metadata['name'] as string | undefined)?.trim() ||
    (metadata['full_name'] as string | undefined)?.trim() ||
    user.email?.split('@')[0];

  const rank = profile?.rank?.trim();
  const combined =
    lastName && rank ? `${lastName} ${rank}` : lastName || rank || null;

  return combined ?? '익명';
}

/** content HTML에서 Supabase Storage 이미지 URL만 추출 */
function extractImageUrls(content: string): string[] {
  return [
    ...content.matchAll(
      /src="(https?:\/\/[^"]*supabase[^"]*post-images[^"]*)"/g
    ),
  ].map(m => m[1]);
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function uploadBoardImage(
  formData: FormData
): Promise<UploadBoardImageResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, error: '파일이 없습니다.' };

  const ext = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    console.error('[uploadBoardImage] upload failed', uploadError);
    return { ok: false, error: '이미지 업로드에 실패했습니다.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(fileName);

  return { ok: true, url: publicUrl };
}

export async function createBoardPost(
  formData: FormData
): Promise<CreateBoardPostResult> {
  const supabase = await createServerSupabase();

  // ── 인증 ────────────────────────────────────────────────────────────────────
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요한 기능입니다.' };
  }

  // ── 프로필 ───────────────────────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('last_name, rank')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[createBoardPost] profile fetch failed', profileError);
  }

  // ── FormData 파싱 ────────────────────────────────────────────────────────────
  const scope = formData.get('scope');
  const topic = formData.get('topic');
  const board = formData.get('board');
  const dept = formData.get('dept');
  const title = formData.get('title');
  const content = formData.get('content');
  const hashtagsRaw = formData.getAll('hashtags');

  const scopeValue =
    scope === 'company' || scope === 'department' ? scope : null;

  if (!scopeValue) {
    return { ok: false, error: '유효하지 않은 게시판 요청입니다.' };
  }

  // ── 서버 validation ──────────────────────────────────────────────────────────
  const fieldErrors: CreateBoardPostResult['fieldErrors'] = {};

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

  // ── 값 정규화 ────────────────────────────────────────────────────────────────
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

  // ── 게시글 insert ────────────────────────────────────────────────────────────
  const payload: BoardPostInsert = {
    scope: normalizedScope,
    topic: topicValue,
    title: titleValue,
    content: contentValue,
    hashtags,
    ...(normalizedScope === 'company'
      ? { board: boardValue }
      : { dept: deptValue }),
  };

  const { data: inserted, error: insertError } = await supabase
    .from('board_posts')
    .insert({
      ...payload,
      author_id: user.id,
      author_name: deriveAuthorName(user, profile),
    })
    .select('id')
    .single();

  if (insertError || !inserted?.id) {
    console.error('[createBoardPost] insert failed', insertError);
    return { ok: false, error: '게시글 저장 중 오류가 발생했습니다.' };
  }

  // ── 이미지 URL 트래킹 (고아 파일 정리용) ────────────────────────────────────
  const imgUrls = extractImageUrls(contentValue);

  if (imgUrls.length > 0) {
    const { error: imgInsertError } = await supabase
      .from('board_post_images')
      .insert(imgUrls.map(url => ({ post_id: inserted.id, url })));

    if (imgInsertError) {
      // 트래킹 실패는 게시글 저장 성공에 영향 없음 — 로그만 남김
      console.error('[createBoardPost] image tracking failed', imgInsertError);
    }
  }

  return { ok: true, postId: inserted.id };
}

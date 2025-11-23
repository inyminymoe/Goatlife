'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { isValidBoard, type BoardScope } from '@/constants/board';
import type { BoardPostInsert } from '@/types/board';

// createBoardPost(formData)에서 기대하는 필드 구조 예시:
//
// scope: 'company' | 'department'
// board: '공지사항' | '성과보고' | ... (scope === 'company' 일 때만)
// dept:  'IT부' | '공시부' | ...       (scope === 'department' 일 때만)
// topic: '공지' | '정보' | '질문' | '잡담' | '모집'   // 말머리/분류
// title: string
// content: string
// hashtags: string[]   // #태그 입력으로 들어온 값 배열

export type CreateBoardPostResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  fieldErrors?: Partial<
    Record<'title' | 'content' | 'hashtags' | 'category' | 'topic', string>
  >;
};

type ProfileRow = {
  last_name?: string | null;
  rank?: string | null;
};

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

export async function createBoardPost(
  formData: FormData
): Promise<CreateBoardPostResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요한 기능입니다.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('last_name, rank')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[createBoardPost] profile fetch failed', profileError);
  }

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

  if (
    fieldErrors.title ||
    fieldErrors.content ||
    fieldErrors.category ||
    fieldErrors.topic
  ) {
    return {
      ok: false,
      fieldErrors,
    };
  }

  const cleanedHashtags =
    hashtagsRaw
      .map(tag => String(tag).trim())
      .filter(Boolean)
      .map(tag => tag.replace(/^#+/, '')) ?? [];
  const hashtags = Array.from(new Set(cleanedHashtags)).slice(0, 5);

  const boardValue = typeof board === 'string' ? board.trim() : '';
  const deptValue = typeof dept === 'string' ? dept.trim() : '';
  const topicValue = typeof topic === 'string' ? topic.trim() : '';
  const normalizedScope = scopeValue as BoardScope;

  if (!isValidBoard(normalizedScope, boardValue, deptValue)) {
    return {
      ok: false,
      error: '유효하지 않은 게시판 정보입니다.',
    };
  }

  const payload: BoardPostInsert = {
    scope: normalizedScope,
    topic: topicValue,
    title: title!.toString().trim(),
    content: content!.toString().trim(),
    hashtags,
  };

  if (normalizedScope === 'company') {
    payload.board = boardValue;
  } else {
    payload.dept = deptValue;
  }

  const authorName = deriveAuthorName(user, profile);

  const { data: inserted, error } = await supabase
    .from('board_posts')
    .insert({
      ...payload,
      author_id: user.id,
      author_name: authorName,
    })
    .select('id')
    .single();

  if (error || !inserted?.id) {
    console.error('[createBoardPost] insert failed', error);
    return { ok: false, error: '게시글 저장 중 오류가 발생했습니다.' };
  }

  return {
    ok: true,
    postId: inserted.id,
  };
}

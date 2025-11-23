'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  getTagsByScope,
  type BoardScope,
  isValidBoard,
} from '@/constants/board';

const boardPostSchema = z.object({
  scope: z.enum(['company', 'department']),
  board: z
    .string()
    .optional()
    .transform(value => (value?.trim() ? value.trim() : undefined)),
  dept: z
    .string()
    .optional()
    .transform(value => (value?.trim() ? value.trim() : undefined)),
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요.')
    .max(100, '제목은 100자 이내로 입력해주세요.'),
  content: z
    .string()
    .trim()
    .min(5, '본문은 5자 이상 입력해주세요.')
    .max(3000, '본문은 3000자 이하로 입력해주세요.'),
  tags: z
    .array(z.string().trim())
    .max(5, '태그는 최대 5개까지 선택할 수 있습니다.')
    .optional()
    .default([]),
});

export type CreateBoardPostResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<'title' | 'content' | 'tags', string>>;
};

function deriveAuthorName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata['profile_nickname'],
    metadata['nickname'],
    metadata['last_name'],
    metadata['name'],
    metadata['full_name'],
    user.email?.split('@')[0],
  ];

  const display = candidates.find(
    value => typeof value === 'string' && value.trim().length > 0
  ) as string | undefined;

  return display?.trim() ?? '익명';
}

export async function createBoardPost(
  formData: FormData
): Promise<CreateBoardPostResult> {
  const rawScope = String(formData.get('scope') ?? 'company') as BoardScope;
  const parsed = boardPostSchema.safeParse({
    scope: rawScope,
    board: formData.get('board'),
    dept: formData.get('dept'),
    title: formData.get('title'),
    content: formData.get('content'),
    tags: formData.getAll('tags').map(tag => String(tag)),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? '입력값을 확인해주세요.',
      fieldErrors: {
        ...(issue?.path?.[0] === 'title' ? { title: issue.message } : {}),
        ...(issue?.path?.[0] === 'content' ? { content: issue.message } : {}),
        ...(issue?.path?.[0] === 'tags' ? { tags: issue.message } : {}),
      },
    };
  }

  const { scope, board, dept, title, content } = parsed.data;
  const tags = Array.from(new Set(parsed.data.tags ?? []));

  // scope/board/dept 조합 검증
  if (!isValidBoard(scope, board, dept)) {
    return {
      ok: false,
      error: '유효하지 않은 게시판 정보입니다.',
    };
  }

  // 태그 유효성 검증
  const availableTags = getTagsByScope(scope);
  const invalidTag = tags.find(
    tag => !availableTags.includes(tag as (typeof availableTags)[number])
  );
  if (invalidTag) {
    return { ok: false, error: '선택할 수 없는 태그가 포함되어 있습니다.' };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }

  const authorName = deriveAuthorName(user);

  const { data: inserted, error } = await supabase
    .from('board_posts')
    .insert({
      scope,
      board: scope === 'company' ? board : null,
      dept: scope === 'department' ? dept : null,
      title,
      content,
      tags,
      author_id: user.id,
      author_name: authorName,
      view_count: 0,
      comment_count: 0,
    })
    .select('id')
    .single();

  if (error || !inserted?.id) {
    console.error('[createBoardPost] insert failed', error);
    return { ok: false, error: '게시글 저장 중 오류가 발생했습니다.' };
  }

  const query = new URLSearchParams({
    scope,
    ...(scope === 'company' && board ? { board } : {}),
    ...(scope === 'department' && dept ? { dept } : {}),
  });

  redirect(`/board/detail/${inserted.id}?${query.toString()}`);
}

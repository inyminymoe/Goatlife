'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import type { BoardPostInsert } from '@/types/board';
import {
  BoardPostFieldErrors,
  extractImageUrls,
  parseBoardPostFormData,
} from '../_actions/boardPost.helpers';

export type CreateBoardPostResult = {
  ok: boolean;
  postId?: string;
  error?: string;
  fieldErrors?: BoardPostFieldErrors;
};

export type UploadBoardImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

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

  // ── insert ─────────────────────────────────────────────────────────────────
  const payload: BoardPostInsert = {
    scope: scopeValue,
    topic: topicValue,
    title: titleValue,
    content: contentValue,
    hashtags,
    ...(scopeValue === 'company' ? { board: boardValue } : { dept: deptValue }),
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

  // ── 이미지 트래킹 ───────────────────────────────────────────────────────────
  const imgUrls = extractImageUrls(contentValue);
  if (imgUrls.length > 0) {
    const { error: imgInsertError } = await supabase
      .from('board_post_images')
      .insert(imgUrls.map(url => ({ post_id: inserted.id, url })));

    if (imgInsertError) {
      console.error('[createBoardPost] image tracking failed', imgInsertError);
    }
  }

  return { ok: true, postId: inserted.id };
}

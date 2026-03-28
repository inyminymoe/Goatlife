'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export type UploadBoardImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

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

  const maxFileSize = 1.5 * 1024 * 1024;
  const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  if (file.size > maxFileSize) {
    return {
      ok: false,
      error: '1.5MB 이하의 이미지 파일만 업로드할 수 있습니다.',
    };
  }
  if (!allowedTypes.has(file.type)) {
    return {
      ok: false,
      error: 'JPEG, PNG, WebP, GIF 형식만 업로드할 수 있습니다.',
    };
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const fileName = `${user.id}/${timestamp}.${ext}`;
  const safeFile = new File([file], `${timestamp}.${ext}`, { type: file.type });

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, safeFile, { contentType: file.type });

  if (uploadError) {
    console.error('[uploadBoardImage] upload failed', uploadError);
    return { ok: false, error: '이미지 업로드에 실패했습니다.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(fileName);

  return { ok: true, url: publicUrl };
}

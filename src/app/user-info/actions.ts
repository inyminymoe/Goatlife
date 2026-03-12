'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { profileEditSchema, type ProfileEditFormValues } from './schema';

export async function updateUserProfile(
  form: ProfileEditFormValues
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = profileEditSchema.safeParse(form);
  if (!parsed.success) {
    const msg = parsed.error.issues?.[0]?.message ?? '입력값을 확인해주세요.';
    return { ok: false, error: msg };
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, error: '로그인이 필요합니다.' };
  }

  const { error: updateError } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      last_name: form.lastName,
      first_name: form.firstName ?? null,
      avatar_url: form.avatarUrl || null,
      department: form.department,
      work_hours: form.workHours,
      work_type: form.workType,
      work_style: form.workStyle ?? null,
      work_ethic: form.workEthic ?? null,
    },
    { onConflict: 'id' }
  );

  if (updateError) {
    console.error('[updateUserProfile] upsert failed', updateError);
    return { ok: false, error: '프로필 저장에 실패했습니다.' };
  }

  return { ok: true };
}

export type UploadProfileImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * 프로필 이미지 업로드 (Supabase Storage 재활용)
 * 게시판 이미지 업로더 로직과 동일하게 작동하며, 경로만 avatars/ 아래로 분리한다.
 */
export async function uploadProfileImage(
  formData: FormData
): Promise<UploadProfileImageResult> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: '로그인이 필요합니다.' };

  const file = formData.get('file') as File | null;
  if (!file) return { ok: false, error: '파일이 없습니다.' };

  const maxFileSize = 5 * 1024 * 1024;
  const allowedTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  if (file.size > maxFileSize || !allowedTypes.has(file.type)) {
    return {
      ok: false,
      error: '5MB 이하의 이미지 파일만 업로드할 수 있습니다.',
    };
  }

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `avatars/${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('post-images')
    .upload(fileName, file, { contentType: file.type });

  if (uploadError) {
    console.error('[uploadProfileImage] upload failed', uploadError);
    return { ok: false, error: '이미지 업로드에 실패했습니다.' };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('post-images').getPublicUrl(fileName);

  return { ok: true, url: publicUrl };
}

'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { admin } from '@/lib/supabase/admin';
import { profileEditSchema, type ProfileEditFormValues } from './schema';

function checkMagicBytes(buf: Uint8Array): boolean {
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return true;
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38)
    return true;
  // WebP: RIFF....WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return true;
  return false;
}

async function isValidImageMagicBytes(file: File): Promise<boolean> {
  const arrayBuf = await file.arrayBuffer();
  const buf = new Uint8Array(arrayBuf, 0, Math.min(12, arrayBuf.byteLength));
  return checkMagicBytes(buf);
}

/**
 * 회원가입 시 base64 아바타를 Storage에 업로드 (admin 클라이언트, 인증 불필요)
 * createUser 서버 액션 전용. signUp() 성공 직후 userId를 넘겨 호출한다.
 */
export async function uploadSignupAvatar(
  userId: string,
  base64DataUrl: string
): Promise<string | null> {
  const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const allowedMimes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ]);
  if (!allowedMimes.has(mimeType)) return null;

  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > 1 * 1024 * 1024) return null; // 가입 시 1MB 제한

  const bufBytes = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    Math.min(12, buffer.byteLength)
  );
  if (!checkMagicBytes(bufBytes)) return null;

  const ext = mimeType.split('/')[1];
  const fileName = `avatars/${userId}/${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from('post-images')
    .upload(fileName, buffer, { contentType: mimeType });

  if (error) {
    console.error('[uploadSignupAvatar] upload failed', error);
    return null;
  }

  const {
    data: { publicUrl },
  } = admin.storage.from('post-images').getPublicUrl(fileName);

  return publicUrl;
}

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
      work_days_per_week: form.workDaysPerWeek,
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

  if (!(await isValidImageMagicBytes(file))) {
    return { ok: false, error: '올바른 이미지 파일이 아닙니다.' };
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

import { createClient } from '@/lib/supabase/index';

const BUCKET = 'comment_images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export const UPLOAD_LIMITS = { MAX_FILE_SIZE, MAX_FILES };

export async function uploadCommentImages(
  files: File[],
  postId: string
): Promise<string[]> {
  const supabase = createClient();
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : null;

    if (!ext) {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    const path = `comments/${postId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });

    if (error) {
      // 업로드 중 실패 시 이미 올라간 것들 롤백
      if (urls.length > 0) {
        const paths = urls.map(u => u.split(`${BUCKET}/`)[1]);
        await supabase.storage.from(BUCKET).remove(paths);
      }
      throw new Error('이미지 업로드 실패');
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(data.publicUrl);
  }

  return urls;
}

export async function deleteCommentImages(imageUrls: string[]): Promise<void> {
  if (imageUrls.length === 0) {
    return;
  }
  const supabase = createClient();
  const paths = imageUrls.map(url => url.split(`${BUCKET}/`)[1]);
  await supabase.storage.from(BUCKET).remove(paths);
}

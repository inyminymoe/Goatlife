import { Comment } from '@/types/board';

type RawComment = Partial<Comment> & Pick<Comment, 'id' | 'post_id' | 'user_id'>;

function normalizeComment(raw: RawComment): Comment {
  return {
    id: raw.id,
    post_id: raw.post_id,
    user_id: raw.user_id,
    author_name: raw.author_name ?? null,
    content: raw.content ?? '',
    is_pinned: raw.is_pinned ?? false,
    image_urls: Array.isArray(raw.image_urls) ? raw.image_urls : [],
    created_at: raw.created_at ?? '',
    updated_at: raw.updated_at ?? '',
    parent_id: raw.parent_id ?? null,
    reply_to_name: raw.reply_to_name ?? null,
    reply_count:
      typeof raw.reply_count === 'number' && Number.isFinite(raw.reply_count)
        ? raw.reply_count
        : 0,
  };
}

export async function fetchComments(
  postId: string,
  page: number
): Promise<Comment[]> {
  const res = await fetch(`/api/board/posts/${postId}/comments?page=${page}`);
  if (!res.ok) {
    throw new Error('댓글 조회 실패');
  }
  const data = (await res.json()) as RawComment[];
  return data.map(normalizeComment);
}

export async function fetchReplies(
  postId: string,
  parentId: string
): Promise<Comment[]> {
  const res = await fetch(
    `/api/board/posts/${postId}/comments?parent_id=${parentId}`
  );

  if (!res.ok) {
    throw new Error('답글 조회 실패');
  }

  const data = (await res.json()) as RawComment[];
  return data.map(normalizeComment);
}

export async function createComment(
  postId: string,
  payload: { content: string; image_urls: string[]; parent_id: string | null }
): Promise<void> {
  const res = await fetch(`/api/board/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('댓글 등록 실패');
  }
}

export async function deleteComment(postId: string, commentId: string) {
  const res = await fetch(`/api/board/posts/${postId}/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error('delete failed');
  }
}

export async function patchComment(
  postId: string,
  commentId: string,
  body: { is_pinned: boolean }
) {
  const res = await fetch(`/api/board/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error('pin failed');
  }
}

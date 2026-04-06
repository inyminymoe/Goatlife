import { Comment } from '@/types/board';

export class CommentApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'CommentApiError';
  }
}

export function isCommentUnauthorizedError(
  error: unknown
): error is CommentApiError {
  return error instanceof CommentApiError && error.status === 401;
}

async function createCommentApiError(
  res: Response,
  fallbackMessage: string
): Promise<CommentApiError> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === 'string' && data.error.trim()) {
      return new CommentApiError(data.error, res.status);
    }
  } catch {
    // Ignore non-JSON error bodies and use the fallback message.
  }

  return new CommentApiError(fallbackMessage, res.status);
}

export async function fetchComments(
  postId: string,
  page: number
): Promise<{ data: Comment[]; total: number }> {
  const res = await fetch(`/api/board/posts/${postId}/comments?page=${page}`);
  if (!res.ok) {
    throw await createCommentApiError(res, '댓글 조회 실패');
  }
  return res.json();
}

export async function fetchReplies(
  postId: string,
  parentId: string
): Promise<Comment[]> {
  const res = await fetch(
    `/api/board/posts/${postId}/comments?parent_id=${parentId}`
  );

  if (!res.ok) {
    throw await createCommentApiError(res, '답글 조회 실패');
  }

  return res.json();
}

export async function createComment(
  postId: string,
  payload: { content: string; parent_id: string | null }
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

export async function updateCommentContent(
  postId: string,
  commentId: string,
  content: string
) {
  const res = await fetch(`/api/board/posts/${postId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error('edit failed');
  }
}

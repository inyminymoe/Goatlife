import { Comment } from '@/types/board';

export async function fetchComments(
  postId: string,
  page: number
): Promise<Comment[]> {
  const res = await fetch(`/api/board/posts/${postId}/comments?page=${page}`);
  if (!res.ok) {
    throw new Error('댓글 조회 실패');
  }
  return res.json();
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

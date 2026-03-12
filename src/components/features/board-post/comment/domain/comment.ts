import type { Comment } from '@/types/board';

export function sortComments(comments: Comment[]): Comment[] {
  return [...comments].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) {
      return -1;
    }
    if (!a.is_pinned && b.is_pinned) {
      return 1;
    }
    return 0;
  });
}

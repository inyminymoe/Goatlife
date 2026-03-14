import { Comment } from '@/types/board';

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

export type CommentWithReplies = Comment & { replies: Comment[] };

export function groupComments(comments: Comment[]): CommentWithReplies[] {
  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (!c.parent_id) {
      return acc;
    }
    acc[c.parent_id] = [...(acc[c.parent_id] ?? []), c];
    return acc;
  }, {});

  return sortComments(topLevel).map(c => ({
    ...c,
    replies: repliesMap[c.id] ?? [],
  }));
}

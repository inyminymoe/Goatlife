import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
}

export type Comment = {
  id: number;
  userName: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-grey-500">
        첫 댓글을 작성해보세요!
      </div>
    );
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-0 pb-5">
      {sortedComments.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}

import { CommentItem } from './CommentItem';
import { Comment } from '@/types/board';
import { sortComments } from './domain/comment';

interface CommentListProps {
  comments: Comment[];
  isLoading?: boolean;
  postId: string;
  postAuthorId: string;
  onDeleteComment?: (commentId: string, parentId?: string) => void;
  onPinComment?: (commentId: string, is_pinned: boolean) => void;
}

export function CommentList({
  comments,
  isLoading,
  postId,
  postAuthorId,
  onDeleteComment,
  onPinComment,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center text-grey-500">
        댓글을 불러오는 중...
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-grey-500">
        첫 댓글을 작성해보세요!
      </div>
    );
  }

  const sortedComments = sortComments([...comments]);

  return (
    <div className="space-y-0 pb-5">
      {sortedComments.map(comment => (
        <CommentItem
          key={comment.id}
          {...comment}
          postId={postId}
          postAuthorId={postAuthorId}
          onDelete={onDeleteComment}
          onPin={onPinComment}
        />
      ))}
    </div>
  );
}

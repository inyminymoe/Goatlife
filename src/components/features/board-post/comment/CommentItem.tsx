import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { parseTextWithLinks } from './ParserTextWithLinks';
import { formatDate } from '@/lib/formatDate';
import { Comment } from '@/types/board';
import { CommentActionMenu } from './CommentActionMenu';

type CommentItemProps = Comment & {
  postAuthorId: string;
  onDelete?: (commentId: string) => void;
  onPin?: (commentId: string, is_pinned: boolean) => void;
};

export function CommentItem({
  id,
  user_id,
  image_urls,
  author_name,
  content,
  created_at,
  is_pinned,
  postAuthorId,
  onDelete,
  onPin,
}: CommentItemProps) {
  return (
    <div
      className={cn(
        'pl-6 py-4 border-b border-grey-200 w-full',
        is_pinned ? 'bg-accent-orange-100' : undefined
      )}
    >
      <div className="flex justify-between mb-3">
        <div className="flex flex-1 items-center gap-2">
          <Avatar name={author_name ?? '익명'} size="sm" />
          <p className="text-xs text-grey-500">{formatDate(created_at)}</p>
        </div>
        <div className="flex items-center">
          <p className="text-xs text-grey-500">답글</p>
          <CommentActionMenu
            commentId={id}
            commentAuthorId={user_id}
            postAuthorId={postAuthorId}
            isPinned={is_pinned}
            onDelete={() => onDelete?.(id)}
            onPin={onPin}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {is_pinned && (
          <Badge variant="blue" size="xs">
            고정댓글
          </Badge>
        )}
        {parseTextWithLinks(content)}
      </div>
      {image_urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {image_urls.map((url, i) => (
            <div
              key={i}
              className="size-20 overflow-hidden border border-dark rounded-lg"
            >
              <img
                src={url}
                alt={`comment-image-${i}`}
                className="size-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

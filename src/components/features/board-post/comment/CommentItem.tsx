import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { parseTextWithLinks } from './ParserTextWithLinks';
import { formatDate } from '@/lib/formatDate';
import IconButton from '@/components/ui/IconButton';

interface CommentItemProps {
  id: number;
  userName: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
}

export function CommentItem({
  userName,
  content,
  createdAt,
  isPinned,
}: CommentItemProps) {
  return (
    <div
      className={cn(
        'pl-6 py-4 border-b border-grey-200 w-full',
        isPinned ? 'bg-accent-orange-100' : undefined
      )}
    >
      <div className="flex justify-between mb-3">
        <div className="flex flex-1 items-center gap-2">
          <Avatar name={userName} size="sm" />
          <p className="text-xs text-grey-500">{formatDate(createdAt)}</p>
        </div>

        <div className="flex items-center">
          <p className="text-xs text-grey-500">답글</p>
          {/* TODO: 버튼 클릭시 드롭다운 */}
          <IconButton icon="icon-park:more-one" variant="ghost" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPinned ? (
          <Badge variant="blue" size="xs">
            고정댓글
          </Badge>
        ) : null}

        {parseTextWithLinks(content)}
      </div>
    </div>
  );
}

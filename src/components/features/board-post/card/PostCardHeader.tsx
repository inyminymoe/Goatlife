'use client';

import Badge from '@/components/ui/Badge';
import { getRelativeTimeString } from '@/lib/dateUtils';
import { PostForView } from '@/types/board';
import { PostActionMenu } from './PostActionMenu';

type PostCardHeaderProps = Pick<
  PostForView,
  | 'id'
  | 'topic'
  | 'title'
  | 'commentCount'
  | 'userName'
  | 'viewCount'
  | 'dateCreated'
  | 'dateUpdated'
  | 'scope'
  | 'board'
  | 'dept'
> & { isAuthor: boolean };

export default function PostCardHeader({
  id,
  topic,
  title,
  commentCount,
  userName,
  viewCount,
  dateCreated,
  dateUpdated,
  isAuthor,
  scope,
  board,
  dept,
}: PostCardHeaderProps) {
  const formatViewCount = viewCount >= 9999 ? '9999+' : viewCount;
  const formatDate = getRelativeTimeString(dateCreated);

  const isUpdated = dateCreated !== dateUpdated;
  const formatUpdatedDate = isUpdated
    ? getRelativeTimeString(dateUpdated)
    : null;

  return (
    <div className="space-y-3 mb-9 pl-6">
      <div className="flex justify-between items-center">
        <Badge variant="blue" size="xs" className="text-[12px]">
          {topic}
        </Badge>
        <PostActionMenu
          postId={id}
          isAuthor={isAuthor}
          scope={scope}
          board={board}
          dept={dept}
          onDelete={() => {
            /* TODO: 삭제 핸들러 */
          }}
          onReport={() => {
            /* TODO: 신고 핸들러 */
          }}
        />
      </div>

      <div className="flex gap-2 mb-[10px] items-center">
        <strong className="text-xl font-semibold text-fixed-grey-900">
          {title}
        </strong>
      </div>

      <div className="flex items-center gap-5 text-xs text-grey-500">
        <span className="font-medium">{userName}</span>
        <span>👀 {formatViewCount}</span>
        <span>{formatDate} 작성</span>
        {formatUpdatedDate && <span>{formatUpdatedDate} 수정됨</span>}
        <span className="font-semibold text-primary-500">
          💬 {commentCount}
        </span>
      </div>
    </div>
  );
}

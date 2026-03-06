'use client';
import Badge from '@/components/ui/Badge';
import IconButton from '@/components/ui/IconButton';
import { getRelativeTimeString } from '@/lib/dateUtils';

interface BoardPostHeaderProps {
  id: string;
  topic: string;
  title: string;
  commentCount: number;
  userName: string;
  viewCount: number;
  dateCreated: string;
}

export default function PostCardHeader({
  topic,
  title,
  commentCount,
  userName,
  viewCount,
  dateCreated,
}: BoardPostHeaderProps) {
  const formatViewCount = viewCount >= 9999 ? '9999+' : viewCount;
  const formatDate = getRelativeTimeString(dateCreated);

  return (
    <div className="space-y-3 mb-9 pl-6">
      <div className="flex justify-between items-center">
        <Badge variant="blue" size="xs" className="text-[12px]">
          {topic}
        </Badge>
        {/* TODO: 버튼 클릭시 드롭다운 */}
        <IconButton icon="icon-park:more-one" variant="ghost" />
      </div>
      <div className="flex gap-2 mb-[10px] items-center">
        <strong className="font-[20px]">{title}</strong>
      </div>
      <div className="flex items-center gap-5 text-xs text-grey-500">
        <span className="font-medium">{userName}</span>
        <span>👀{formatViewCount}</span>
        <span>{formatDate}</span>
        <span className="font-semibold text-primary-500">💬{commentCount}</span>
      </div>
    </div>
  );
}

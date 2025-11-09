'use client';

import Badge from '@/components/ui/Badge';

interface BoardItemProps {
  id: number;
  label: string;
  title: string;
  commentCount: number;
  userName: string;
  viewCount: number;
  dateCreated: string;
}

export default function BoardItem({
  label,
  title,
  commentCount,
  userName,
  viewCount,
  dateCreated,
}: BoardItemProps) {
  const formatViewCount = viewCount >= 9999 ? '9999+' : viewCount;

  return (
    <div className="py-3 border-t border-t-grey-200 last:border-b last:border-b-grey-200">
      <div className="flex gap-2 mb-[10px] items-center">
        <Badge variant="blue" size="xs" className="text-[12px]">
          {label}
        </Badge>

        <strong className="font-medium">{title}</strong>

        <span className="font-semibold text-primary-500">[{commentCount}]</span>
      </div>
      <div className="flex items-center gap-5 text-xs text-grey-500">
        <span className="font-medium">{userName}</span>
        <span>👀{formatViewCount}</span>
        <span>{dateCreated}</span>
      </div>
    </div>
  );
}

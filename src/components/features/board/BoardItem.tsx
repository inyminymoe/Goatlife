'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface BoardItemProps {
  id: string;
  topic: string;
  title: string;
  commentCount: number;
  userName: string;
  viewCount: number;
  dateCreated: string;
  href?: string;
}

export default function BoardItem({
  topic,
  title,
  commentCount,
  userName,
  viewCount,
  dateCreated,
  href,
}: BoardItemProps) {
  const formatViewCount = viewCount >= 9999 ? '9999+' : viewCount;

  const content = (
    <div className="py-3 border-t border-t-grey-200 last:border-b last:border-b-grey-200">
      <div className="flex gap-2 mb-[10px] items-center">
        <Badge variant="blue" size="xs" className="text-[12px]">
          {topic}
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

  if (!href) return content;

  return (
    <Link
      href={href}
      className="block hover:bg-grey-50 transition-colors rounded-[4px]"
    >
      {content}
    </Link>
  );
}

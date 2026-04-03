'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Icon } from '@iconify/react';
import { useBookmarkMutation } from './hooks/useBookmarkMutation';

interface MyPostCardProps {
  id: string;
  topic: string;
  title: string;
  userName: string;
  dateCreated: string;
  href?: string;
  showBookmark?: boolean;
}

export default function MyPostCard({
  id,
  title,
  userName,
  topic,
  dateCreated,
  href,
  showBookmark = false,
}: MyPostCardProps) {
  const { isBookmarked, isPending, removeBookmark } = useBookmarkMutation(id);

  return (
    <Link
      href={href || '#'}
      className="block hover:bg-grey-50 transition-colors rounded-[4px]"
    >
      <div className="py-3 border-t border-t-grey-200 last:border-b last:border-b-grey-200">
        <div className="flex mb-[10px] items-center">
          <div className="flex-1">
            <Badge variant="blue" size="xs" className="text-[12px] mr-2">
              {topic}
            </Badge>
            <strong className="font-medium">{title}</strong>
          </div>

          {showBookmark && (
            <Button
              variant="ghost"
              type="button"
              size="sm"
              disabled={isPending}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                removeBookmark();
              }}
            >
              <Icon
                icon={
                  isBookmarked
                    ? 'material-symbols:bookmark-rounded'
                    : 'material-symbols:bookmark-outline-rounded'
                }
                className="size-5 text-primary-500"
              />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-5 text-xs text-grey-500">
          <span className="font-medium">{userName}</span>
          <span>{dateCreated}</span>
        </div>
      </div>
    </Link>
  );
}

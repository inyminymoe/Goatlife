'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface MyCommentCardProps {
  postTopic: string;
  postTitle: string;
  postHref: string;
  content: string;
  authorName: string;
  dateCreated: string;
}

export default function MyCommentCard({
  postTopic,
  postTitle,
  postHref,
  content,
  authorName,
  dateCreated,
}: MyCommentCardProps) {
  return (
    <Link
      href={postHref}
      className="block hover:bg-grey-50 transition-colors rounded-[4px]"
    >
      <div className="py-3 border-t border-t-grey-200 last:border-b last:border-b-grey-200">
        <div className="flex mb-[10px] items-center">
          <Badge variant="blue" size="xs" className="text-[12px] mr-2">
            {postTopic}
          </Badge>
          <strong className="font-medium">{postTitle}</strong>
        </div>
        <div className="pl-4 py-2 border-l-2 border-grey-200 text-sm text-dark mb-2">
          {content}
        </div>
        <div className="flex items-center gap-5 text-xs text-grey-500">
          <span className="font-medium">{authorName}</span>
          <span>{dateCreated}</span>
        </div>
      </div>
    </Link>
  );
}

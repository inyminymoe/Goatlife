'use client';

import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { MyActivityComment } from '@/app/my/_actions/myActivity';

type MyPostCardCommentProps = Omit<
  MyActivityComment,
  'id' | 'created_at' | 'post' | 'post_id'
>;
interface MyPostCardProps {
  id: string;
  topic: string;
  title: string;
  userName: string;
  dateCreated: string;
  href?: string;
  content?: MyPostCardCommentProps;
}

export default function MyPostCard({
  title,
  userName,
  topic,
  dateCreated,
  href,
  content,
}: MyPostCardProps) {
  return (
    <Link
      href={href || '#'}
      className="block hover:bg-grey-50 transition-colors rounded-[4px]"
    >
      <div className="py-3 border-t border-t-grey-200 last:border-b last:border-b-grey-200">
        <div className="flex gap-2 mb-[10px] items-center">
          <Badge variant="blue" size="xs" className="text-[12px]">
            {topic}
          </Badge>
          <strong className="font-medium">{title}</strong>
        </div>
        <div className="flex items-center gap-5 text-xs text-grey-500">
          <span className="font-medium">{userName}</span>
          <span>{dateCreated}</span>
        </div>
      </div>
      {content ? <MyPostCardComment {...content} /> : null}
    </Link>
  );
}

const MyPostCardComment = ({
  content,
  author_name,
}: MyPostCardCommentProps) => {
  return (
    <div className="pl-6 py-3 flex gap-2 items-center">
      <span className="text-sm font-medium text-dark">{author_name}</span>
      <span>{content}</span>
    </div>
  );
};

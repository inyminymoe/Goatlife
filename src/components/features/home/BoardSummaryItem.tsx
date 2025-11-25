import Link from 'next/link';
import { getRelativeTimeString } from '@/lib/dateUtils';
import type { MainBoardPostSummary } from '@/types/home';

type BoardSummaryItemProps = {
  post: MainBoardPostSummary;
};

export function BoardSummaryItem({ post }: BoardSummaryItemProps) {
  // 게시글 상세 페이지 URL 생성
  const postUrl =
    post.scope === 'company'
      ? `/board/${post.id}?scope=company&board=${encodeURIComponent(post.categoryName)}`
      : `/board/${post.id}?scope=department&dept=${encodeURIComponent(post.categoryName)}`;

  return (
    <Link
      href={postUrl}
      className="flex items-center justify-between gap-2 hover:bg-grey-50 transition-colors rounded px-1 py-1"
    >
      <span className="text-grey-500 text-base truncate flex-1">
        {post.title}
      </span>
      <span className="text-grey-500 text-sm whitespace-nowrap flex-shrink-0 text-right min-w-[80px]">
        {getRelativeTimeString(post.createdAt)}
      </span>
    </Link>
  );
}

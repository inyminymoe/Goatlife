'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import MyActivityTabs from './MyActivityTabs';
import MyPostCard from './MyPostCard';
import Pagination from '@/components/ui/Pagination';
import { ActivityKeys } from '@/app/my/page';
import {
  MyActivityPost,
  MyActivityComment,
} from '@/app/my/_actions/myActivity';
import { formatDate } from '@/lib/dateUtils';

const ACTIVITY_ITEMS: { key: ActivityKeys; label: string }[] = [
  { key: 'bookmarks', label: '북마크' },
  { key: 'likes', label: '좋아요' },
  { key: 'boards', label: '내가 쓴 글' },
  { key: 'comments', label: '내 댓글' },
];

const ITEMS_PER_PAGE = 15;

const EMPTY_MESSAGES: Record<ActivityKeys, string> = {
  bookmarks: '아직 저장한 글이 없어요',
  likes: '아직 좋아요한 글이 없어요',
  boards: '아직 작성한 글이 없어요',
  comments: '아직 작성한 댓글이 없어요',
};

function buildPostHref(post: {
  id: string;
  scope: string;
  board: string | null;
  dept: string | null;
}) {
  const params = new URLSearchParams();
  params.set('scope', post.scope);
  if (post.board) params.set('board', post.board);
  if (post.dept) params.set('dept', post.dept);
  return `/board/${post.id}?${params.toString()}`;
}

type Props = {
  category: ActivityKeys;
  items: MyActivityPost[] | MyActivityComment[];
  total: number;
  page: number;
};

export const MyActivityList = ({ category, items, total, page }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleCategoryClick = (key: ActivityKeys) => {
    router.push(`/my?category=${key}`);
  };

  const handlePageChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', nextPage.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <h2 className="brand-h3 text-grey-900 mb-4">내 활동</h2>

      <div className="flex items-center flex-wrap gap-3 mb-4">
        <MyActivityTabs
          categories={ACTIVITY_ITEMS}
          selectedCategory={category}
          onCategoryClick={handleCategoryClick}
        />
      </div>

      <div className="grow">
        {items.length === 0 ? (
          <p>{EMPTY_MESSAGES[category]}</p>
        ) : category === 'comments' ? (
          (items as MyActivityComment[]).map(item => (
            <MyPostCard
              key={item.id}
              id={item.post.id}
              topic={item.post.topic}
              title={item.post.title}
              userName={item.post.author_name}
              dateCreated={formatDate(item.post.created_at)}
              href={buildPostHref(item.post)}
              content={{
                content: item.content,
                author_name: item.author_name,
              }}
            />
          ))
        ) : (
          (items as MyActivityPost[]).map(item => (
            <MyPostCard
              key={item.id}
              id={item.id}
              topic={item.topic}
              title={item.title}
              userName={item.author_name}
              dateCreated={formatDate(item.created_at)}
              href={buildPostHref(item)}
            />
          ))
        )}
      </div>

      <div className="mt-8">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
};

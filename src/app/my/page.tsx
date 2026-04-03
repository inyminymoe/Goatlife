import { notFound } from 'next/navigation';
import { MyActivityList } from '@/components/features/my/MyActivityList';
import {
  getMyBookmarks,
  getMyLikedPosts,
  getMyPosts,
  getMyComments,
} from './_actions/myActivity';

interface MyPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export type ActivityKeys = 'bookmarks' | 'likes' | 'boards' | 'comments';

const VALID_CATEGORIES: ActivityKeys[] = [
  'bookmarks',
  'likes',
  'boards',
  'comments',
];

function parseCategory(value: unknown): ActivityKeys {
  if (VALID_CATEGORIES.includes(value as ActivityKeys)) {
    return value as ActivityKeys;
  }
  notFound();
}

function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = (await searchParams) || {};
  const category = parseCategory(params.category);
  const page = parsePage(params.page);

  const result = await (category === 'bookmarks'
    ? getMyBookmarks(page)
    : category === 'likes'
      ? getMyLikedPosts(page)
      : category === 'boards'
        ? getMyPosts(page)
        : getMyComments(page));

  return (
    <main className="bg-grey-100 rounded-[5px] px-[25px] py-5 mb-5 col-span-2">
      <MyActivityList
        category={category}
        items={result.items}
        total={result.total}
        page={page}
      />
    </main>
  );
}

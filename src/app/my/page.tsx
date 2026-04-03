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

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = (await searchParams) || {};
  const category = (params.category as ActivityKeys) || 'bookmarks';
  const page = typeof params.page === 'string' ? Number(params.page) || 1 : 1;

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

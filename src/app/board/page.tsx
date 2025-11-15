export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import BoardListView from '@/components/features/board/BoardListView';

type BoardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = (await searchParams) ?? {};

  const scopeParam =
    typeof params.scope === 'string' ? params.scope : 'company';
  const boardParam =
    typeof params.board === 'string'
      ? params.board
      : typeof params.tboard === 'string'
        ? params.tboard
        : '';
  const deptParam = typeof params.dept === 'string' ? params.dept : '';

  const boardQueryForFetch = {
    scope: scopeParam,
    board: boardParam,
    dept: deptParam,
    tags: params.tag,
    keyword: params.keyword,
    page: params.page,
  };

  // NOTE: API 연동 시 위 boardQueryForFetch 값을 서버 액션(fetchBoardPosts 등)에 전달하고,
  //       응답 리스트를 <BoardListView initialItems={posts} /> 형태로 내려주면 된다.
  void boardQueryForFetch;

  return (
    <main className="bg-grey-100 rounded-[5px] px-[25px] py-5 mb-5 col-span-2">
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="h-6 w-40 bg-grey-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 gap-3">
              <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
              <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
              <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
            </div>
          </div>
        }
      >
        <BoardListView />
      </Suspense>
    </main>
  );
}

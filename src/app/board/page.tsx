export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import BoardListView from '@/components/features/board/BoardListView';

export default function BoardPage() {
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

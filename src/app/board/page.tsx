export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import BoardListView from '@/components/features/board/BoardListView';

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <section className="p-6 bg-grey-100 rounded-[5px]">
          <div className="h-6 w-40 bg-grey-200 rounded animate-pulse" />
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
            <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
            <div className="h-24 bg-grey-100 outline outline-1 outline-grey-200 rounded animate-pulse" />
          </div>
        </section>
      }
    >
      <BoardListView />
    </Suspense>
  );
}

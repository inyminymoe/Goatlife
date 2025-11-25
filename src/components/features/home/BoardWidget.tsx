import { Icon } from '@iconify/react';
import { BoardSummaryItem } from './BoardSummaryItem';
import type { MainBoardPostSummary } from '@/types/home';

type BoardWidgetProps = {
  posts: MainBoardPostSummary[];
};

export function BoardWidget({ posts }: BoardWidgetProps) {
  return (
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon
          icon="icon-park:message-emoji"
          className="w-6 h-6 text-primary-500"
        />
        <h2 className="brand-h3 text-grey-900">게시판</h2>
      </div>

      <div className="flex flex-col gap-2">
        {posts.length === 0 ? (
          <p className="body-base text-grey-500">최신 글이 없습니다.</p>
        ) : (
          posts.map(post => <BoardSummaryItem key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}

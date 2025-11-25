import { Icon } from '@iconify/react';
import { BoardSummaryItem } from './BoardSummaryItem';
import type { MainBoardPostSummary } from '@/types/home';

type AnnouncementsWidgetProps = {
  posts: MainBoardPostSummary[];
};

export function AnnouncementsWidget({ posts }: AnnouncementsWidgetProps) {
  return (
    <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px] flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Icon
          icon="icon-park:message-emoji"
          className="w-6 h-6 text-primary-500"
        />
        <h2 className="brand-h3 text-grey-900">공지사항</h2>
      </div>

      <div className="flex flex-col gap-3">
        {posts.length === 0 ? (
          <p className="body-base text-grey-500">최신 공지사항이 없습니다.</p>
        ) : (
          posts.map(post => <BoardSummaryItem key={post.id} post={post} />)
        )}
      </div>
    </section>
  );
}

import Link from 'next/link';
import { PostCard } from './card/PostCard';
import { PostForView } from '@/types/board';

interface BoardPostViewProps {
  post: PostForView;
  listHref: string;
  isAuthor: boolean;
  isAdmin: boolean;
}

export function BoardPostView({
  post,
  listHref,
  isAuthor,
  isAdmin,
}: BoardPostViewProps) {
  return (
    <div className="bg-grey-100 mb-5 rounded-[5px] py-5">
      <div className="flex justify-between pb-4 mb-4 border-b border-b-grey-200 px-6">
        <h2 className="brand-h3 text-dark mb-4">{post.boardLabel}</h2>
        <Link
          href={listHref}
          className="inline-flex items-center justify-center py-2 px-6 bg-primary-500 text-white rounded-[5px] body-sm font-medium hover:bg-primary-900 transition-colors"
        >
          목록보기
        </Link>
      </div>
      <PostCard post={post} isAuthor={isAuthor} isAdmin={isAdmin} />
    </div>
  );
}

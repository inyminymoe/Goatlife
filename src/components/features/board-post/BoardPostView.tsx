'use client';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { PostCard } from './card/PostCard';

interface BoardPostViewProps {
  post: {
    id: string;
    topic: string;
    title: string;
    commentCount: number;
    userName: string;
    viewCount: number;
    dateCreated: string;
    content: string;
    hashtags: string[];
    boardLabel: string;
  };
  listHref: string;
}

export function BoardPostView({ post, listHref }: BoardPostViewProps) {
  const router = useRouter();

  return (
    <>
      <div className="bg-grey-100 mb-5 rounded-[5px] py-5">
        <div className="flex justify-between pb-4 mb-4 border-b border-b-[#EAEAEA] px-6">
          <h2 className="brand-h3 text-grey-900 mb-4">{post.boardLabel}</h2>
          <Button
            variant="primary"
            className="py-2 px-6"
            onClick={() => router.push(listHref)}
          >
            목록보기
          </Button>
        </div>

        <PostCard post={post} />
      </div>
    </>
  );
}

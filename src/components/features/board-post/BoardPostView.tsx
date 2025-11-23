'use client';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { PostCard } from './card/PostCard';

interface BoardPostViewProps {
  postId: string;
}

export function BoardPostView({ postId }: BoardPostViewProps) {
  const router = useRouter();

  return (
    <>
      <div className="bg-grey-100 mb-5 rounded-[5px] py-5">
        <div className="flex justify-between pb-4 mb-4 border-b border-b-[#EAEAEA] px-6">
          <h2 className="brand-h3 text-grey-900 mb-4">IT부</h2>
          <Button
            variant="primary"
            className="py-2 px-6"
            onClick={() => router.push('/board')}
          >
            목록보기
          </Button>
        </div>

        <PostCard />
      </div>
    </>
  );
}

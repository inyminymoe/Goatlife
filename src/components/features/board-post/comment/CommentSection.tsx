'use client';

import Pagination from '@/components/ui/Pagination';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { useRouter, useSearchParams } from 'next/navigation';

interface CommentSectionProps {
  postId: string;
  commentCount: number;
}

export type Comment = {
  id: number;
  userName: string;
  content: string;
  createdAt: string;
  isPinned?: boolean;
  externalLink?: string;
};

const COMMENTS_PER_PAGE = 10;

const mockComments = [
  {
    id: 1,
    userName: '박',
    content: '회의실 입장하기 https://discord.gg/abc 참석 부탁드려요',
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
  {
    id: 2,
    userName: '김경성',
    content: '여기로 오세요~~https://discord.gg/abc',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
  {
    id: 3,
    userName: '강인용',
    content: '지원완료🫡',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
  {
    id: 4,
    userName: '강윤경',
    content: '지원완료🫡',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
  },
  {
    id: 5,
    userName: '박사원',
    content: '지원완료🫡',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isPinned: false,
  },
  {
    id: 6,
    userName: '김재즈',
    content: '지원완료🫡',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
  },
  {
    id: 7,
    userName: '이흥신',
    content: '지원완료🫡',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
  },
  {
    id: 8,
    userName: '강인턴',
    content: '지원완료🫡',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
  {
    id: 9,
    userName: '강인턴',
    content: '지원완료🫡',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
  {
    id: 10,
    userName: '강인턴',
    content: '지원완료🫡',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
  {
    id: 11,
    userName: '강인턴',
    content: '지원완료🫡',
    createdAt: new Date().toISOString(),
    isPinned: false,
  },
];

export function CommentSection({ postId, commentCount }: CommentSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 현재 URL의 쿼리에서 commentPage 읽기
  const currentPage = Number(searchParams.get('commentPage')) || 1;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('commentPage', page.toString());
    // 같은 페이지에서 URL만 변경
    // /board/123 → /board/123?commentPage=2
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // TODO: commentPage가 바뀔 때마다 댓글 새로 불러오기 api refetching

  const handleCommentAdded = () => {
    // 댓글 작성 후 1페이지로 이동 & 리페칭
    const params = new URLSearchParams(searchParams);
    params.set('commentPage', '1');
    router.push(`?${params.toString()}`);
  };

  const totalPages = Math.ceil(commentCount / COMMENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const endIndex = startIndex + COMMENTS_PER_PAGE;
  const currentList = mockComments.slice(startIndex, endIndex);

  return (
    <section className="bg-grey-100 rounded-[5px]">
      <div className="px-6 py-5">
        <h3 className="text-grey-900 mb-6 font-medium">
          댓글 <span className="text-primary-500">{commentCount}</span>
        </h3>

        <CommentInput postId={postId} onCommentAdded={handleCommentAdded} />
      </div>

      <div className="mb-8 grow-1">
        {currentList.length === 0 ? (
          <p className="px-6">등록된 댓글이 없습니다.</p>
        ) : (
          <CommentList comments={currentList} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}

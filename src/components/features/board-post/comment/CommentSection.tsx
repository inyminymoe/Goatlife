'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Pagination from '@/components/ui/Pagination';
import { CommentInput } from './CommentInput';
import { CommentList } from './CommentList';
import { useCommentActions } from './application/useCommentActions';
import { fetchComments } from './api/commentApi';

const COMMENTS_PER_PAGE = 10;

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  commentCount: number;
}

export function CommentSection({
  postId,
  postAuthorId,
  commentCount: initialCommentCount,
}: CommentSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: commentsResult, isLoading } = useQuery({
    queryKey: ['comments', postId, currentPage],
    queryFn: () => fetchComments(postId, currentPage),
  });

  const comments = commentsResult?.data ?? [];
  const rootCommentTotal = commentsResult?.total ?? 0;

  const { commentCount, handleDelete, handlePin, handleCommentAdded } =
    useCommentActions(postId, initialCommentCount);

  const onCommentAdded = () => {
    handleCommentAdded();
    setCurrentPage(1);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  // rootCommentTotal: 루트 댓글만의 수 (답글 제외) — API가 parent_id IS NULL로 필터링한 count
  // commentCount(전체)를 쓰면 답글 포함으로 totalPages가 부풀어 빈 페이지가 생김
  const totalPages = Math.ceil(rootCommentTotal / COMMENTS_PER_PAGE);

  return (
    <section className="bg-grey-100 rounded-[5px]">
      <div className="px-6 py-5">
        <h3 className="text-grey-900 mb-6 font-medium">
          댓글 <span className="text-primary-500">{commentCount}</span>
        </h3>
        <CommentInput postId={postId} onCommentAdded={onCommentAdded} />
      </div>

      <div className="mb-8 grow-1">
        <CommentList
          comments={comments}
          isLoading={isLoading}
          postId={postId}
          postAuthorId={postAuthorId}
          onDeleteComment={handleDelete}
          onPinComment={handlePin}
          onReplyAdded={handleCommentAdded}
        />
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-5">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </section>
  );
}

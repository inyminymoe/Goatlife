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

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId, currentPage],
    queryFn: () => fetchComments(postId, currentPage),
  });

  const { commentCount, handleDelete, handlePin, handleCommentAdded } =
    useCommentActions(postId, initialCommentCount);

  const onCommentAdded = () => {
    handleCommentAdded();
    setCurrentPage(1); // 댓글 추가 후 1페이지로
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  const totalPages = Math.ceil(commentCount / COMMENTS_PER_PAGE);

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
          postId={postId}
          postAuthorId={postAuthorId}
          onDeleteComment={handleDelete}
          onPinComment={handlePin}
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

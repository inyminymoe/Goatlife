import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { deleteComment, patchComment } from '../api/commentApi';

export function useCommentActions(postId: string, initialCommentCount: number) {
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const queryClient = useQueryClient();
  const toast = useToast();

  const deleteMutation = useMutation({
    mutationFn: ({
      commentId,
      parentId,
    }: {
      commentId: string;
      parentId?: string;
    }) => deleteComment(postId, commentId),
    onSuccess: (_data, variables) => {
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: ['replies', variables.parentId],
        });
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
    },
    onError: () => toast.error('잠시 후 다시 시도해주세요.'),
  });

  const pinMutation = useMutation({
    mutationFn: ({
      commentId,
      is_pinned,
    }: {
      commentId: string;
      is_pinned: boolean;
    }) => patchComment(postId, commentId, { is_pinned }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['comments', postId] }),
    onError: () => toast.error('잠시 후 다시 시도해주세요.'),
  });

  const handleDelete = (commentId: string, parentId?: string) => {
    if (!parentId) {
      setCommentCount(prev => Math.max(prev - 1, 0));
    }
    deleteMutation.mutate(
      { commentId, parentId },
      {
        onError: () => {
          if (!parentId) setCommentCount(prev => prev + 1);
        },
      }
    );
  };

  const handlePin = (commentId: string, is_pinned: boolean) => {
    pinMutation.mutate({ commentId, is_pinned });
  };

  const handleCommentAdded = () => {
    setCommentCount(prev => prev + 1);
  };

  return {
    commentCount,
    handleDelete,
    handlePin,
    handleCommentAdded,
  };
}

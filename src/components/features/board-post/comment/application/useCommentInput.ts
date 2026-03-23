import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { createComment } from '../api/commentApi';

interface UseCommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void;
  replyToName?: string | null;
}

export function useCommentInput({
  postId,
  parentId,
  onCommentAdded,
  replyToName,
}: UseCommentInputProps) {
  const initialComment = replyToName?.trim() ? replyToName : '';
  const [content, setContent] = useState(initialComment);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      await createComment(postId, {
        content,
        image_urls: [],
        parent_id: parentId ?? null,
      });
    },
    onSuccess: () => {
      setContent('');
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
      onCommentAdded?.();
    },
    onError: () => {
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;
    mutate({ content });
  };

  return {
    content,
    setContent,
    isPending,
    handleSubmit,
  };
}

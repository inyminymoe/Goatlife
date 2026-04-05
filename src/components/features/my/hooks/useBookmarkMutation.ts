'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';

export function useBookmarkMutation(postId: string) {
  const router = useRouter();
  const toast = useToast();
  const [isBookmarked, setIsBookmarked] = useState(true);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/board/posts/${postId}/bookmark`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('bookmark failed');
    },
    onMutate: () => {
      setIsBookmarked(false);
    },
    onSuccess: () => {
      router.refresh();
    },
    onError: () => {
      setIsBookmarked(true);
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  return { isBookmarked, isPending, removeBookmark: mutate };
}

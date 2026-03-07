'use client';

import Button from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';
import { Icon } from '@iconify/react';
import { useMutation } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface PostActionBarProps {
  postId: string;
  initialLikes: number;
  initialIsLiked: boolean;
  initialIsBookmarked: boolean;
}

export function PostActionBar({
  postId,
  initialLikes,
  initialIsLiked,
  initialIsBookmarked,
}: PostActionBarProps) {
  const pathname = usePathname();
  const toast = useToast();

  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

  const likeMutation = useMutation({
    mutationFn: async (currentIsLiked: boolean) => {
      const res = await fetch(`/api/board/posts/${postId}/like`, {
        method: currentIsLiked ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('like failed');
    },
    onMutate: (currentIsLiked: boolean) => {
      setIsLiked(!currentIsLiked);
      setLikeCount(prev => (currentIsLiked ? prev - 1 : prev + 1));
    },
    onError: (_err, currentIsLiked) => {
      setIsLiked(currentIsLiked);
      setLikeCount(prev => (currentIsLiked ? prev + 1 : prev - 1));
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (currentIsBookmarked: boolean) => {
      const res = await fetch(`/api/board/posts/${postId}/bookmark`, {
        method: currentIsBookmarked ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('bookmark failed');
    },
    onMutate: (currentIsBookmarked: boolean) => {
      setIsBookmarked(!currentIsBookmarked);
    },
    onError: (_err, currentIsBookmarked) => {
      setIsBookmarked(currentIsBookmarked);
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  return (
    <div className="flex gap-2 px-6">
      <Button
        variant="outline"
        type="button"
        size="sm"
        disabled={likeMutation.isPending}
        onClick={() => likeMutation.mutate(isLiked)}
        icon={
          <Icon
            icon={
              isLiked
                ? 'material-symbols:heart-smile-rounded'
                : 'material-symbols:heart-smile-outline-rounded'
            }
            className="size-5 text-primary-500"
          />
        }
      >
        <span>좋아요</span>
        <span className="text-primary-500">{likeCount}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        disabled={bookmarkMutation.isPending}
        onClick={() => bookmarkMutation.mutate(isBookmarked)}
        icon={
          <Icon
            icon={
              isBookmarked
                ? 'material-symbols:bookmark-rounded'
                : 'material-symbols:bookmark-outline-rounded'
            }
            className="size-5 text-primary-500"
          />
        }
      >
        <span>북마크</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        icon={
          <Icon
            icon="material-symbols:share"
            className="size-5 text-primary-500"
          />
        }
        onClick={() => {
          navigator.clipboard
            .writeText(`${window.location.origin}${pathname}`)
            .then(() => toast.success('클립보드에 복사되었어요!'))
            .catch(() => toast.error('링크 복사에 실패했어요'));
        }}
      >
        <span>공유하기</span>
      </Button>
    </div>
  );
}

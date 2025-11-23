'use client';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface PostActionBarProps {
  likes: number;
}

export function PostActionBar({ likes }: PostActionBarProps) {
  const pathname = usePathname();
  const [isToastOpen, setIsToastOpen] = useState(false);
  return (
    <>
      <Toast
        show={isToastOpen}
        message="클립보드에 복사되었습니다!"
        onClose={() => {
          setIsToastOpen(false);
        }}
      />
      <div className="flex gap-2 px-6">
        <Button
          variant="outline"
          size="sm"
          icon={
            <Icon
              icon="material-symbols:heart-smile-outline-rounded"
              className="size-5 text-primary-500"
            />
          }
        >
          <span>좋아요</span>
          <span className="text-primary-500">{likes}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={
            <Icon
              icon="material-symbols:bookmark-outline-rounded"
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
            const fullUrl = `${window.location.origin}${pathname}`;
            navigator.clipboard
              .writeText(fullUrl)
              .then(() => setIsToastOpen(true));
          }}
        >
          <span>공유하기</span>
        </Button>
      </div>
    </>
  );
}

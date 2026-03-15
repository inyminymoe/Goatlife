'use client';

import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import IconButton from '@/components/ui/IconButton';

interface PostActionMenuProps {
  postId: string;
  isAuthor: boolean;
  scope: string;
  board?: string;
  dept?: string;
  onDelete: () => void;
  onReport: () => void;
}

export function PostActionMenu({
  postId,
  isAuthor,
  scope,
  board,
  dept,
  onDelete,
  onReport,
}: PostActionMenuProps) {
  const router = useRouter();

  const editHref = `/board/edit/${postId}?scope=${scope}${
    board ? `&board=${encodeURIComponent(board)}` : ''
  }${dept ? `&dept=${encodeURIComponent(dept)}` : ''}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton
          icon="icon-park:more-one"
          variant="ghost"
          className="icon-dark-invert"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent placement="bottom-end" className="w-28">
        {isAuthor ? (
          <>
            <DropdownMenuItem onClick={() => router.push(editHref)}>
              수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>삭제</DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={onReport}>신고</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

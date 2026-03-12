'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import IconButton from '@/components/ui/IconButton';
import { useUserInfo } from '@/hooks/useUserInfo';
import { userAtom } from '@/store/atoms';
import { useAtomValue } from 'jotai';
import { canDeleteComment, canPinComment } from './domain/commentPermissions';

interface CommentActionMenuProps {
  commentId: string;
  commentAuthorId: string;
  postAuthorId: string;
  isPinned: boolean;
  onDelete?: () => void;
  onPin?: (commentId: string, is_pinned: boolean) => void;
}

export function CommentActionMenu({
  commentId,
  commentAuthorId,
  postAuthorId,
  isPinned,
  onDelete,
  onPin,
}: CommentActionMenuProps) {
  const user = useAtomValue(userAtom);
  const showDelete = !!user && canDeleteComment(user.id, commentAuthorId);
  const showPin = !!user && canPinComment(user.id, postAuthorId);

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
        {showPin && (
          <DropdownMenuItem onClick={() => onPin?.(commentId, !isPinned)}>
            {isPinned ? '고정 해제' : '고정'}
          </DropdownMenuItem>
        )}
        {showDelete && (
          <DropdownMenuItem onClick={onDelete}>삭제</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
    <div className="flex flex-col gap-6">
      {showPin && (
        <div onClick={() => onPin?.(commentId, !isPinned)}>
          {isPinned ? '고정 해제' : '고정'}
        </div>
      )}
      {showDelete && <div onClick={onDelete}>삭제</div>}
    </div>
  );
}

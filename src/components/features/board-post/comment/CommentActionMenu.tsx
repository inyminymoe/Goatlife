'use client';

import { userAtom } from '@/store/atoms';
import { useAtomValue } from 'jotai';
import {
  canDeleteComment,
  canEditComment,
  canPinComment,
} from './domain/commentPermissions';

interface CommentActionMenuProps {
  commentId: string;
  commentAuthorId: string;
  postAuthorId: string;
  isPinned: boolean;
  onDelete?: () => void;
  onPin?: (commentId: string, is_pinned: boolean) => void;
  onEdit?: () => void;
}

export function CommentActionMenu({
  commentId,
  commentAuthorId,
  postAuthorId,
  isPinned,
  onDelete,
  onPin,
  onEdit,
}: CommentActionMenuProps) {
  const user = useAtomValue(userAtom);
  const showDelete = !!user && canDeleteComment(user.id, commentAuthorId);
  const showEdit = !!user && canEditComment(user.id, commentAuthorId, isPinned);
  const showPin = !!user && canPinComment(user.id, postAuthorId);

  return (
    <div className="flex flex-col gap-6">
      {showPin && (
        <div onClick={() => onPin?.(commentId, !isPinned)}>
          {isPinned ? '고정 해제' : '고정'}
        </div>
      )}
      {showEdit && <div onClick={onEdit}>수정</div>}
      {showDelete && <div onClick={onDelete}>삭제</div>}
    </div>
  );
}

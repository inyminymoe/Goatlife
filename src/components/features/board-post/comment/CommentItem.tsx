'use client';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { parseTextWithLinks } from './ParserTextWithLinks';
import { formatDate } from '@/lib/formatDate';
import { Comment } from '@/types/board';
import { CommentActionMenu } from './CommentActionMenu';
import {
  canDeleteComment,
  canEditComment,
  canPinComment,
} from './domain/commentPermissions';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchReplies, updateCommentContent } from './api/commentApi';
import { CommentInput } from './CommentInput';
import IconButton from '@/components/ui/IconButton';
import { overlay } from 'overlay-kit';
import BottomSheet from '@/components/ui/BottomSheet';
import { userAtom } from '@/store/atoms';
import { useAtomValue } from 'jotai';
import { useToast } from '@/providers/ToastProvider';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';

type CommentItemProps = Comment & {
  postId: string;
  postAuthorId: string;
  onDelete?: (commentId: string, parentId?: string) => void;
  onPin?: (commentId: string, is_pinned: boolean) => void;
  isReply?: boolean;
  /** 답글 아이템에서 "답글달기" 클릭 시 부모의 입력창을 열도록 위임 */
  onReplyClick?: () => void;
  /** 답글(재답글 포함) 등록 시 상위 댓글 카운트 증가 */
  onReplyAdded?: () => void;
};

export function CommentItem({
  id,
  postId,
  parent_id,
  user_id,
  author_name,
  content,
  created_at,
  is_pinned,
  reply_count,
  postAuthorId,
  onDelete,
  onPin,
  isReply = false,
  onReplyClick,
  onReplyAdded,
}: CommentItemProps) {
  const currentUser = useAtomValue(userAtom);
  const hasMenuAction =
    !!currentUser &&
    (canDeleteComment(currentUser.id, user_id) ||
      canPinComment(currentUser.id, postAuthorId));

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(reply_count);
  const [replyToName, setReplyToName] = useState(author_name);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [localContent, setLocalContent] = useState(content);

  const queryClient = useQueryClient();
  const toast = useToast();

  const { mutate: submitEdit, isPending: isEditPending } = useMutation({
    mutationFn: () => updateCommentContent(postId, id, editContent.trim()),
    onSuccess: () => {
      setLocalContent(editContent.trim());
      setIsEditing(false);
      if (parent_id) {
        queryClient.invalidateQueries({ queryKey: ['replies', parent_id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
    },
    onError: () =>
      toast.error('수정에 실패했습니다. 잠시 후 다시 시도해주세요.'),
  });

  const canEdit =
    !!currentUser && canEditComment(currentUser.id, user_id, is_pinned);

  const { data: replies = [], isFetching } = useQuery({
    queryKey: ['replies', id],
    queryFn: () => fetchReplies(postId, id),
    enabled: showReplies,
  });

  const displayReplyCount =
    showReplies && replies.length > 0 ? replies.length : localReplyCount;

  return (
    <div
      className={cn(
        'pl-6 py-4 border-b border-grey-200 w-full',
        is_pinned ? 'bg-accent-orange-100' : undefined,
        isReply ? 'bg-grey-100 pl-5 border-none' : undefined
      )}
    >
      <div className="flex justify-between mb-3">
        <div className="flex flex-1 items-center gap-2">
          <Avatar size="sm" showName={false} />
          <span className="text-sm font-medium text-dark">
            {author_name ?? '익명'}
          </span>
          <p className="text-xs text-grey-500">{formatDate(created_at)}</p>
        </div>
        <div className="flex items-center">
          <button
            className="text-xs text-grey-500 hover:text-grey-700 transition-colors"
            onClick={() => {
              if (isReply) {
                onReplyClick?.();
              } else {
                setReplyToName(author_name);
                setShowReplyInput(v => !v);
              }
            }}
          >
            답글달기
          </button>
          <IconButton
            icon="icon-park:more-one"
            variant="ghost"
            className={cn('icon-dark-invert', !hasMenuAction && 'invisible')}
            onClick={() =>
              overlay.open(({ isOpen, close, unmount }) => (
                <BottomSheet open={isOpen} onClose={unmount} title="댓글 설정">
                  <CommentActionMenu
                    commentId={id}
                    commentAuthorId={user_id}
                    postAuthorId={postAuthorId}
                    isPinned={is_pinned}
                    onDelete={() => {
                      onDelete?.(id, parent_id ?? undefined);
                      close();
                    }}
                    onPin={(commentId, isPinned) => {
                      onPin?.(commentId, isPinned);
                      close();
                    }}
                    onEdit={
                      canEdit
                        ? () => {
                            setEditContent(localContent);
                            setIsEditing(true);
                            close();
                          }
                        : undefined
                    }
                  />
                </BottomSheet>
              ))
            }
          />
        </div>
      </div>

      {isEditing ? (
        <div className="mr-6">
          <TextArea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            maxLength={1000}
            className="border-grey-200 rounded-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isEditPending}
            >
              취소
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="button"
              disabled={!editContent.trim() || isEditPending}
              onClick={() => submitEdit()}
            >
              {isEditPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {is_pinned && (
            <Badge variant="blue" size="xs">
              고정댓글
            </Badge>
          )}
          {parseTextWithLinks(localContent)}
        </div>
      )}

      {/* 답글 더보기 / 숨기기 */}
      {!isReply && displayReplyCount > 0 && (
        <button
          className="py-2 text-xs text-primary-500 hover:text-primary-700 transition-colors"
          onClick={() => setShowReplies(v => !v)}
        >
          {showReplies ? '답글 숨기기' : `답글 ${displayReplyCount}개 더보기`}
        </button>
      )}

      {/* 답글 목록 */}
      {showReplies && (
        <div>
          {isFetching ? (
            <p className="pl-5 py-2 text-xs text-grey-400">불러오는 중...</p>
          ) : (
            replies.map(reply => (
              <CommentItem
                key={reply.id}
                {...reply}
                postId={postId}
                postAuthorId={postAuthorId}
                onDelete={(commentId, parentId) => {
                  setLocalReplyCount(c => Math.max(c - 1, 0));
                  onDelete?.(commentId, parentId);
                }}
                onPin={onPin}
                isReply={true}
                onReplyClick={() => {
                  setShowReplyInput(v => !v);
                  setReplyToName(reply.author_name);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* 답글 입력창 — 루트 댓글 아래 고정 */}
      {!isReply && showReplyInput && (
        <div className="mt-5 mr-6">
          <CommentInput
            postId={postId}
            parentId={id}
            onCommentAdded={() => {
              setShowReplyInput(false);
              setShowReplies(true);
              setLocalReplyCount(c => c + 1);
              onReplyAdded?.();
            }}
            replyToName={replyToName}
          />
        </div>
      )}
    </div>
  );
}

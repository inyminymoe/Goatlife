'use client';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { parseTextWithLinks } from './ParserTextWithLinks';
import { formatDate } from '@/lib/formatDate';
import { Comment } from '@/types/board';
import { CommentActionMenu } from './CommentActionMenu';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReplies } from './api/commentApi';
import { CommentInput } from './CommentInput';
import IconButton from '@/components/ui/IconButton';
import { overlay } from 'overlay-kit';
import BottomSheet from '@/components/ui/BottomSheet';

type CommentItemProps = Comment & {
  postId: string;
  postAuthorId: string;
  onDelete?: (commentId: string, parentId?: string) => void;
  onPin?: (commentId: string, is_pinned: boolean) => void;
  isReply?: boolean;
  /** 답글 아이템에서 "답글달기" 클릭 시 부모의 입력창을 열도록 위임 */
  onReplyClick?: () => void;
};

export function CommentItem({
  id,
  postId,
  parent_id,
  user_id,
  image_urls,
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
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localReplyCount, setLocalReplyCount] = useState(reply_count);

  const { data: replies = [], isFetching } = useQuery({
    queryKey: ['replies', id],
    queryFn: () => fetchReplies(postId, id),
    enabled: showReplies,
  });

  useEffect(() => {
    if (replies.length > 0) {
      setLocalReplyCount(replies.length);
    }
  }, [replies.length]);

  return (
    <div
      className={cn(
        'pl-6 py-4 border-b border-grey-200 w-full',
        is_pinned ? 'bg-accent-orange-100' : undefined,
        isReply ? 'bg-grey-50 pl-5 border-none' : undefined
      )}
    >
      <div className="flex justify-between mb-3">
        <div className="flex flex-1 items-center gap-2">
          <Avatar name={author_name ?? '익명'} size="sm" />
          <p className="text-xs text-grey-500">{formatDate(created_at)}</p>
        </div>
        <div className="flex items-center">
          <button
            className="text-xs text-grey-500 hover:text-grey-700 transition-colors"
            onClick={() => {
              if (isReply) {
                onReplyClick?.();
              } else {
                setShowReplyInput(v => !v);
              }
            }}
          >
            답글달기
          </button>
          <IconButton
            icon="icon-park:more-one"
            variant="ghost"
            className="icon-dark-invert"
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
                  />
                </BottomSheet>
              ))
            }
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {is_pinned && (
          <Badge variant="blue" size="xs">
            고정댓글
          </Badge>
        )}
        {parseTextWithLinks(content)}
      </div>

      {image_urls.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {image_urls.map((url, i) => (
            <div
              key={i}
              className="size-20 overflow-hidden border border-dark rounded-lg"
            >
              <img
                src={url}
                alt={`comment-image-${i}`}
                className="size-full object-contain"
              />
            </div>
          ))}
        </div>
      )}

      {/* 답글 더보기 / 숨기기 */}
      {!isReply && localReplyCount > 0 && (
        <button
          className="py-2 text-xs text-primary-500 hover:text-primary-700 transition-colors"
          onClick={() => setShowReplies(v => !v)}
        >
          {showReplies ? '답글 숨기기' : `답글 ${localReplyCount}개 더보기`}
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
                onDelete={onDelete}
                onPin={onPin}
                isReply={true}
                onReplyClick={() => setShowReplyInput(v => !v)}
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
            }}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import Badge from '@/components/ui/Badge';
import { getRelativeTimeString } from '@/lib/dateUtils';
import { PostForView } from '@/types/board';
import { PostActionMenu } from './PostActionMenu';
import { useMutation } from '@tanstack/react-query';
import { deleteBoardPost } from '@/app/board/_actions/deleteBoardPost';
import { useRouter } from 'next/navigation';
import { useToast } from '@/providers/ToastProvider';
import Modal from '@/components/ui/Modal';
import { overlay } from 'overlay-kit';
import Button from '@/components/ui/Button';

type PostCardHeaderProps = Pick<
  PostForView,
  | 'id'
  | 'topic'
  | 'title'
  | 'commentCount'
  | 'userName'
  | 'viewCount'
  | 'dateCreated'
  | 'dateUpdated'
  | 'scope'
  | 'board'
  | 'dept'
> & { isAuthor: boolean };

export default function PostCardHeader({
  id,
  topic,
  title,
  commentCount,
  userName,
  viewCount,
  dateCreated,
  dateUpdated,
  isAuthor,
  scope,
  board,
  dept,
}: PostCardHeaderProps) {
  const router = useRouter();
  const toast = useToast();
  const formatViewCount = viewCount >= 9999 ? '9999+' : viewCount;
  const formatDate = getRelativeTimeString(dateCreated);

  const isUpdated = dateCreated !== dateUpdated;
  const formatUpdatedDate = isUpdated
    ? getRelativeTimeString(dateUpdated)
    : null;

  const { mutate: deleteMutate, isPending: deleteMutationPending } =
    useMutation({
      mutationFn: (id: string) => deleteBoardPost(id),
      onSuccess: result => {
        if (!result.ok) {
          toast.error(result.error ?? '게시글 삭제 중 문제가 발생했어요.');
          return;
        }
        router.push('/board');
        toast.success('게시글이 삭제되었어요!');
      },
      onError: error => {
        // 네트워크 오류 등 예외적인 상황
        console.error('BoardPost delete failed', error);
        toast.error(
          '게시글 삭제 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.'
        );
      },
    });

  const handleDelete = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Modal
        open={isOpen}
        onClose={unmount}
        title="게시글을 삭제하시겠어요?"
        description="삭제된 게시글은 복구할 수 없습니다."
        footer={
          <>
            <Button variant="outline" onClick={unmount}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                deleteMutate(id);
                close();
              }}
              disabled={deleteMutationPending}
            >
              삭제
            </Button>
          </>
        }
      >
        <></>
      </Modal>
    ));
  };

  return (
    <div className="space-y-3 mb-9 pl-6">
      <div className="flex justify-between items-center">
        <Badge variant="blue" size="xs" className="text-[12px]">
          {topic}
        </Badge>
        <PostActionMenu
          postId={id}
          isAuthor={isAuthor}
          scope={scope}
          board={board}
          dept={dept}
          onDelete={handleDelete}
          onReport={() => {
            /* TODO: 신고 핸들러 */
          }}
        />
      </div>

      <div className="flex gap-2 mb-[10px] items-center">
        <strong className="text-xl font-semibold text-fixed-grey-900">
          {title}
        </strong>
      </div>

      <div className="flex items-center gap-5 text-xs text-grey-500">
        <span className="font-medium">{userName}</span>
        <span>👀 {formatViewCount}</span>
        <span>{formatDate} 작성</span>
        {formatUpdatedDate && <span>{formatUpdatedDate} 수정됨</span>}
        <span className="font-semibold text-primary-500">
          💬 {commentCount}
        </span>
      </div>
    </div>
  );
}

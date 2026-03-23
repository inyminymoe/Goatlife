'use client';

import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import { useCommentInput } from './application/useCommentInput';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void;
  replyToName?: string | null;
}

export function CommentInput({
  postId,
  parentId,
  onCommentAdded,
  replyToName,
}: CommentInputProps) {
  const { content, setContent, isPending, handleSubmit } = useCommentInput({
    postId,
    parentId,
    onCommentAdded,
    replyToName,
  });

  return (
    <div className="mb-5 rounded-lg">
      <TextArea
        placeholder="최대 1000자 입력"
        maxLength={1000}
        value={content}
        onChange={e => setContent(e.target.value)}
        className="border-grey-200 rounded-none"
      />

      <div className="flex justify-end items-center p-2 bg-dark border border-dark">
        <Button
          variant="primary"
          type="button"
          disabled={!content.trim() || isPending}
          size="sm"
          onClick={handleSubmit}
        >
          {isPending ? '등록 중...' : '등록'}
        </Button>
      </div>
    </div>
  );
}

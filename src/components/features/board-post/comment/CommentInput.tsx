'use client';

import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import TextArea from '@/components/ui/TextArea';
import { useState } from 'react';

interface CommentInputProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentInput({ postId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // api 요청
      setContent('');
      onCommentAdded?.();
    } catch (error) {
      console.error('댓글 작성 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-5 rounded-lg">
      <div>
        <TextArea
          placeholder="최대 1000자 입력"
          maxLength={1000}
          value={content}
          onChange={e => setContent(e.target.value)}
          className="border-grey-200 rounded-none"
        />

        <div className="flex justify-between items-center p-2 bg-white border border-grey-200">
          <IconButton
            icon="material-symbols:image-outline"
            label=""
            variant="ghost"
          />

          <Button variant="primary" size="sm" onClick={handleSubmit}>
            등록
          </Button>
        </div>
      </div>
    </div>
  );
}

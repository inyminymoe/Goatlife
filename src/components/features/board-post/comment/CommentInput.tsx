'use client';

import IconButton from '@/components/ui/IconButton';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import { Icon } from '@iconify/react';
import { useCommentInput } from './application/useCommentInput';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void;
}

export function CommentInput({
  postId,
  parentId,
  onCommentAdded,
}: CommentInputProps) {
  const {
    content,
    setContent,
    previews,
    imageRef,
    isPending,
    handleUpload,
    handleRemoveImage,
    handleSubmit,
  } = useCommentInput({ postId, parentId, onCommentAdded });

  return (
    <div className="mb-5 rounded-lg">
      <TextArea
        placeholder="최대 1000자 입력"
        maxLength={1000}
        value={content}
        onChange={e => setContent(e.target.value)}
        className="border-grey-200 rounded-none"
      />

      {previews.length > 0 && (
        <div className="bg-dark p-2 border border-dark flex gap-2 flex-wrap">
          {previews.map((item, index) => (
            <div key={index} className="relative w-fit">
              <button
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-1 -right-1 hover:bg-grey-200 rounded-lg transition-colors p-1"
                aria-label="이미지 제거"
              >
                <Icon
                  icon="material-symbols:close"
                  className="size-5 text-grey-700"
                />
              </button>
              <div className="size-20 overflow-hidden border border-dark rounded-lg">
                <img
                  src={item.dataUrl}
                  alt="미리보기"
                  className="size-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center p-2 bg-dark border border-dark">
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={imageRef}
          onChange={handleUpload}
        />
        <IconButton
          icon="material-symbols:image-outline"
          label=""
          variant="ghost"
          onClick={() => imageRef.current?.click()}
        />
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

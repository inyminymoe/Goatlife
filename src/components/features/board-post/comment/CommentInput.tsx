'use client';

import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import TextArea from '@/components/ui/TextArea';
import { useToast } from '@/providers/ToastProvider';
import { Icon } from '@iconify/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/index';

const BUCKET = 'comment_images';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

interface CommentInputProps {
  postId: string;
  onCommentAdded?: () => void;
}

type PreviewItem = {
  dataUrl: string;
  file: File;
};

export function CommentInput({ postId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const toast = useToast();
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLInputElement>(null);

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `comments/${postId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false });

      if (uploadError) throw new Error('이미지 업로드 실패');

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    return urls;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      content,
      previews,
    }: {
      content: string;
      previews: PreviewItem[];
    }) => {
      const files = previews.map(p => p.file);
      const imageUrls = files.length > 0 ? await uploadImages(files) : [];

      const res = await fetch(`/api/board/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, image_urls: imageUrls }),
      });

      if (!res.ok) {
        // 댓글 등록 실패 시 업로드된 이미지 롤백
        if (imageUrls.length > 0) {
          const supabase = createClient();
          const paths = imageUrls.map(url => url.split(`${BUCKET}/`)[1]);
          await supabase.storage.from(BUCKET).remove(paths);
        }
        throw new Error('comments post failed');
      }
    },
    onSuccess: () => {
      setContent('');
      setPreviews([]);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      onCommentAdded?.();
    },
    onError: () => {
      toast.error('잠시 후 다시 시도해주세요.');
    },
  });

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    if (previews.length + newFiles.length > MAX_FILES) {
      toast.error(`이미지는 최대 ${MAX_FILES}장까지 첨부할 수 있어요.`);
      return;
    }

    const oversized = newFiles.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      toast.error('5MB 이하 이미지만 첨부할 수 있어요.');
      return;
    }

    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [
          ...prev,
          { dataUrl: reader.result as string, file },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim()) return;
    mutate({ content, previews });
  };

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
          id="fileInput"
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

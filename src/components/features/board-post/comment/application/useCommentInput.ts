import { useRef, useState } from 'react';
import { ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import {
  deleteCommentImages,
  UPLOAD_LIMITS,
  uploadCommentImages,
} from '../api/storageApi';
import { createComment } from '../api/commentApi';

export type PreviewItem = {
  dataUrl: string;
  file: File;
};

interface UseCommentInputProps {
  postId: string;
  parentId?: string;
  onCommentAdded?: () => void;
}

/**
 * 댓글/답글 작성 유스케이스
 * - 이미지 업로드 (storageApi 위임)
 * - 댓글 등록 (commentApi 위임)
 * - 실패 시 업로드 이미지 롤백
 */
export function useCommentInput({
  postId,
  parentId,
  onCommentAdded,
}: UseCommentInputProps) {
  const [content, setContent] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const imageRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      content,
      previews,
    }: {
      content: string;
      previews: PreviewItem[];
    }) => {
      const files = previews.map(p => p.file);
      // 스토리지 어댑터에 업로드 위임 (롤백 포함)
      const image_urls =
        files.length > 0 ? await uploadCommentImages(files, postId) : [];

      try {
        await createComment(postId, {
          content,
          image_urls,
          parent_id: parentId ?? null,
        });
      } catch (err) {
        // 댓글 등록 실패 시 업로드된 이미지 롤백
        await deleteCommentImages(image_urls);
        throw err;
      }
    },
    onSuccess: () => {
      setContent('');
      setPreviews([]);
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ['replies', parentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      }
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

    if (previews.length + newFiles.length > UPLOAD_LIMITS.MAX_FILES) {
      toast.error(
        `이미지는 최대 ${UPLOAD_LIMITS.MAX_FILES}장까지 첨부할 수 있어요.`
      );
      return;
    }

    const oversized = newFiles.filter(
      f => f.size > UPLOAD_LIMITS.MAX_FILE_SIZE
    );
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

  return {
    content,
    setContent,
    previews,
    imageRef,
    isPending,
    handleUpload,
    handleRemoveImage,
    handleSubmit,
  };
}

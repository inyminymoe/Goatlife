'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { createBoardPost } from '@/app/board/new/actions';
import type { BoardScope } from '@/constants/board';
import { useAtomValue } from 'jotai';
import { editorAtom } from '@/store/editor';
import { TitleInput } from './TitleInput';
import { HashtagInput } from './HashtagInput';
import { FileAttach } from './FileAttach';
import { Toolbar } from './Toolbar';
import { Editor } from './Editor';

type BoardPostFormProps = {
  scope: BoardScope;
  board?: string;
  dept?: string;
  availableTopics: string[];
  categoryOptions: string[];
};

type FieldErrors = Partial<
  Record<
    'title' | 'content' | 'hashtags' | 'category' | 'topic' | 'form',
    string
  >
>;

export default function BoardPostForm({
  scope,
  board,
  dept,
  availableTopics,
  categoryOptions,
}: BoardPostFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const editor = useAtomValue(editorAtom);

  const [title, setTitle] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [topicSelectValue, setTopicSelectValue] = useState<string | undefined>(
    availableTopics[0]
  );
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearError = (key: keyof FieldErrors) =>
    setErrors(prev => ({ ...prev, [key]: undefined }));

  const listHref =
    scope === 'company'
      ? `/board?scope=company&board=${encodeURIComponent(board ?? categoryOptions[0] ?? '')}`
      : `/board?scope=department&dept=${encodeURIComponent(dept ?? '')}`;

  // ── mutation ──────────────────────────────────────────────────────────────
  const { mutate: submitPost, isPending } = useMutation({
    mutationFn: (fd: FormData) => createBoardPost(fd),
    onSuccess: result => {
      if (!result.ok) {
        setErrors({
          title: result.fieldErrors?.title,
          content: result.fieldErrors?.content,
          hashtags: result.fieldErrors?.hashtags,
          topic: result.fieldErrors?.topic,
          category: result.fieldErrors?.category,
          form: result.error,
        });
        return;
      }

      const searchParams = new URLSearchParams();
      searchParams.set('scope', scope);
      if (scope === 'company' && board) searchParams.set('board', board);
      if (scope === 'department' && dept) searchParams.set('dept', dept);

      router.push(
        result.postId
          ? `/board/${result.postId}?${searchParams.toString()}`
          : listHref
      );
    },
    onError: error => {
      console.error('[BoardPostForm] submit failed', error);
      setErrors({ form: '요청 처리 중 오류가 발생했습니다.' });
    },
  });

  // ── 해시태그 ──────────────────────────────────────────────────────────────
  const handleHashtagAdd = (hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) return prev;
      return [...prev, hashtag].slice(0, 5);
    });
  };

  const handleHashtagRemove = (hashtag: string) => {
    setSelectedHashtags(prev => prev.filter(t => t !== hashtag));
  };

  // ── 파일 ─────────────────────────────────────────────────────────────────
  const handleFileAdd = (files: File[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemove = (file: File) => {
    setAttachedFiles(prev => prev.filter(f => f !== file));
  };

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: FieldErrors = {};
    const content = editor?.getHTML() ?? '';
    const textContent = editor?.getText().trim() ?? '';

    if (!title.trim()) newErrors.title = '제목을 입력해주세요.';
    if (textContent.length < 5)
      newErrors.content = '본문은 5자 이상 입력해주세요.';
    if (!topicSelectValue) newErrors.topic = '말머리를 선택해주세요.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fd = new FormData(formRef.current ?? undefined);
    fd.set('scope', scope);
    if (board) fd.set('board', board);
    if (dept) fd.set('dept', dept);
    fd.set('title', title.trim());
    fd.set('content', content);
    fd.set('topic', topicSelectValue!);
    fd.delete('hashtags');
    attachedFiles.forEach(file => fd.append('attachments', file));
    Array.from(new Set(selectedHashtags)).forEach(h =>
      fd.append('hashtags', h)
    );

    submitPost(fd);
  };

  return (
    <main className="flex-1 px-6 md:px-6 py-6 bg-grey-100 col-span-2 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="brand-h2 font-brand text-grey-900">글쓰기</h2>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="px-6"
          onClick={() => router.push(listHref)}
        >
          목록
        </Button>
      </div>
      <div className="border-b border-grey-200 my-4" />

      {/* 말머리 */}
      <div className="space-y-2">
        <Select
          placeholder="분류 선택"
          value={topicSelectValue}
          onChange={value => {
            setTopicSelectValue(value);
            clearError('topic');
          }}
          options={availableTopics.map(topic => ({
            value: topic,
            label: topic,
          }))}
        />
        {errors.category && (
          <p className="body-xs text-[#e26aff] font-medium">
            {errors.category}
          </p>
        )}
        {errors.topic && (
          <p className="body-xs text-[#e26aff] font-medium">{errors.topic}</p>
        )}
        {errors.hashtags && (
          <p className="body-xs text-[#e26aff] font-medium">
            {errors.hashtags}
          </p>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="bg-white rounded-[5px] border border-grey-200">
          <div className="pt-4">
            <Toolbar />
            <div className="border-t border-fixed-grey-200" />
            <div className="px-6 py-5 space-y-3">
              {/* 제목 */}
              <TitleInput
                value={title}
                onChange={value => {
                  setTitle(value);
                  clearError('title');
                }}
                error={errors.title}
              />
              {/* 에디터 영역 */}
              <Editor
                errorMessage={errors.content}
                onContentChange={() => clearError('content')}
              />
            </div>

            {/* 해시태그 */}
            <div className="px-6 pb-4">
              <HashtagInput
                hashtags={selectedHashtags}
                onAdd={handleHashtagAdd}
                onRemove={handleHashtagRemove}
              />
            </div>
          </div>
        </div>

        {/* 첨부파일 */}
        <div className="mt-5 space-y-3">
          <FileAttach
            files={attachedFiles}
            onAdd={handleFileAdd}
            onRemove={handleFileRemove}
          />

          {errors.form && (
            <div className="rounded-[5px] bg-[#ffe6ff] border border-[#e26aff] px-3 py-2 text-[#7d1bbd] body-sm">
              {errors.form}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full md:flex-1 bg-white text-grey-700 border border-grey-200"
            onClick={() => router.push(listHref)}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full md:flex-1"
            disabled={isPending}
          >
            {isPending ? '등록 중...' : '등록하기'}
          </Button>
        </div>
      </form>
    </main>
  );
}

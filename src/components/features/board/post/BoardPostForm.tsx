'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useAtomValue } from 'jotai';
import { editorAtom } from '@/store/editor';
import type { BoardScope } from '@/constants/board';
import { createBoardPost } from '@/app/board/new/actions';
import { updateBoardPost } from '@/app/board/edit/[id]/actions';
import { Toolbar } from './Toolbar';
import { TitleInput } from './TitleInput';
import { Editor } from './Editor';
import { HashtagInput } from './HashtagInput';
import { FileAttach } from './FileAttach';

// ── 타입 ───────────────────────────────────────────────────────────────────────

interface BoardPost {
  id: string;
  scope: BoardScope;
  board?: string;
  dept?: string;
  topic: string;
  title: string;
  content: string;
  hashtags: string[];
}

type CreateProps = {
  mode: 'create';
  scope: BoardScope;
  board?: string;
  dept?: string;
  availableTopics: string[];
  categoryOptions: string[];
};

type EditProps = {
  mode: 'edit';
  post: BoardPost;
  scope: string;
  board?: string;
  dept?: string;
  availableTopics: string[];
};

type BoardPostFormProps = CreateProps | EditProps;

type FieldErrors = Partial<
  Record<
    'title' | 'content' | 'hashtags' | 'category' | 'topic' | 'form',
    string
  >
>;

// ── 컴포넌트 ────────────────────────────────────────────────────────────────────

export default function BoardPostForm(props: BoardPostFormProps) {
  const { mode, scope, board, dept, availableTopics } = props;
  const isEdit = mode === 'edit';
  const post = isEdit ? props.post : null;

  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const editor = useAtomValue(editorAtom);

  const [title, setTitle] = useState(post?.title ?? '');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(
    post?.hashtags ?? []
  );
  const [topicSelectValue, setTopicSelectValue] = useState<string | undefined>(
    post?.topic ?? availableTopics[0]
  );
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});

  const clearError = (key: keyof FieldErrors) =>
    setErrors(prev => ({ ...prev, [key]: undefined }));

  // create/edit에 따른 href 계산
  const listHref =
    scope === 'company'
      ? `/board?scope=company&board=${encodeURIComponent(
          board ??
            (isEdit ? '' : ((props as CreateProps).categoryOptions[0] ?? ''))
        )}`
      : `/board?scope=department&dept=${encodeURIComponent(dept ?? '')}`;

  const detailHref = isEdit
    ? `/board/${post!.id}?scope=${scope}${board ? `&board=${encodeURIComponent(board)}` : ''}${dept ? `&dept=${encodeURIComponent(dept)}` : ''}`
    : listHref;

  const cancelHref = isEdit ? detailHref : listHref;

  // ── mutation ───────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: (fd: FormData) =>
      isEdit ? updateBoardPost(fd) : createBoardPost(fd),
    onSuccess: result => {
      if (!result.ok) {
        if (result.error) window.alert(result.error);
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

      if (isEdit) {
        router.push(detailHref);
      } else {
        const searchParams = new URLSearchParams();
        searchParams.set('scope', scope);
        if (scope === 'company' && board) searchParams.set('board', board);
        if (scope === 'department' && dept) searchParams.set('dept', dept);
        router.push(
          result.postId
            ? `/board/${result.postId}?${searchParams.toString()}`
            : listHref
        );
      }
    },
    onError: error => {
      console.error(`[BoardPostForm:${mode}] failed`, error);
      window.alert(
        '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
      setErrors({ form: '요청 처리 중 오류가 발생했습니다.' });
    },
  });

  // ── 해시태그 ───────────────────────────────────────────────────────────────
  const handleHashtagAdd = (hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) return prev;
      return [...prev, hashtag].slice(0, 5);
    });
  };

  const handleHashtagRemove = (hashtag: string) =>
    setSelectedHashtags(prev => prev.filter(t => t !== hashtag));

  // ── 파일 ──────────────────────────────────────────────────────────────────
  const handleFileAdd = (files: File[]) =>
    setAttachedFiles(prev => [...prev, ...files]);

  const handleFileRemove = (file: File) =>
    setAttachedFiles(prev => prev.filter(f => f !== file));

  // ── submit ─────────────────────────────────────────────────────────────────
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
    if (isEdit) {
      fd.set('id', post!.id);
    }
    fd.set('scope', scope);
    if (board) {
      fd.set('board', board);
    }
    if (dept) {
      fd.set('dept', dept);
    }
    fd.set('title', title.trim());
    fd.set('content', content);
    fd.set('topic', topicSelectValue!);
    fd.delete('hashtags');
    attachedFiles.forEach(file => fd.append('attachments', file));
    Array.from(new Set(selectedHashtags)).forEach(h =>
      fd.append('hashtags', h)
    );

    mutate(fd);
  };

  return (
    <main className="flex-1 px-6 md:px-6 py-6 bg-grey-100 col-span-2 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="brand-h2 font-brand text-grey-900">
          {isEdit ? '글 수정' : '글쓰기'}
        </h2>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="px-6"
          onClick={() => router.push(cancelHref)}
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
        <div className="bg-dark rounded-[5px] border border-dark">
          <div className="pt-4">
            <Toolbar />
            <div className="border-t border-fixed-grey-200" />
            <div className="px-6 py-5 space-y-3">
              <TitleInput
                value={title}
                onChange={value => {
                  setTitle(value);
                  clearError('title');
                }}
                error={errors.title}
              />

              <Editor
                initialContent={post?.content}
                errorMessage={errors.content}
                onContentChange={() => clearError('content')}
              />
            </div>

            <div className="px-6 pb-4">
              <HashtagInput
                hashtags={selectedHashtags}
                onAdd={handleHashtagAdd}
                onRemove={handleHashtagRemove}
              />
            </div>
          </div>
        </div>

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

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full md:flex-1 bg-dark text-dark border border-dark"
            onClick={() => router.push(cancelHref)}
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
            {isPending
              ? isEdit
                ? '수정 중...'
                : '등록 중...'
              : isEdit
                ? '수정하기'
                : '등록하기'}
          </Button>
        </div>
      </form>
    </main>
  );
}

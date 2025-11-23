'use client';

import { useRef, useState, useTransition, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { createBoardPost } from '@/app/board/new/actions';
import type { BoardScope } from '@/constants/board';

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

const TOOLBAR_ACTIONS = [
  { icon: 'material-symbols:imagesmode-outline', label: '이미지 첨부' },
  { icon: 'material-symbols:format-bold-rounded', label: '굵게' },
  { icon: 'material-symbols:format-italic-rounded', label: '이탤릭' },
  { icon: 'material-symbols:format-underlined-rounded', label: '밑줄' },
  { icon: 'material-symbols:format-strikethrough-rounded', label: '가로줄' },
  { icon: 'material-symbols:format-color-fill-rounded', label: '배경색' },
  { icon: 'material-symbols:format-paint-rounded', label: '텍스트색' },
  { icon: 'material-symbols:format-size-rounded', label: '사이즈' },
  { icon: 'material-symbols:link-rounded', label: '링크 첨부' },
  { icon: 'material-symbols:attach-file', label: '파일 첨부' },
];

export default function BoardPostForm({
  scope,
  board,
  dept,
  availableTopics,
  categoryOptions,
}: BoardPostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [topicSelectValue, setTopicSelectValue] = useState<
    string | undefined
  >();
  const [hashtagInput, setHashtagInput] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const listHref =
    scope === 'company'
      ? `/board?scope=company&board=${encodeURIComponent(board ?? categoryOptions[0] ?? '')}`
      : `/board?scope=department&dept=${encodeURIComponent(dept ?? '')}`;

  const addHashtagFromInput = () => {
    const raw = hashtagInput.trim();
    if (!raw) return;

    const cleaned = raw.replace(/^#+/, '').replace(/,+$/, '').trim();

    if (!cleaned) {
      setHashtagInput('');
      return;
    }

    setSelectedHashtags(prev => {
      if (prev.includes(cleaned)) return prev;
      return [...prev, cleaned].slice(0, 5);
    });

    setHashtagInput('');
  };

  const handleHashtagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // IME(한글 등) 조합 중일 때는 태그 변환을 막기
    const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
    if (nativeEvent.isComposing) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addHashtagFromInput();
    }
  };

  const handleHashtagBlur = () => {
    // 인풋에서 포커스가 빠질 때 남은 텍스트를 태그로 변환
    addHashtagFromInput();
  };

  const handleRemoveHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => prev.filter(t => t !== hashtag));
  };

  const handleCancel = () => {
    router.push(listHref);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    addHashtagFromInput();
    const newErrors: FieldErrors = {};
    const topic = topicSelectValue ?? availableTopics[0] ?? '';

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    if (content.trim().length < 5) {
      newErrors.content = '본문은 5자 이상 입력해주세요.';
    }

    if (!topic) {
      newErrors.topic = '말머리를 선택해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData(formRef.current ?? undefined);
        fd.set('scope', scope);
        if (board) fd.set('board', board);
        if (dept) fd.set('dept', dept);
        fd.set('title', title.trim());
        fd.set('content', content.trim());
        fd.set('topic', topic);
        fd.delete('hashtags');
        Array.from(new Set(selectedHashtags)).forEach(hashtag =>
          fd.append('hashtags', hashtag)
        );

        const result = await createBoardPost(fd);

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

        // 임시: 상세 페이지 작업 중이므로 목록으로 이동
        router.push(listHref);
      } catch (error) {
        console.error('[BoardPostForm] submit failed', error);
        setErrors({
          form: '요청 처리 중 오류가 발생했습니다.',
        });
      }
    });
  };

  return (
    <main className="flex-1 px-6 md:px-6 py-6 bg-grey-100 col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="brand-h2 font-brand text-grey-900">글쓰기</h2>
        </div>
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

      <div className="space-y-2">
        <Select
          placeholder="분류 선택"
          value={topicSelectValue}
          onChange={value => {
            // 분류 선택은 해시태그와 별도로 동작 (해시태그 리스트에는 추가하지 않음)
            setTopicSelectValue(value);
          }}
          options={availableTopics.map(topic => ({
            value: topic,
            label: topic,
          }))}
        />
        {(errors.category || errors.hashtags || errors.topic) && (
          <>
            {errors.category && (
              <p className="body-xs text-[#e26aff] font-medium">
                {errors.category}
              </p>
            )}
            {errors.topic && (
              <p className="body-xs text-[#e26aff] font-medium">
                {errors.topic}
              </p>
            )}
            {errors.hashtags && (
              <p className="body-xs text-[#e26aff] font-medium">
                {errors.hashtags}
              </p>
            )}
          </>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="bg-white rounded-[5px] border border-grey-200">
          <div className="pt-4">
            <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
              {TOOLBAR_ACTIONS.map(action => (
                <button
                  key={action.icon}
                  type="button"
                  onClick={() => alert('준비 중')}
                  className="flex items-center gap-1 px-2 py-1 rounded-[4px] hover:bg-grey-100 transition-colors"
                >
                  <Icon
                    icon={action.icon}
                    className="w-5 h-5 text-fixed-grey-900"
                  />
                </button>
              ))}
            </div>
            <div className="border-t border-fixed-grey-200" />

            <div className="px-6 py-5 space-y-3">
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="제목을 입력해 주세요"
                  maxLength={100}
                  className="w-full bg-transparent border-none outline-none text-xl font-medium text-fixed-grey-900 placeholder:text-fixedgrey-300"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-[#e26aff]">{errors.title}</p>
                )}
              </div>
              <div>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="갓생이들에게 전할 말 🐴"
                  maxLength={3000}
                  rows={10}
                  className="w-full bg-transparent border-none outline-none resize-none text-base text-fixed-grey-900 placeholder:text-fixed-grey-300 min-h-[260px]"
                />
                {errors.content && (
                  <p className="mt-1 text-xs text-[#e26aff]">
                    {errors.content}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {selectedHashtags.map(hashtag => (
                  <div
                    key={hashtag}
                    className="inline-flex items-center gap-2 rounded-[999px] bg-primary-100 px-3 py-1 text-primary-500 text-sm"
                  >
                    <span>#{hashtag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(hashtag)}
                      className="text-xs text-primary-400 hover:text-primary-600"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="w-26 h-8 px-4 py-2 bg-primary-100 rounded-[5px] inline-flex justify-center items-center gap-2.5">
                  <input
                    type="text"
                    value={hashtagInput}
                    onChange={e => setHashtagInput(e.target.value)}
                    onKeyDown={handleHashtagKeyDown}
                    onBlur={handleHashtagBlur}
                    placeholder={
                      selectedHashtags.length === 0 ? '#태그 입력' : ''
                    }
                    className="w-full bg-transparent border-none outline-none text-primary-500 text-sm font-medium leading-6 placeholder:text-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-[5px] border border-dashed border-grey-300 bg-grey-50 px-4 py-3">
            <div className="flex items-center gap-2 text-grey-700 body-sm">
              <Icon icon="material-symbols:attach-file" className="w-5 h-5" />
              <span>첨부 파일 없음</span>
            </div>
          </div>

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
            className="w-full md:flex-1 bg-white text-grey-700 border border-grey-200"
            onClick={handleCancel}
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

'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';
import type { RoutineCategory } from '../RoutineItem';
import type { RoutinePeriod } from './types';

export interface RoutineAddData {
  title: string;
  url?: string;
  period: RoutinePeriod;
  pomodoro_count: number;
  category: RoutineCategory;
}

interface RoutineAddContentProps {
  defaultPeriod: RoutinePeriod;
  onSave: (data: RoutineAddData) => void;
  onClose: () => void;
}

const POMODORO_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}개`,
}));

const CATEGORY_OPTIONS: {
  value: RoutineCategory;
  label: string;
  dotClass: string;
}[] = [
  { value: 'work', label: '생산 (Work)', dotClass: 'bg-primary-100' },
  { value: 'break', label: '일상 (Life)', dotClass: 'bg-accent-orange-100' },
  {
    value: 'leisure',
    label: '보상 (Balance)',
    dotClass: 'bg-accent-green-500',
  },
];

export default function RoutineAddContent({
  defaultPeriod,
  onSave,
  onClose,
}: RoutineAddContentProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [period, setPeriod] = useState<RoutinePeriod>(defaultPeriod);
  const [pomodoro_count, setPomodoroCount] = useState(1);
  const [category, setCategory] = useState<RoutineCategory>('work');

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      url: url.trim() || undefined,
      period,
      pomodoro_count,
      category,
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 제목 */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="add-routine-title"
          className="body-sm font-medium text-grey-900"
        >
          제목
        </label>
        <input
          id="add-routine-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="루틴 이름"
          className="w-full px-3 py-2 bg-grey-100 border border-grey-200 rounded-[5px] text-14 text-grey-900 placeholder:text-grey-500 focus:outline-none focus:border-primary-500 transition-colors"
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </div>

      {/* URL 링크 */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="add-routine-url"
          className="body-sm font-medium text-grey-900"
        >
          URL 링크
        </label>
        <input
          id="add-routine-url"
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="이동할 링크를 입력하면 클릭 시 이동합니다. http, https 형식을 입력하세요."
          className="w-full px-3 py-2 bg-grey-100 border border-grey-200 rounded-[5px] text-14 text-grey-900 placeholder:text-grey-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      {/* 실행시간 */}
      <div className="flex flex-col gap-2">
        <span className="body-sm font-medium text-grey-900">실행시간</span>
        <div
          className="flex gap-5"
          role="radiogroup"
          aria-label="실행시간 선택"
        >
          {(['AM', 'PM'] as const).map(p => (
            <label key={p} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="period"
                value={p}
                checked={period === p}
                onChange={() => setPeriod(p)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`size-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                  period === p ? 'border-primary-500' : 'border-grey-200'
                }`}
              >
                {period === p && (
                  <span className="size-3 rounded-full bg-primary-500" />
                )}
              </span>
              <span className="text-14 text-grey-900">
                {p === 'AM' ? '오전 (AM)' : '오후 (PM)'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 예상 포모도로 개수 */}
      <Select
        label="예상 포모도로 개수"
        value={String(pomodoro_count)}
        onChange={v => setPomodoroCount(Number(v))}
        options={POMODORO_OPTIONS}
      />

      {/* 분류 */}
      <div className="flex flex-col gap-2">
        <span className="body-sm font-medium text-grey-900">분류</span>
        <div className="flex gap-5" role="radiogroup" aria-label="분류 선택">
          {CATEGORY_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="category"
                value={opt.value}
                checked={category === opt.value}
                onChange={() => setCategory(opt.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`size-6 rounded-full flex items-center justify-center transition-colors ${
                  category === opt.value
                    ? 'border-2 border-primary-500'
                    : 'border border-grey-200'
                }`}
              >
                <span className={`size-4 rounded-full ${opt.dotClass}`} />
              </span>
              <span className="text-14 text-grey-900">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          className="w-full py-3 bg-primary-500 rounded-[5px] text-14 font-semibold text-fixed-white disabled:opacity-40 transition-opacity"
          onClick={handleSave}
          disabled={!title.trim()}
        >
          저장
        </button>
        <button
          type="button"
          className="w-full py-3 bg-dark border border-dark rounded-[5px] text-14 font-semibold text-dark transition-colors hover:bg-grey-200"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
}

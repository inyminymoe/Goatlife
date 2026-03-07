'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';

type RoutineCategory = 'work' | 'break' | 'leisure';
type RoutinePeriod = 'AM' | 'PM';

interface RoutineItem {
  id: string;
  title: string;
  category: RoutineCategory;
}

interface RoutineTimelineProps {
  period: RoutinePeriod;
  items: RoutineItem[];
  onAddItem: (period: RoutinePeriod) => void;
  onRemoveItem: (period: RoutinePeriod, id: string) => void;
}

const ROUTINE_COLORS: Record<RoutineCategory, string> = {
  work: 'bg-primary-100',
  break: 'bg-accent-orange-100',
  leisure: 'bg-accent-green-500',
};

const CATEGORY_LABEL: Record<RoutineCategory, string> = {
  work: '업무',
  break: '휴식',
  leisure: '여가',
};

function RoutineTimeline({
  period,
  items,
  onAddItem,
  onRemoveItem,
}: RoutineTimelineProps) {
  return (
    <div className="flex items-start gap-4 rounded-[5px] p-2 hover:bg-white/70 transition-colors">
      <div className="text-center text-grey-300 text-10 font-bold leading-5 whitespace-pre pt-1">
        {period}
      </div>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {items.map(item => (
          <div
            key={item.id}
            className={`px-3 py-1.5 ${ROUTINE_COLORS[item.category]} rounded-[5px] flex items-center gap-1`}
          >
            <span className="text-11 text-primary-500 font-semibold">
              [{CATEGORY_LABEL[item.category]}]
            </span>
            <span className="text-primary-500 text-14 font-medium">
              {item.title}
            </span>
            <button
              type="button"
              className="ml-1 text-primary-500/60 hover:text-primary-500"
              onClick={() => onRemoveItem(period, item.id)}
              aria-label={`${item.title} 삭제`}
            >
              <Icon icon="icon-park:close-small" className="size-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="px-3 py-1.5 bg-grey-200 rounded-[5px] flex items-center justify-center"
          aria-label={`${period} 루틴 추가`}
          onClick={() => onAddItem(period)}
        >
          <div className="size-6 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-grey-500" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-grey-500" />
          </div>
        </button>
      </div>
    </div>
  );
}

// 초기 사용자를 위한 기본 플레이스홀더 루틴
const DEFAULT_ROUTINES = {
  am: [
    { id: 'am-1', title: '명상', category: 'break' as RoutineCategory },
    { id: 'am-2', title: '회의', category: 'work' as RoutineCategory },
    { id: 'am-3', title: '업무계획 작성', category: 'work' as RoutineCategory },
    { id: 'am-4', title: '스트레칭', category: 'break' as RoutineCategory },
    { id: 'am-5', title: '생산 작업 1차', category: 'work' as RoutineCategory },
    { id: 'am-6', title: '간식', category: 'leisure' as RoutineCategory },
  ],
  pm: [
    { id: 'pm-1', title: '점심식사', category: 'break' as RoutineCategory },
    { id: 'pm-2', title: '산책', category: 'break' as RoutineCategory },
    { id: 'pm-3', title: '생산 작업 2차', category: 'work' as RoutineCategory },
    { id: 'pm-4', title: '리뷰', category: 'work' as RoutineCategory },
    { id: 'pm-5', title: '저녁식사', category: 'break' as RoutineCategory },
    { id: 'pm-6', title: '헬스장', category: 'break' as RoutineCategory },
    { id: 'pm-7', title: '게임', category: 'leisure' as RoutineCategory },
    { id: 'pm-8', title: '웹툰', category: 'leisure' as RoutineCategory },
  ],
};

export default function RoadmapCard() {
  const [routines, setRoutines] = useState(DEFAULT_ROUTINES);
  const [nextCategory, setNextCategory] = useState<RoutineCategory>('work');

  const totalRoutineCount = useMemo(
    () => routines.am.length + routines.pm.length,
    [routines]
  );

  const addRoutine = (period: RoutinePeriod) => {
    const title = window
      .prompt(
        `${period}에 추가할 루틴 이름을 입력해주세요.\n현재 카테고리: ${CATEGORY_LABEL[nextCategory]}`
      )
      ?.trim();

    if (!title) {
      return;
    }

    setRoutines(prev => {
      const targetKey = period === 'AM' ? 'am' : 'pm';
      const nextId = `${targetKey}-${Date.now()}`;

      return {
        ...prev,
        [targetKey]: [
          ...prev[targetKey],
          { id: nextId, title, category: nextCategory },
        ],
      };
    });
  };

  const removeRoutine = (period: RoutinePeriod, id: string) => {
    setRoutines(prev => {
      const targetKey = period === 'AM' ? 'am' : 'pm';
      return {
        ...prev,
        [targetKey]: prev[targetKey].filter(item => item.id !== id),
      };
    });
  };

  const rotateCategory = () => {
    setNextCategory(prev => {
      if (prev === 'work') return 'break';
      if (prev === 'break') return 'leisure';
      return 'work';
    });
  };

  return (
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-end gap-1">
          <Icon
            icon="icon-park:road-sign-both"
            className="size-6 text-grey-900"
          />
          <h2 className="brand-h3 text-grey-900">Roadmap</h2>
        </div>
        <button type="button" aria-label="메뉴">
          <Icon icon="icon-park:more-one" className="size-6 text-grey-900" />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-12 font-medium text-grey-500">
            루틴 {totalRoutineCount}개
          </p>
          <button
            type="button"
            className="px-2 py-1 rounded-[5px] bg-white text-12 font-medium text-grey-700 hover:bg-grey-200 transition-colors"
            onClick={rotateCategory}
          >
            추가 카테고리: {CATEGORY_LABEL[nextCategory]}
          </button>
        </div>
        <RoutineTimeline
          period="AM"
          items={routines.am}
          onAddItem={addRoutine}
          onRemoveItem={removeRoutine}
        />
        <RoutineTimeline
          period="PM"
          items={routines.pm}
          onAddItem={addRoutine}
          onRemoveItem={removeRoutine}
        />
      </div>

      {/* Action Button */}
      <button
        type="button"
        className="w-full px-20 py-2 bg-white rounded-[5px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={totalRoutineCount === 0}
      >
        <span className="text-grey-900 text-14 font-semibold">
          루틴 시작하기
        </span>
      </button>
    </section>
  );
}

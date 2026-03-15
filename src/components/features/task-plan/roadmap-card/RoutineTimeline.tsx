'use client';

import { memo } from 'react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import RoutineItem from '../RoutineItem';
import type { RoutineItemData, RoutineMode, RoutinePeriod } from './types';

interface RoutineTimelineProps {
  period: RoutinePeriod;
  items: RoutineItemData[];
  onAddClick: (period: RoutinePeriod) => void;
  mode: RoutineMode;
  onItemClick: (period: RoutinePeriod, itemId: string) => void;
}

interface AddButtonProps {
  mode: RoutineMode;
  period: RoutinePeriod;
  onAddClick: (period: RoutinePeriod) => void;
}

const ADD_BUTTON_LABEL: Record<RoutineMode, string> = {
  view: '루틴 추가',
  edit: '편집 종료',
  reorder: '순서 변경 종료',
};

function AddButton({ mode, period, onAddClick }: AddButtonProps) {
  const isViewMode = mode === 'view';

  return (
    <button
      type="button"
      className="px-3 py-1.5 bg-grey-200 rounded-[5px] flex items-center justify-center"
      aria-label={ADD_BUTTON_LABEL[mode]}
      onClick={() => onAddClick(period)}
    >
      <div
        className={`size-6 relative transition-transform ${isViewMode ? '' : 'rotate-45'}`}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-0.5 bg-grey-500" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-grey-500" />
      </div>
    </button>
  );
}

const RoutineTimeline = memo(function RoutineTimeline({
  period,
  items,
  onAddClick,
  mode,
  onItemClick,
}: RoutineTimelineProps) {
  return (
    <div className="flex items-start gap-4">
      {/* Period label — text-grey-500 for readable contrast in both light and dark mode */}
      <div className="text-center text-grey-500 text-10 font-bold leading-5 whitespace-pre">
        {period[0]}
        {'\n'}
        {period[1]}
      </div>
      <SortableContext
        items={items.map(item => item.id)}
        strategy={rectSortingStrategy}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {items.map(item => (
            <RoutineItem
              key={item.id}
              item={item}
              mode={mode}
              onPress={id => onItemClick(period, id)}
            />
          ))}
          <AddButton mode={mode} period={period} onAddClick={onAddClick} />
        </div>
      </SortableContext>
    </div>
  );
});

export default RoutineTimeline;

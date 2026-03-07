'use client';

import { memo, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export type RoutineCategory = 'work' | 'break' | 'leisure';
export type RoutineMode = 'view' | 'edit' | 'reorder';

export interface RoutineItemData {
  id: string;
  title: string;
  category: RoutineCategory;
}

interface RoutineItemProps {
  item: RoutineItemData;
  mode: RoutineMode;
  onPress: (id: string) => void;
}

const ROUTINE_COLORS: Record<RoutineCategory, string> = {
  work: 'bg-primary-100',
  break: 'bg-accent-orange-100',
  leisure: 'bg-accent-green-500',
};

function hashToDelay(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 21);
  return `${(normalized / 100).toFixed(2)}s`;
}

function RoutineItemComponent({ item, mode, onPress }: RoutineItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: mode !== 'reorder',
  });

  const jiggleDelay = useMemo(() => hashToDelay(item.id), [item.id]);

  const isEditing = mode === 'edit';
  const isReordering = mode === 'reorder';

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`px-3 py-1.5 rounded-[5px] inline-flex items-center gap-2.5 transition-opacity ${ROUTINE_COLORS[item.category]} ${isDragging ? 'opacity-70' : 'opacity-100'}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
      }}
      onClick={() => onPress(item.id)}
      aria-label={`${item.title} 루틴`}
      {...attributes}
      {...listeners}
    >
      <span
        className={`text-primary-500 text-14 font-medium leading-6 ${isReordering ? 'routine-jiggle' : ''}`}
        style={isReordering ? { animationDelay: jiggleDelay } : undefined}
      >
        {item.title}
      </span>
      {(isEditing || isReordering) && (
        <span className="size-5 inline-flex items-center justify-center text-accent-magenta-300">
          <Icon
            icon={
              isReordering
                ? 'material-symbols:drag-indicator'
                : 'material-symbols:edit'
            }
            className="size-4"
          />
        </span>
      )}
    </button>
  );
}

const RoutineItem = memo(RoutineItemComponent);

export default RoutineItem;

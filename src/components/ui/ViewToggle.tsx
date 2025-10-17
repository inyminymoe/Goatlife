'use client';
import { Icon } from '@iconify/react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  className?: string;
}

export default function ViewToggle({
  view,
  onViewChange,
  className = '',
}: ViewToggleProps) {
  return (
    <div
      className={`inline-flex bg-white rounded-[5px] shadow-[4px_4px_4px_0px_rgba(47,136,255,0.08)] ${className}`}
    >
      {/* List View */}
      <button
        type="button"
        onClick={() => onViewChange('list')}
        aria-pressed={view === 'list'}
        aria-label="리스트 보기"
        className="p-3 transition-colors"
      >
        <Icon
          icon="material-symbols:lists-rounded"
          className={`w-5 h-5 ${view === 'list' ? 'text-primary-500' : 'text-grey-500'}`}
        />
      </button>

      {/* Divider */}
      <div className="w-px h-6 self-center bg-grey-200" />

      {/* Grid View */}
      <button
        type="button"
        onClick={() => onViewChange('grid')}
        aria-pressed={view === 'grid'}
        aria-label="그리드 보기"
        className="p-3 transition-colors"
      >
        <Icon
          icon="material-symbols:grid-view-rounded"
          className={`w-5 h-5 ${view === 'grid' ? 'text-primary-500' : 'text-grey-500'}`}
        />
      </button>
    </div>
  );
}

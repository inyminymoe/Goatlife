'use client';
import { Icon } from '@iconify/react';
import { KanbanBoard } from './KanbanBoard';

export default function KanbanView() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-end gap-1">
          <Icon
            icon="icon-park:order"
            className="w-6 h-6 text-grey-900"
            aria-hidden="true"
          />
          <h2 className="brand-h3 text-grey-900">업무계획서</h2>
        </div>
      </div>

      <KanbanBoard />
    </div>
  );
}

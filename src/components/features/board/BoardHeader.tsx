'use client';

import Button from '@/components/ui/Button';
import ViewToggle from '@/components/ui/ViewToggle';

interface BoardHeaderProps {
  toggleView: 'list' | 'grid';
  onViewChange: () => void;
  onCreate: () => void;
}

export default function BoardHeader({
  toggleView,
  onViewChange,
  onCreate,
}: BoardHeaderProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button variant="primary" className="py-2 px-6" onClick={onCreate}>
        글쓰기
      </Button>
      <ViewToggle view={toggleView} onViewChange={onViewChange} />
    </div>
  );
}

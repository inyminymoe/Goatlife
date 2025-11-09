'use client';

import Button from '@/components/ui/Button';
import ViewToggle from '@/components/ui/ViewToggle';

interface BoardHeaderProps {
  toggleView: 'list' | 'grid';
  onViewChange: () => void;
}

export default function BoardHeader({
  toggleView,
  onViewChange,
}: BoardHeaderProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button variant="primary" className="py-2" onClick={() => {}}>
        글쓰기
      </Button>
      <ViewToggle view={toggleView} onViewChange={onViewChange} />
    </div>
  );
}

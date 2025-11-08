'use client';

import Button from '@/components/ui/Button';

interface BoardFilterTagsProps {
  tags: string[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}

export default function BoardFilterTags({
  tags,
  selectedTags,
  onTagClick,
}: BoardFilterTagsProps) {
  return (
    <div className="flex gap-2">
      {tags.map(tag => (
        <Button
          key={tag}
          variant="filter"
          active={selectedTags.includes(tag)}
          onClick={() => onTagClick(tag)}
        >
          {tag}
        </Button>
      ))}
    </div>
  );
}

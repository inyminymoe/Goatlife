'use client';

import Button from '@/components/ui/Button';

interface BoardFilterTopicsProps {
  topics: string[];
  selectedTopics: string[];
  onTopicClick: (topic: string) => void;
}

export default function BoardFilterTopics({
  topics,
  selectedTopics,
  onTopicClick,
}: BoardFilterTopicsProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {topics.map(topic => (
        <Button
          key={topic}
          variant="filter"
          active={selectedTopics.includes(topic)}
          onClick={() => onTopicClick(topic)}
        >
          {topic}
        </Button>
      ))}
    </div>
  );
}

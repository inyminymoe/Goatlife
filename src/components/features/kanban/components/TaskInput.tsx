'use client';
import { useState } from 'react';
import Image from 'next/image';

interface TaskInputProps {
  onSubmit: (title: string) => void;
  isLoading?: boolean;
}

export default function TaskInput({ onSubmit, isLoading }: TaskInputProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit(title.trim());
      setTitle('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full p-3 rounded-lg shadow-[2px_3px_8px_0px_rgba(0,0,0,0.08)] bg-white inline-flex items-start gap-2">
      <div className="flex-shrink-0 w-6 h-6 relative">
        <Image
          src="/images/icons/icon_unchecked.svg"
          alt=""
          width={24}
          height={24}
        />
      </div>

      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="할 일 작성하기"
        className="flex-1 body-sm font-medium outline-none placeholder:text-grey-400"
        disabled={isLoading}
      />

      <button
        onClick={handleSubmit}
        disabled={isLoading || !title.trim()}
        className="px-3 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50 transition-colors"
      >
        {isLoading ? '...' : '등록'}
      </button>
    </div>
  );
}

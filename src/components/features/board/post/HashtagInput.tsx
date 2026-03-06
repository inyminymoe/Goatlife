'use client';

import { useState, type KeyboardEvent } from 'react';

interface HashtagInputProps {
  hashtags: string[];
  onAdd: (hashtag: string) => void;
  onRemove: (hashtag: string) => void;
}

export function HashtagInput({ hashtags, onAdd, onRemove }: HashtagInputProps) {
  const [input, setInput] = useState('');

  const flush = () => {
    const raw = input.trim();
    if (!raw) return;

    const cleaned = raw.replace(/^#+/, '').replace(/,+$/, '').trim();
    if (!cleaned) {
      setInput('');
      return;
    }

    onAdd(cleaned);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as unknown as { isComposing?: boolean };
    if (nativeEvent.isComposing) return;

    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      flush();
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {hashtags.map(hashtag => (
        <div
          key={hashtag}
          className="inline-flex items-center gap-2 rounded-[999px] bg-primary-100 px-3 py-1 text-primary-500 text-sm"
        >
          <span>#{hashtag}</span>
          <button
            type="button"
            onClick={() => onRemove(hashtag)}
            className="text-xs text-primary-400 hover:text-primary-600"
          >
            ×
          </button>
        </div>
      ))}

      <div className="w-26 h-8 px-4 py-2 bg-primary-100 rounded-[5px] inline-flex justify-center items-center gap-2.5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={flush}
          placeholder={hashtags.length === 0 ? '#태그 입력' : ''}
          className="w-full bg-transparent border-none outline-none text-primary-500 text-sm font-medium leading-6 placeholder:text-primary-500"
        />
      </div>
    </div>
  );
}

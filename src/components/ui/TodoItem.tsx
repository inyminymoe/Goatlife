'use client';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface TodoItemProps {
  id: string;
  text: string;
  completed?: boolean;
  onToggle?: (id: string) => void;
  onSettings?: (id: string) => void;
}

export default function TodoItem({
  id,
  text,
  completed = false,
  onToggle,
  onSettings,
}: TodoItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-full p-3 rounded-lg 
        shadow-[2px_3px_8px_0px_rgba(0,0,0,0.08)]
        inline-flex items-start gap-2
        transition-colors
        ${completed ? 'bg-grey-300' : 'bg-white'}
      `}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle?.(id)}
        className="flex-shrink-0 w-6 h-6 relative"
        aria-label={completed ? '완료 취소' : '완료 처리'}
      >
        {completed ? (
          // Checked icon
          <Icon
            icon="icon-park:check-one"
            className="w-6 h-6 text-primary-500"
          />
        ) : (
          // Unchecked icon - 커스텀 SVG
          <Image
            src="/images/icons/icon_unchecked.svg"
            alt=""
            width={24}
            height={24}
          />
        )}
      </button>

      {/* Text */}
      <p
        className={`
          flex-1 body-sm font-medium leading-normal
          ${completed ? 'text-grey-500 line-through' : 'text-grey-900'}
        `}
      >
        {text}
      </p>

      {/* Settings button (visible on hover or when completed) */}
      {isHovered && !completed && (
        <button
          type="button"
          onClick={() => onSettings?.(id)}
          className="flex-shrink-0 w-6 h-6 relative hover:bg-grey-100 rounded transition-colors"
          aria-label="설정"
        >
          <Icon icon="icon-park:more-one" className="w-6 h-6 text-grey-700" />
        </button>
      )}
    </div>
  );
}

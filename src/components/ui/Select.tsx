'use client';
import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = '선택하세요',
  label,
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 선택된 옵션 라벨 가져오기
  const getDisplayLabel = () => {
    if (!value) return placeholder;
    return options.find(opt => opt.value === value)?.label || placeholder;
  };

  // 옵션 선택 핸들러
  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange?.(optionValue);
    setIsOpen(false);
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 키보드 이벤트
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col gap-2 ${className}`}
    >
      {/* Label */}
      {label && (
        <label className="body-sm font-medium font-body text-grey-900">
          {label}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`
            w-full px-3 py-2
            bg-white rounded-[5px]
            border border-grey-300
            focus:border-primary-500 focus:outline-none
            body-xs font-normal font-body
            text-left
            transition-colors
            ${disabled ? 'bg-grey-200 text-grey-500 cursor-not-allowed' : 'cursor-pointer hover:border-grey-500'}
            ${!value ? 'text-grey-300' : 'text-grey-900'}
          `}
        >
          <div className="flex items-center justify-between">
            <span>{getDisplayLabel()}</span>
            <Icon
              icon="material-symbols:keyboard-arrow-down-rounded"
              className={`w-5 h-5 text-grey-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            className="
              absolute left-0 top-full mt-1 w-full
              bg-white rounded-[5px]
              border border-grey-300
              shadow-[2px_3px_8px_0px_rgba(0,0,0,0.08)]
              max-h-60 overflow-y-auto
              z-50
            "
          >
            {options.map(option => {
              const isSelected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-5 py-3 text-left
                    body-sm font-normal font-body
                    transition-colors
                    ${isSelected ? 'bg-grey-100 text-grey-900 font-medium' : 'text-grey-900 hover:bg-grey-50'}
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

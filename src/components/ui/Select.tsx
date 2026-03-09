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

  const getDisplayLabel = () => {
    if (!value) return placeholder;
    return options.find(opt => opt.value === value)?.label || placeholder;
  };

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    onChange?.(optionValue);
    setIsOpen(false);
  };

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
      className={`ui-component w-full flex flex-col gap-2 ${className}`}
    >
      {label && (
        <label className="body-sm font-medium font-body text-grey-900">
          {label}
        </label>
      )}

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
            w-full px-3 py-2 rounded-[5px] border body-sm font-medium font-body text-left
            bg-dark text-dark border-dark
            focus:outline-none focus:border-primary-500
            transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isOpen ? 'border-primary-500' : ''}
            ${!value ? 'text-grey-500' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <span className="truncate">{getDisplayLabel()}</span>
            <Icon
              icon="material-symbols:keyboard-arrow-down-rounded"
              className={`w-6 h-6 flex-shrink-0 text-grey-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute left-0 top-full mt-1 w-full rounded-[5px] border border-dark bg-dark shadow-lg max-h-60 overflow-y-auto z-50"
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
                    w-full px-3 py-2 text-left body-sm font-body text-dark transition-colors
                    hover:bg-grey-200
                    ${isSelected ? 'bg-grey-200 font-medium' : 'font-normal'}
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

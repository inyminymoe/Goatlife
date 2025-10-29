'use client';
import type { KeyboardEvent } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import clsx from 'clsx';

type CheckboxProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  className?: string;
  id?: string;
};

export default function Checkbox({
  checked,
  onChange,
  label,
  className,
  id,
}: CheckboxProps) {
  const toggle = () => onChange(!checked);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={clsx(
        'inline-flex items-center gap-2 select-none',
        'focus:outline-none focus-visible:outline-none focus-visible:ring-0 rounded-[6px] px-1 py-1',
        className
      )}
    >
      <span className="flex-shrink-0 w-6 h-6 relative">
        {checked ? (
          <Icon
            icon="icon-park:check-one"
            className="w-6 h-6 text-primary-500"
          />
        ) : (
          <Image
            src="/images/icons/icon_unchecked.svg"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
        )}
      </span>
      {label && (
        <span className="body-sm font-medium text-grey-900 dark:text-grey-100">
          {label}
        </span>
      )}
    </button>
  );
}

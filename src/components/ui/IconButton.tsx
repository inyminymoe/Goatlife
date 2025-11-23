'use client';
import { ButtonHTMLAttributes } from 'react';
import { Icon } from '@iconify/react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  activeIcon?: string;
  label?: string;
  variant?: 'outline' | 'ghost';
  active?: boolean;
  onActiveChange?: (active: boolean) => void;
}

export default function IconButton({
  icon,
  activeIcon,
  label,
  variant = 'outline',
  active = false,
  onActiveChange,
  className = '',
  onClick,
  ...props
}: IconButtonProps) {
  const baseClasses =
    'px-3 py-2 rounded-[5px] inline-flex items-center gap-1 transition-colors';

  const variantClasses =
    variant === 'outline'
      ? 'bg-white border border-grey-200 hover:bg-grey-100'
      : 'bg-transparent hover:bg-grey-100';

  const displayIcon = active && activeIcon ? activeIcon : icon;
  const iconColor = active ? 'text-primary-500' : 'text-grey-900';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onActiveChange?.(!active);
  };

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      <Icon icon={displayIcon} className={`w-5 h-5 ${iconColor}`} />
      {label ? (
        <span className="body-xs font-medium text-grey-900">{label}</span>
      ) : null}
    </button>
  );
}

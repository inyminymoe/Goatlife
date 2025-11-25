'use client';
import { ButtonHTMLAttributes, ReactNode, MouseEvent } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'text'
    | 'plain'
    | 'filter';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  active?: boolean;
  onActiveChange?: (next: boolean) => void;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  disabled,
  className = '',
  active = false,
  onActiveChange,
  onClick,
  type,
  children,
  ...props
}: ButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'plain':
        return '';
      case 'primary':
        return 'bg-primary-500 text-white hover:bg-primary-900 disabled:opacity-50 transition-colors duration-150';
      case 'secondary':
        return 'bg-fixed-grey-700 text-fixed-white hover:bg-fixed-grey-900 disabled:opacity-50 transition-colors duration-150';
      case 'text':
        return 'bg-fixed-white text-fixed-grey-900 hover:bg-fixed-grey-500 hover:text-fixed-white disabled:opacity-50 transition-colors duration-150';
      case 'outline':
        return 'bg-fixed-white text-fixed-grey-900 border border-fixed-grey-200 hover:bg-fixed-grey-100 disabled:opacity-50 transition-colors duration-150';
      case 'ghost':
        return 'bg-transparent text-fixed-grey-900 hover:bg-fixed-grey-100 disabled:opacity-50 transition-colors duration-150';
      case 'filter':
        return active
          ? 'bg-fixed-grey-900 text-fixed-white border border-fixed-grey-900 hover:bg-fixed-grey-800 disabled:opacity-50 px-4 py-2 body-xs font-medium'
          : 'bg-fixed-white text-fixed-grey-900 border border-fixed-grey-200 hover:bg-fixed-grey-100 disabled:opacity-50 px-4 py-2 body-xs font-medium';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    if (variant === 'filter') return '';
    switch (size) {
      case 'sm':
        return 'px-3 py-2 body-xs font-medium'; // 12px, Medium
      case 'md':
        return 'px-4 py-2 body-sm font-medium'; // 14px, Medium
      case 'lg':
        return 'px-20 py-2 body-sm font-medium'; // 14px, Medium (legacy usage)
      default:
        return '';
    }
  };

  const radiusClass = variant === 'filter' ? 'rounded-[20px]' : 'rounded-[5px]';

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (variant === 'filter' && onActiveChange) {
      onActiveChange(!active);
    }
    onClick?.(e);
  };

  return (
    <button
      type={type ?? 'button'}
      disabled={disabled}
      aria-pressed={variant === 'filter' ? !!active : undefined}
      className={`
        ui-component
        ${radiusClass}
        font-body
        inline-flex items-center justify-center gap-2
        transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
        disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      onClick={handleClick}
      {...props}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
}

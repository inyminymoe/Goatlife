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
        return 'bg-primary-500 text-white hover:bg-primary-900 disabled:opacity-50';
      case 'secondary':
        return 'bg-grey-700 text-white hover:bg-grey-900 disabled:opacity-50';
      case 'text':
        return 'bg-white text-grey-700 hover:bg-grey-100 disabled:opacity-50';
      case 'outline':
        return 'bg-white text-grey-900 border border-grey-200 hover:bg-grey-100 disabled:opacity-50';
      case 'ghost':
        return 'bg-transparent text-grey-900 hover:bg-grey-100 disabled:opacity-50';
      case 'filter':
        return active
          ? 'bg-grey-900 text-white border border-grey-900 hover:bg-grey-800 disabled:opacity-50 px-4 py-2 body-xs font-medium'
          : 'bg-white text-grey-900 border border-grey-300 hover:bg-grey-100 disabled:opacity-50 px-4 py-2 body-xs font-medium';
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

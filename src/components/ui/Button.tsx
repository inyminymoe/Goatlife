import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
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
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 body-xs font-medium'; // 12px, Medium
      case 'md':
        return 'px-8 py-2 body-sm font-medium'; // 14px, Medium
      case 'lg':
        return 'px-20 py-2 body-sm font-medium'; // 14px, Medium
      default:
        return '';
    }
  };

  return (
    <button
      disabled={disabled}
      className={`
        rounded-[5px]
        font-body
        inline-flex items-center justify-center gap-1
        transition-colors
        disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </button>
  );
}

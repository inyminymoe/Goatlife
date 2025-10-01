// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
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
        return 'bg-grey-900 text-white hover:bg-grey-700 disabled:opacity-50';
      case 'ghost':
        return 'bg-transparent text-white hover:bg-white/10 disabled:opacity-50';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 body-xs';
      case 'md':
        return 'px-4 py-2 body-sm';
      case 'lg':
        return 'px-6 py-3 body-base';
      default:
        return '';
    }
  };

  return (
    <button
      disabled={disabled}
      className={`
        rounded-[5px]
        font-bold font-body
        transition-colors
        disabled:cursor-not-allowed
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

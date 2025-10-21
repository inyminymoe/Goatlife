import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '@iconify/react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  showPassword?: boolean;
  variant?: 'light' | 'dark';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      rightIcon,
      showPasswordToggle,
      onPasswordToggle,
      showPassword,
      disabled,
      variant = 'light',
      className = '',
      ...props
    },
    ref
  ) => {
    const getLabelColor = () => {
      return variant === 'dark' ? 'text-white' : 'text-grey-900';
    };

    const getInputBorderColor = () => {
      if (error) return 'border-accent-magenta-300';
      if (success) return 'border-primary-500';
      return 'border-grey-300 focus:border-primary-500';
    };

    const getHelperTextColor = () => {
      if (error) return 'text-accent-magenta-300';
      if (success) return 'text-primary-500';
      return 'text-grey-500';
    };

    return (
      <div className="w-full flex flex-col gap-2">
        {/* Label */}
        {label && (
          <label
            className={`body-sm font-regular font-body ${getLabelColor()}`}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={`
              w-full px-3 py-2
              bg-white rounded-[5px]
              border ${getInputBorderColor()}
              body-xs font-regular font-body text-grey-900
              placeholder:text-grey-300
              focus:outline-none
              disabled:bg-grey-200 disabled:text-grey-500 disabled:cursor-not-allowed
              transition-colors
              ${className}
            `}
            {...props}
          />

          {/* Right Icon or Password Toggle */}
          {(showPasswordToggle || rightIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={onPasswordToggle}
                  className="w-4 h-4 text-grey-500 hover:text-grey-700"
                  tabIndex={-1}
                >
                  <Icon
                    icon={
                      showPassword
                        ? 'material-symbols:lock-open-outline-rounded'
                        : 'material-symbols:lock-outline'
                    }
                    className="w-5 h-5 text-grey-500"
                  />
                </button>
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {(error || success) && (
          <p
            className={`text-10 font-medium font-body ${getHelperTextColor()}`}
          >
            {error || success}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

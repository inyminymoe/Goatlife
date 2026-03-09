'use client';
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
  /** 다크 배경 위에서 사용할 때 라벨을 흰색으로 표시 */
  variant?: 'light' | 'dark';

  // 특수 모드
  mode?: 'input' | 'withButton' | 'disabled';
  buttonLabel?: string;
  onButtonClick?: () => void;
  displayText?: string; // withButton/disabled 모드에서 표시할 텍스트
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
      mode = 'input',
      buttonLabel = 'TEST',
      onButtonClick,
      displayText,
      ...props
    },
    ref
  ) => {
    const borderClass = error
      ? 'border-fixed-accent-magenta-300'
      : success
        ? 'border-fixed-primary-500'
        : 'border-fixed-grey-200 focus:border-fixed-primary-500';

    return (
      <div className="ui-component w-full flex flex-col gap-2">
        {/* Label */}
        {label && (
          <label
            className={`body-sm font-medium font-body ${
              variant === 'dark' ? 'text-fixed-white' : 'text-fixed-grey-900'
            }`}
          >
            {label}
          </label>
        )}

        {/* Input Variants */}
        {mode === 'withButton' ? (
          <div className="px-3 py-2 bg-fixed-grey-200 rounded-[5px] flex items-center justify-between gap-2">
            <span className="body-sm text-fixed-grey-500 font-medium truncate flex-1">
              {displayText || '업무유형 테스트 결과가 없습니다'}
            </span>
            <button
              type="button"
              onClick={onButtonClick}
              className="bg-fixed-grey-900 text-fixed-white hover:bg-fixed-grey-700 px-3 py-2 rounded-[5px] body-xs font-medium flex-shrink-0 transition-colors"
            >
              {buttonLabel}
            </button>
          </div>
        ) : mode === 'disabled' ? (
          <div className="p-3 bg-fixed-grey-200 rounded-[5px]">
            <span className="body-sm text-fixed-grey-500 font-medium">
              {displayText || props.value || props.placeholder}
            </span>
          </div>
        ) : (
          <div className="relative">
            <input
              ref={ref}
              disabled={disabled}
              className={`
                w-full px-3 py-2
                rounded-[5px] border
                body-sm font-medium font-body
                bg-fixed-white text-fixed-grey-900
                placeholder:text-fixed-grey-300
                focus:outline-none
                transition-colors
                disabled:bg-fixed-grey-200 disabled:text-fixed-grey-500
                ${borderClass}
                ${className}
              `}
              {...props}
            />

            {/* Password Toggle / Right Icon */}
            {(showPasswordToggle || rightIcon) && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                {showPasswordToggle ? (
                  <button
                    type="button"
                    onClick={onPasswordToggle}
                    className="transition-colors"
                    tabIndex={-1}
                  >
                    <Icon
                      icon={
                        showPassword
                          ? 'material-symbols:lock-open-outline-rounded'
                          : 'material-symbols:lock-outline'
                      }
                      className="w-5 h-5 text-fixed-grey-500"
                    />
                  </button>
                ) : (
                  rightIcon
                )}
              </div>
            )}
          </div>
        )}

        {/* Helper Text */}
        {(error || success) && (
          <p
            className={`text-10 font-medium font-body ${
              error ? 'text-fixed-accent-magenta-300' : 'text-fixed-primary-500'
            }`}
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

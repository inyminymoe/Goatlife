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
    return (
      <div className="ui-component w-full flex flex-col gap-2">
        {/* Label */}
        {label && (
          <label
            className="body-sm font-medium font-body"
            style={{
              color:
                variant === 'dark'
                  ? 'hsl(0, 0%, 100%)'
                  : 'var(--color-dark-text)',
            }}
          >
            {label}
          </label>
        )}

        {/* Input Variants */}
        {mode === 'withButton' ? (
          // input_text+button
          <div className="px-3 py-2 bg-grey-200 rounded-[5px] flex items-center justify-between gap-2">
            <span className="body-sm text-grey-500 font-medium truncate flex-1">
              {displayText || '업무유형 테스트 결과가 없습니다'}
            </span>
            <button
              type="button"
              onClick={onButtonClick}
              className="btn-fixed px-3 py-2 rounded-[5px] body-xs font-medium flex-shrink-0 transition-colors"
            >
              {buttonLabel}
            </button>
            <style jsx>{`
              .btn-fixed {
                background-color: hsl(0, 0%, 21%);
                color: hsl(0, 0%, 100%);
              }
              .btn-fixed:hover {
                background-color: hsl(0, 0%, 28%);
              }
            `}</style>
          </div>
        ) : mode === 'disabled' ? (
          // input_disabled (읽기 전용)
          <div className="p-3 bg-grey-200 rounded-[5px]">
            <span className="body-sm text-grey-500 font-medium">
              {displayText || props.value || props.placeholder}
            </span>
          </div>
        ) : (
          // 일반 input
          <div className="relative">
            <input
              ref={ref}
              disabled={disabled}
              className={`
                w-full px-3 py-2
                rounded-[5px] border
                body-sm font-medium font-body
                focus:outline-none
                transition-colors
                ${className}
              `}
              style={{
                backgroundColor: disabled
                  ? 'hsl(0, 0%, 92%)'
                  : 'hsl(0, 0%, 100%)',
                borderColor: error
                  ? 'hsl(296, 94%, 77%)'
                  : success
                    ? 'hsl(212, 100%, 60%)'
                    : 'hsl(0, 0%, 78%)',
                color: disabled ? 'hsl(0, 0%, 48%)' : 'hsl(0, 0%, 21%)',
              }}
              {...props}
            />

            {/* Placeholder & Focus 스타일 */}
            <style jsx>{`
              input::placeholder {
                color: hsl(0, 0%, 78%);
                font-size: 0.875rem;
                font-weight: 400;
              }
              input:focus {
                border-color: hsl(212, 100%, 60%);
              }
            `}</style>

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
                      className="w-5 h-5"
                      style={{ color: 'hsl(0, 0%, 48%)' }}
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
            className="text-10 font-medium font-body"
            style={{
              color: error ? 'hsl(296, 94%, 77%)' : 'hsl(212, 100%, 60%)',
            }}
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

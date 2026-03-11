'use client';
import {
  forwardRef,
  TextareaHTMLAttributes,
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
} from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'both';
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      maxLength,
      resize = 'none',
      disabled,
      value,
      defaultValue,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    // 초기 텍스트(Controlled/Uncontrolled 모두 커버)
    const initialText =
      typeof value === 'string'
        ? value
        : typeof defaultValue === 'string'
          ? defaultValue
          : '';

    const [charCount, setCharCount] = useState<number>(initialText.length);

    // Controlled 모드일 때 value 변경 반영
    useEffect(() => {
      if (typeof value === 'string') {
        setCharCount(value.length);
      }
    }, [value]);

    // 입력 핸들러: Uncontrolled에서도 내부 카운트 업데이트 + 상위 onChange 전달
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLTextAreaElement>) => {
        // 부모에서 value를 관리하지 않는 경우(=Uncontrolled)에도 카운트는 항상 갱신
        if (typeof value !== 'string') {
          setCharCount(e.target.value.length);
        }
        onChange?.(e);
      },
      [onChange, value]
    );

    const getResizeClass = () => {
      switch (resize) {
        case 'vertical':
          return 'resize-y';
        case 'both':
          return 'resize';
        case 'none':
        default:
          return 'resize-none';
      }
    };

    return (
      <div className="ui-component w-full flex flex-col gap-2">
        {/* Label */}
        {label && (
          <label
            className="body-sm font-medium font-body"
            style={{ color: 'var(--color-dark-text)' }}
          >
            {label}
          </label>
        )}

        {/* TextArea Container with Counter */}
        <div
          className="relative rounded-[5px] border transition-colors"
          style={{
            backgroundColor: disabled ? 'hsl(0, 0%, 92%)' : 'hsl(0, 0%, 100%)',
            borderColor: error ? 'hsl(296, 94%, 77%)' : 'hsl(0, 0%, 78%)',
          }}
        >
          <textarea
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            // Controlled: value 전달 / Uncontrolled: value 미전달 + defaultValue만 전달
            {...(typeof value === 'string' ? { value } : {})}
            {...(typeof value !== 'string' && defaultValue !== undefined
              ? { defaultValue }
              : {})}
            onChange={handleChange}
            className={`
              w-full px-3 py-2
              bg-transparent
              body-sm font-medium font-body
              focus:outline-none
              ${getResizeClass()}
              ${className}
            `}
            style={{
              color: disabled ? 'hsl(0, 0%, 48%)' : 'hsl(0, 0%, 21%)',
              minHeight: '80px',
            }}
            {...props}
          />
          {/* Character Count - Inside Border */}
          {typeof maxLength === 'number' && maxLength > 0 && (
            <div
              className="w-full px-3 py-2 text-right body-2xs font-medium font-body"
              style={{ color: 'hsl(0, 0%, 78%)' }}
            >
              {charCount}/{maxLength}
            </div>
          )}
        </div>

        {/* Placeholder 스타일 */}
        <style jsx>{`
          textarea::placeholder {
            color: hsl(0, 0%, 78%);
            font-weight: 400;
          }
          textarea:focus {
            outline: none;
          }
          div:focus-within {
            border-color: hsl(212, 100%, 60%);
          }
        `}</style>

        {/* Error Text */}
        {error && (
          <p
            className="text-10 font-medium font-body"
            style={{ color: 'hsl(296, 94%, 77%)' }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;

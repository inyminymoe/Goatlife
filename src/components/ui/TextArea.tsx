import { forwardRef, TextareaHTMLAttributes } from 'react';

export interface TextAreaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  showCount?: boolean;
  resize?: 'none' | 'vertical' | 'both';
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      maxLength,
      showCount = false,
      resize = 'none',
      disabled,
      value = '',
      className = '',
      ...props
    },
    ref
  ) => {
    const currentLength =
      typeof value === 'string' ? value.length : String(value).length;

    const getBorderColor = () => {
      if (error) return 'outline-accent-magenta-300';
      return 'outline-grey-300 focus:outline-primary-500';
    };

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
      <div className="w-full flex flex-col gap-2">
        {/* Label */}
        {label && (
          <label className="body-sm font-medium font-body text-grey-900">
            {label}
          </label>
        )}

        {/* TextArea Container */}
        <div className="relative">
          <textarea
            ref={ref}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            className={`
              w-full px-4 py-2
              bg-white rounded-[5px]
              outline outline-1 outline-offset-[-1px] ${getBorderColor()}
              body-sm font-medium font-body text-grey-900
              placeholder:text-grey-300
              focus:outline-2
              transition-colors
              ${getResizeClass()}
              ${className}
            `}
            {...props}
          />

          {/* Character Count */}
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-4 text-right text-grey-300 text-10 font-medium font-body leading-tight pointer-events-none">
              {currentLength}/{maxLength}
            </div>
          )}
        </div>

        {/* Error Text */}
        {error && (
          <p className="text-10 font-medium font-body text-accent-magenta-300">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;

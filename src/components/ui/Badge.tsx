import React from 'react';

type BadgeVariant = 'white' | 'blue' | 'blackRounded' | 'calendar';
type BadgeSize = 'xs' | 'sm';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** 캘린더용 점 아이콘 표시 여부 (variant='calendar'일 때만) */
  dot?: boolean;
  /** 배지 텍스트 */
  children: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center whitespace-nowrap select-none';

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'h-5 px-2 text-[10px] font-medium rounded-[10px]',
  sm: 'h-7 px-3 text-xs font-medium rounded-[14px]',
};

const variantStyles: Record<BadgeVariant, string> = {
  white: 'bg-white text-grey-500 outline outline-1 outline-grey-500',
  blue: 'bg-primary-100 text-primary-500 rounded-sm',
  blackRounded: 'bg-fixed-grey-900 text-white rounded-[10px]',
  calendar:
    'bg-white text-grey-500 outline outline-1 outline-grey-300 rounded-2xl gap-2',
};

const dotBase = 'shrink-0 inline-block w-2 h-2 rounded-full';

export function Badge({
  variant = 'white',
  size = 'sm',
  dot = false,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const classes = [
    'ui-component',
    base,
    sizeStyles[size],
    variantStyles[variant],
    'transition-colors duration-150',
    className,
  ].join(' ');

  return (
    <div className={classes} {...rest}>
      {variant === 'calendar' && dot && (
        <span className={`${dotBase} bg-primary-500`} />
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

export default Badge;

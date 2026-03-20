'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

export type CalendarStatus =
  | 'working'
  | 'late'
  | 'early_leave'
  | 'holiday'
  | 'absence'
  | 'none';

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  status?: CalendarStatus | CalendarStatus[];
};

type StatusMap = Record<number, CalendarStatus | CalendarStatus[]>;

export type CalendarProps = {
  year: number;
  month: number; // 0-based
  today?: Date;
  selectedDays?: number[];
  statusMap?: StatusMap;
  onPrev?: () => void;
  onNext?: () => void;
  onDayClick?: (date: Date) => void;
  hideHeader?: boolean;
  compact?: boolean;
  className?: string;
};

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const STATUS_COLOR_VAR: Record<CalendarStatus, string> = {
  working: 'var(--color-status-working)', // primary-500 (blue)
  late: 'var(--color-accent-orange-400)', // accent-orange-400
  early_leave: 'var(--color-grey-500)', // grey-500
  holiday: 'var(--color-status-holiday)', // accent-green-500
  absence: 'var(--color-status-absence)', // accent-magenta-300
  none: 'transparent',
};

function StatusDots({
  statuses,
  sizePx,
}: {
  statuses: CalendarStatus[];
  sizePx: number;
}) {
  const colors = statuses
    .map(s => STATUS_COLOR_VAR[s])
    .filter(c => c !== 'transparent');

  if (colors.length === 0) {
    return (
      <span
        style={{ width: sizePx, height: sizePx, display: 'inline-block' }}
      />
    );
  }

  if (colors.length === 1) {
    return (
      <span
        className="rounded-full shrink-0"
        style={{ width: sizePx, height: sizePx, backgroundColor: colors[0] }}
        aria-hidden="true"
      />
    );
  }

  const overlap = Math.round(sizePx * 0.45);
  const totalWidth = sizePx + (colors.length - 1) * overlap;

  return (
    <span
      className="relative shrink-0 inline-block"
      style={{ width: totalWidth, height: sizePx }}
      aria-hidden="true"
    >
      {colors.map((color, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            width: sizePx,
            height: sizePx,
            backgroundColor: color,
            left: i * overlap,
            zIndex: colors.length - i,
          }}
        />
      ))}
    </span>
  );
}

function buildMonthDays(
  year: number,
  month: number,
  today: Date,
  statusMap: StatusMap,
  selected: Set<number>
) {
  const start = new Date(year, month, 1);
  const startWeekday = (start.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const date = new Date(year, month, -i);
    days.push({ date, inCurrentMonth: false, status: 'none' });
  }

  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, month, d);
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
    days.push({
      date,
      inCurrentMonth: true,
      isToday,
      isSelected: selected.has(d) || isToday,
      status: statusMap[d] ?? 'none',
    });
  }

  const remainder = days.length % 7;
  if (remainder !== 0) {
    const needed = 7 - remainder;
    for (let i = 1; i <= needed; i += 1) {
      const date = new Date(year, month + 1, i);
      days.push({ date, inCurrentMonth: false, status: 'none' });
    }
  }

  return days;
}

function formatYYYYMM(year: number, month: number) {
  return `${year}.${String(month + 1).padStart(2, '0')}`;
}

export function Calendar({
  year,
  month,
  today = new Date(),
  selectedDays = [],
  statusMap = {},
  onPrev,
  onNext,
  onDayClick,
  hideHeader = false,
  compact = false,
  className = '',
}: CalendarProps) {
  const [view, setView] = useState({ year, month });

  const isControlled = Boolean(onPrev || onNext);

  useEffect(() => {
    if (isControlled) {
      setView({ year, month });
    }
  }, [isControlled, year, month]);

  const handlePrev = () => {
    if (onPrev) {
      onPrev();
      return;
    }
    setView(prev => {
      const isJanuary = prev.month === 0;
      const nextMonth = isJanuary ? 11 : prev.month - 1;
      const nextYear = isJanuary ? prev.year - 1 : prev.year;
      return { year: nextYear, month: nextMonth };
    });
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
      return;
    }
    setView(prev => {
      const isDecember = prev.month === 11;
      const nextMonth = isDecember ? 0 : prev.month + 1;
      const nextYear = isDecember ? prev.year + 1 : prev.year;
      return { year: nextYear, month: nextMonth };
    });
  };

  const selectedSet = new Set(selectedDays);
  const days = buildMonthDays(
    view.year,
    view.month,
    today,
    statusMap,
    selectedSet
  );
  const paddingClass = compact ? 'p-3' : 'p-6';
  const dotSizePx = compact ? 6 : 8;
  const gapClass = compact ? 'gap-4' : 'gap-6';
  const dayGapClass = compact ? 'gap-y-3' : 'gap-y-4';

  return (
    <section
      className={`bg-grey-100 rounded-[5px] flex flex-col w-full ${paddingClass} ${gapClass} ${className}`}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-grey-200 transition-colors"
            aria-label="previous month"
            onClick={handlePrev}
          >
            <Icon
              icon="lucide:chevron-left"
              className="w-5 h-5 text-grey-500"
            />
          </button>
          <h3 className="text-base text-grey-900 font-normal font-['DNF_Bit_Bit_v2']">
            {formatYYYYMM(view.year, view.month)}
          </h3>
          <button
            type="button"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-grey-200 transition-colors"
            aria-label="next month"
            onClick={handleNext}
          >
            <Icon
              icon="lucide:chevron-right"
              className="w-5 h-5 text-grey-500"
            />
          </button>
        </div>
      )}

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-grey-500">
        {WEEK_LABELS.map(label => (
          <span key={label} className="py-1">
            {label}
          </span>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${dayGapClass} text-center`}>
        {days.map(day => {
          const dayNum = day.date.getDate();
          const isInactive = !day.inCurrentMonth;
          const rawStatus = day.status ?? 'none';
          const statuses = Array.isArray(rawStatus) ? rawStatus : [rawStatus];

          return (
            <div
              key={day.date.toISOString()}
              className={`flex flex-col items-center gap-2 ${onDayClick && day.inCurrentMonth ? 'cursor-pointer' : ''}`}
              onClick={
                onDayClick && day.inCurrentMonth
                  ? () => onDayClick(day.date)
                  : undefined
              }
            >
              <span
                className={`text-xs font-medium px-1 py-0.5 ${
                  day.isToday
                    ? 'bg-grey-900 text-white rounded-[5px]'
                    : isInactive
                      ? 'text-grey-300'
                      : 'text-grey-900'
                }`}
              >
                {dayNum}
              </span>
              <StatusDots statuses={statuses} sizePx={dotSizePx} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

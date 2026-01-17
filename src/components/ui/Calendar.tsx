import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

export type CalendarStatus =
  | 'working'
  | 'holiday'
  | 'break'
  | 'absence'
  | 'none';

type CalendarDay = {
  date: Date;
  inCurrentMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  status?: CalendarStatus;
};

type StatusMap = Record<number, CalendarStatus>;

export type CalendarProps = {
  year: number;
  month: number; // 0-based
  today?: Date;
  selectedDays?: number[];
  statusMap?: StatusMap;
  onPrev?: () => void;
  onNext?: () => void;
  hideHeader?: boolean;
  compact?: boolean;
  className?: string;
};

const WEEK_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const STATUS_COLOR_VAR: Record<CalendarStatus, string> = {
  working: 'var(--color-status-working)',
  holiday: 'var(--color-status-holiday)',
  break: 'var(--color-status-break)',
  absence: 'var(--color-status-absence)',
  none: 'transparent',
};

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
  const dotClass = compact ? 'w-[6px] h-[6px]' : 'w-2 h-2';
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
          const statusColor = STATUS_COLOR_VAR[day.status ?? 'none'];

          return (
            <div
              key={day.date.toISOString()}
              className="flex flex-col items-center gap-2"
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
              <span
                className={`${dotClass} rounded-full`}
                style={{ backgroundColor: statusColor }}
                aria-hidden="true"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

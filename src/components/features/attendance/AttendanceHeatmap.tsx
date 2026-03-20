'use client';

import clsx from 'clsx';
import { Icon } from '@iconify/react';
import { useMemo } from 'react';
import { useAttendanceLogs } from '@/hooks/useAttendanceLogs';
import { getKstDateString } from '@/lib/attendance';

type HeatStatus = 'in' | 'out' | 'empty';

type HeatCell = {
  day: number;
  status: HeatStatus;
};

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
const DAY_LABELS = Array.from(
  { length: 37 },
  (_, i) => ['월', '화', '수', '목', '금', '토', '일'][i % 7]
);

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month === 1 && isLeapYear(year) ? 29 : days[month];
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // 0=월요일 기준
}

export function AttendanceHeatmap() {
  const today = getKstDateString();
  const year = Number(today.split('-')[0]);
  const yearRange = useMemo(
    () => ({ from: `${year}-01-01`, to: `${year}-12-31` }),
    [year]
  );

  const { logs } = useAttendanceLogs(yearRange);

  const heatmap = useMemo<HeatCell[][]>(() => {
    const logMap = new Map(logs.map(r => [r.date, r]));

    return MONTH_LABELS.map((_, monthIdx) => {
      const daysInMonth = getDaysInMonth(year, monthIdx);
      const firstDay = getFirstDayOfMonth(year, monthIdx);
      const cells: HeatCell[] = [];

      // 앞 빈 셀
      for (let i = 0; i < firstDay; i++) {
        cells.push({ day: 0, status: 'empty' });
      }

      // 날짜 셀
      for (let day = 1; day <= daysInMonth; day++) {
        const mm = String(monthIdx + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateStr = `${year}-${mm}-${dd}`;
        const record = logMap.get(dateStr);

        let status: HeatStatus;
        if (record && dateStr <= today && record.status !== 'absent') {
          status = 'in';
        } else {
          status = 'out'; // 결근·기록없음·미래 모두 primary-100으로 표시
        }

        cells.push({ day, status });
      }

      // 뒤 빈 셀 (37칸 맞추기)
      const filled = firstDay + daysInMonth;
      for (let i = filled; i < 37; i++) {
        cells.push({ day: 0, status: 'empty' });
      }

      return cells;
    });
  }, [logs, year, today]);

  return (
    <div className="w-full max-w-[1440px] bg-grey-100 rounded-[5px] p-6">
      <div className="mb-6 inline-flex justify-start items-end gap-1">
        <Icon
          icon="icon-park:endocrine"
          className="w-6 h-6 icon-dark-invert"
          aria-hidden="true"
        />
        <h2 className="text-grey-900 text-base font-normal font-['DNF_Bit_Bit_v2']">
          {year}년도 근태 기록
        </h2>
      </div>

      <div className="overflow-x-auto scrollbar-none -mx-6 px-6">
        <div className="flex gap-2 min-w-max">
          {/* 월 라벨 */}
          <div className="flex flex-col gap-[5px] pt-6">
            {MONTH_LABELS.map((label, idx) => (
              <div
                key={`month-${idx}`}
                className="h-5 flex items-center justify-end pr-2 text-grey-500 text-xs font-medium font-['S-Core_Dream']"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 요일 헤더 + 히트맵 */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-[5px]">
              {DAY_LABELS.map((label, idx) => (
                <div
                  key={`day-${idx}`}
                  className="w-5 text-center text-grey-500 text-xs font-medium font-['S-Core_Dream']"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-[5px]">
              {heatmap.map((row, rowIdx) => (
                <div key={`row-${rowIdx}`} className="flex gap-[5px]">
                  {row.map((cell, cellIdx) => {
                    if (cell.status === 'empty') {
                      return (
                        <div
                          key={`${rowIdx}-${cellIdx}`}
                          className="size-5 bg-grey-300 rounded-[5px]"
                        />
                      );
                    }

                    const isDoubleDigit = cell.day >= 10;
                    const paddingX = isDoubleDigit ? 'px-[3px]' : 'px-1.5';

                    return (
                      <div
                        key={`${rowIdx}-${cellIdx}`}
                        className={clsx(
                          'size-5 py-0.5 rounded-[5px] flex items-center justify-center',
                          paddingX,
                          cell.status === 'in'
                            ? 'bg-primary-500'
                            : 'bg-primary-100'
                        )}
                      >
                        <div
                          className={clsx(
                            'text-[10px] font-["S-Core_Dream"] leading-none',
                            cell.status === 'in'
                              ? 'font-medium text-white'
                              : 'font-bold text-primary-500'
                          )}
                        >
                          {cell.day}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

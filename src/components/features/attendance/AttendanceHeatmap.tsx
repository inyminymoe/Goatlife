'use client';

import clsx from 'clsx';
import { Icon } from '@iconify/react';

type HeatStatus = 'in' | 'out' | 'empty';

type HeatCell = {
  day: number;
  status: HeatStatus;
};

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2025년은 평년

// 요일 라벨: 37개 (최대 한 달 + 빈 셀)
const DAY_LABELS = Array.from(
  { length: 37 },
  (_, i) => ['월', '화', '수', '목', '금', '토', '일'][i % 7]
);

// 2025년 각 월 1일의 요일 계산 (0=월요일, 1=화요일, ..., 6=일요일)
const getFirstDayOfMonth = (year: number, month: number): number => {
  const date = new Date(year, month, 1);
  const day = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  return (day + 6) % 7; // 월요일 기준으로 변환
};

// 2025년 캘린더 데이터
const dummyHeatmap: HeatCell[][] = MONTH_LABELS.map((_, monthIdx) => {
  const daysInMonth = DAYS_IN_MONTH[monthIdx];
  const firstDay = getFirstDayOfMonth(2025, monthIdx);
  const cells: HeatCell[] = [];

  // 앞 빈 셀 (월 시작 전)
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, status: 'empty' });
  }

  // 실제 날짜 셀
  for (let day = 1; day <= daysInMonth; day++) {
    const status = (monthIdx + day) % 3 === 0 ? 'out' : 'in';
    cells.push({ day, status });
  }

  // 뒤 빈 셀 (37개 맞추기)
  const totalCells = firstDay + daysInMonth;
  const emptyCells = 37 - totalCells;
  for (let i = 0; i < emptyCells; i++) {
    cells.push({ day: 0, status: 'empty' });
  }

  return cells;
});

export function AttendanceHeatmap() {
  return (
    <div className="w-full max-w-[1440px] bg-grey-100 rounded-[5px] p-6">
      {/* 제목 */}
      <div className="mb-6 inline-flex justify-start items-end gap-1">
        <Icon
          icon="icon-park:endocrine"
          className="w-6 h-6 text-primary-500"
          aria-hidden="true"
        />
        <h2 className="text-grey-900 text-base font-normal font-['DNF_Bit_Bit_v2']">
          이번 년도 근태 기록
        </h2>
      </div>

      {/* 히트맵 컨테이너 */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex gap-2 min-w-max">
          {/* 월 라벨 (왼쪽) */}
          <div className="flex flex-col gap-[5px] pt-6">
            {MONTH_LABELS.map((label, idx) => (
              <div
                key={`month-${idx}`}
                className="h-5 flex items-center justify-end pr-2 text-grey-300 text-xs font-medium font-['S-Core_Dream']"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 요일 헤더 + 히트맵 */}
          <div className="flex flex-col gap-1">
            {/* 요일 헤더 */}
            <div className="flex gap-[5px]">
              {DAY_LABELS.map((label, idx) => (
                <div
                  key={`day-${idx}`}
                  className="w-5 text-center text-grey-300 text-xs font-medium font-['S-Core_Dream']"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 히트맵 행들 */}
            <div className="flex flex-col gap-[5px]">
              {dummyHeatmap.map((row, rowIdx) => (
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
                            'text-[10px] font-medium font-["S-Core_Dream"] leading-none',
                            cell.status === 'in'
                              ? 'text-white'
                              : 'text-primary-500'
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

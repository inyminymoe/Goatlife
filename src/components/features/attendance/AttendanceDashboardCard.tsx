'use client';

import Checkbox from '@/components/ui/Checkbox';
import { Icon } from '@iconify/react';

const DAYS = [
  { label: '월', checked: true },
  { label: '화', checked: true },
  { label: '수', checked: true },
  { label: '목', checked: false },
  { label: '금', checked: false },
  { label: '토', checked: false },
  { label: '일', checked: false },
];

export default function AttendanceDashboardCard() {
  return (
    <section className="h-full rounded-[5px] bg-grey-100 p-6">
      <div className="flex h-full flex-col">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Icon
              icon="icon-park:ranking-list"
              className="h-6 w-6 icon-dark-invert"
              aria-hidden="true"
            />
            <h2
              id="attendance-dashboard"
              aria-labelledby="attendance-dashboard"
              className="brand-h3 text-grey-900"
            >
              근태현황
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 items-start">
            <div className="flex min-w-0 flex-col gap-1 text-left">
              <span className="body-sm font-semibold text-grey-300">
                입사한 지
              </span>
              <div className="inline-flex items-end gap-1">
                <span className="brand-h1 tabular-nums text-primary-500">
                  47
                </span>
                <span className="body-xs text-grey-500">일차</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 text-left">
              <span className="body-sm font-semibold text-grey-300">
                다음 승진까지
              </span>
              <div className="inline-flex items-end gap-1">
                <span className="brand-h1 tabular-nums text-primary-500">
                  23
                </span>
                <span className="body-xs text-grey-500">일</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-5">
          <span className="body-sm font-semibold text-grey-300 lg:hidden">
            이번 주 근무일
          </span>

          <div className="grid grid-cols-7 gap-2">
            {DAYS.map(day => (
              <div key={day.label} className="flex flex-col items-center gap-1">
                <span className="body-xs font-semibold text-grey-500">
                  {day.label}
                </span>
                <Checkbox
                  checked={day.checked}
                  onChange={() => {}}
                  className="pointer-events-none select-none px-0 py-0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

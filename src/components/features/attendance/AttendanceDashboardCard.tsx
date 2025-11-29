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
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5 h-full">
      <div className="flex items-end gap-1">
        <Icon
          icon="icon-park:endocrine"
          className="w-6 h-6 text-grey-900"
          aria-hidden="true"
        />
        <h2
          id="attendance-dashboard"
          aria-labelledby="attendance-dashboard"
          className="brand-h3 text-grey-900"
        >
          Dashboard
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-grey-300 leading-6">
            입사한 지
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl text-primary-500 font-normal font-['DNF_Bit_Bit_v2'] leading-8">
              47
            </span>
            <span className="text-xs text-grey-500 font-medium leading-5">
              일차
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-grey-300 leading-6">
            다음 승진까지
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl text-primary-500 font-normal font-['DNF_Bit_Bit_v2'] leading-8">
              23
            </span>
            <span className="text-xs text-grey-500 font-medium leading-5">
              일
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-6 flex-wrap">
        {DAYS.map(day => (
          <div key={day.label} className="flex flex-col items-center">
            <span className="text-xs font-semibold text-grey-500">
              {day.label}
            </span>
            <Checkbox
              checked={day.checked}
              onChange={() => {}}
              className="pointer-events-none select-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

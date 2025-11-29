'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Calendar } from './Calendar';

export function YearCalendar() {
  const [year, setYear] = useState(2025);
  const months = Array.from({ length: 12 }, (_, i) => i); // 0~11

  return (
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-grey-200 transition-colors"
          aria-label="previous year"
          onClick={() => setYear(prev => prev - 1)}
        >
          <Icon icon="lucide:chevron-left" className="w-5 h-5 text-grey-500" />
        </button>
        <h2 className="text-base text-grey-900 font-normal font-['DNF_Bit_Bit_v2']">
          {year}
        </h2>
        <button
          type="button"
          className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-grey-200 transition-colors"
          aria-label="next year"
          onClick={() => setYear(prev => prev + 1)}
        >
          <Icon icon="lucide:chevron-right" className="w-5 h-5 text-grey-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {months.map(month => (
          <div
            key={month}
            className="bg-white rounded-[5px] p-4 flex flex-col gap-2"
          >
            <div className="text-xs font-semibold text-grey-700">
              {month + 1}월
            </div>
            <Calendar
              year={year}
              month={month}
              hideHeader
              compact
              today={new Date()}
              selectedDays={[]}
              statusMap={{}}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

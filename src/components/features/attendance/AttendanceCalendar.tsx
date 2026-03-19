'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, type CalendarStatus } from '@/components/ui/Calendar';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { useAttendanceLogs } from '@/hooks/useAttendanceLogs';
import { isLateCheckIn } from '@/lib/attendance';
import { isKoreanHoliday } from '@/lib/korean-holidays';
import type { AttendanceRecord } from '@/types/attendance';

function toCalendarStatuses(record: AttendanceRecord): CalendarStatus[] {
  if (record.status === 'absent') return ['absence'];
  if (record.status === 'vacation') return ['holiday'];

  const statuses: CalendarStatus[] = [];
  if (isLateCheckIn(record.checkInAt)) statuses.push('late');
  if (record.earlyLeaveAt !== null) statuses.push('early_leave');
  if (statuses.length === 0) statuses.push('working');

  return statuses;
}

const LEGEND = [
  { label: '출근', color: 'var(--color-status-working)' },
  { label: '결근', color: 'var(--color-status-absence)' },
  { label: '지각', color: 'var(--color-accent-orange-400)' },
  { label: '조퇴', color: 'var(--color-grey-500)' },
  { label: '공휴일/휴가', color: 'var(--color-status-holiday)' },
] as const;

function formatKstTimeFull(iso: string | null): string {
  if (!iso) return '미등록';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

function formatWorkMinutes(minutes: number): string {
  if (!minutes) return '미등록';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-2">
      {LEGEND.map(({ label, color }) => (
        <div
          key={label}
          className="h-7 px-3 rounded-2xl border border-grey-200 inline-flex items-center gap-1"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="body-2xs font-medium text-grey-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

function RecordCard({ record }: { record: AttendanceRecord }) {
  const fields = [
    { label: '일자', value: record.date.replace(/-/g, '.') },
    { label: '업무시작', value: formatKstTimeFull(record.checkInAt) },
    {
      label: '업무종료',
      value: formatKstTimeFull(record.checkOutAt ?? record.earlyLeaveAt),
    },
    { label: '총 근무시간', value: formatWorkMinutes(record.workMinutes) },
  ];

  return (
    <div className="h-20 px-6 rounded-[10px] bg-white shadow-[4px_0px_16px_0px_rgba(47,136,255,0.15)] flex items-center gap-10 overflow-x-auto">
      {fields.map(({ label, value }) => (
        <div key={label} className="inline-flex flex-col gap-2 shrink-0">
          <span className="body-xs font-medium text-grey-500">{label}</span>
          <span className="body-xs font-extralight text-grey-900">{value}</span>
        </div>
      ))}
    </div>
  );
}

type SheetState = { record: AttendanceRecord | null } | null;

export function AttendanceCalendar() {
  const now = new Date();
  const [view, setView] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [sheet, setSheet] = useState<SheetState>(null);

  const from = `${view.year}-${String(view.month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const to = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { logs } = useAttendanceLogs({ from, to });

  const statusMap = useMemo(() => {
    const map: Record<number, CalendarStatus | CalendarStatus[]> = {};
    const yearStr = String(view.year);
    const monthStr = String(view.month + 1).padStart(2, '0');
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
      if (isKoreanHoliday(dateStr)) map[d] = 'holiday';
    }
    for (const record of logs) {
      const d = Number(record.date.slice(8, 10));
      const attStatuses = toCalendarStatuses(record);
      const withHoliday = map[d] === 'holiday';
      const merged = withHoliday
        ? [...attStatuses, 'holiday' as CalendarStatus]
        : attStatuses;
      map[d] = merged.length === 1 ? merged[0] : merged;
    }
    return map;
  }, [logs, view.year, view.month, lastDay]);

  const recordByDay = useMemo(
    () =>
      logs.reduce<Record<number, AttendanceRecord>>((acc, record) => {
        acc[Number(record.date.slice(8, 10))] = record;
        return acc;
      }, {}),
    [logs]
  );

  const handlePrev = useCallback(() => {
    setView(prev => {
      const isJan = prev.month === 0;
      return {
        year: isJan ? prev.year - 1 : prev.year,
        month: isJan ? 11 : prev.month - 1,
      };
    });
  }, []);

  const handleNext = useCallback(() => {
    setView(prev => {
      const isDec = prev.month === 11;
      return {
        year: isDec ? prev.year + 1 : prev.year,
        month: isDec ? 0 : prev.month + 1,
      };
    });
  }, []);

  const handleDayClick = useCallback(
    (date: Date) => {
      setSheet({ record: recordByDay[date.getDate()] ?? null });
    },
    [recordByDay]
  );

  return (
    <>
      <Calendar
        year={view.year}
        month={view.month}
        statusMap={statusMap}
        onPrev={handlePrev}
        onNext={handleNext}
        onDayClick={handleDayClick}
      />

      <BottomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title="업무 기록"
      >
        {sheet && (
          <div className="flex flex-col gap-5">
            <StatusLegend />
            {sheet.record ? (
              <>
                <RecordCard record={sheet.record} />
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setSheet(null)}
                >
                  확인
                </Button>
              </>
            ) : (
              <p className="body-sm text-center text-grey-500 py-4">
                기록이 없는 날입니다.
              </p>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

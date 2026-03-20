'use client';

import Checkbox from '@/components/ui/Checkbox';
import { Icon } from '@iconify/react';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { userAtom } from '@/store/atoms';
import { useAttendanceLogs } from '@/hooks/useAttendanceLogs';
import { getKstDateRange, getKstDateString } from '@/lib/attendance';
import type { AttendanceLogsParams } from '@/types/attendance';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'] as const;

function calculateJoinedDays(joinedAt?: string): number {
  if (!joinedAt) return 1;
  const joinedDate = new Date(joinedAt);
  if (Number.isNaN(joinedDate.getTime())) return 1;
  const diff = Date.now() - joinedDate.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

// 이번 주가 두 달에 걸치면 두 달 범위를 커버하는 쿼리 범위 반환
// 같은 달이면 AttendanceCalendar와 동일한 monthly key → 캐시 공유
function getQueryRange(): AttendanceLogsParams {
  const today = getKstDateString();
  const { from: weekFrom, to: weekTo } = getKstDateRange('week');
  const [year, month] = today.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthTo = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // 주 시작일이 이번 달 안에 있으면 monthly 범위 (캘린더와 캐시 공유)
  if (weekFrom >= monthFrom) return { from: monthFrom, to: monthTo };

  // 월초 주차: 이전 달까지 포함하도록 주간 범위로 확장
  return { from: weekFrom, to: weekTo };
}

export default function AttendanceDashboardCard() {
  const user = useAtomValue(userAtom);
  const queryRange = useMemo(() => getQueryRange(), []);
  const { logs, uiState } = useAttendanceLogs(queryRange);

  const joinedDays = calculateJoinedDays(user?.joinedAt);
  const isReady = uiState.state === 'ready' || uiState.state === 'empty';

  const weekDays = useMemo(() => {
    const today = getKstDateString();
    const { from: weekFrom } = getKstDateRange('week');
    const logMap = new Map(logs.map(r => [r.date, r]));

    return DAY_LABELS.map((label, i) => {
      const d = new Date(weekFrom + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const isFuture = dateStr > today;
      const record = logMap.get(dateStr);
      const attended =
        isReady && !isFuture && !!record && record.status !== 'absent';
      return { label, attended };
    });
  }, [logs, isReady]);

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
            <h2 id="attendance-dashboard" className="brand-h3 text-grey-900">
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
                  {joinedDays}
                </span>
                <span className="body-xs text-grey-500">일차</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1 text-left">
              <span className="body-sm font-semibold text-grey-300">
                다음 승진까지
              </span>
              <div className="inline-flex items-end gap-1">
                <span className="brand-h1 tabular-nums text-grey-300">—</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-5">
          <span className="body-sm font-semibold text-grey-300 lg:hidden">
            이번 주 근무일
          </span>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day.label} className="flex flex-col items-center gap-1">
                <span className="body-xs font-semibold text-grey-500">
                  {day.label}
                </span>
                <Checkbox
                  checked={day.attended}
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

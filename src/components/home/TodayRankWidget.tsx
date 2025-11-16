'use client';

import { Icon } from '@iconify/react';
import type { TodayRankUser } from '@/types/todayRank';

export type TodayRankWidgetProps = {
  ranks: TodayRankUser[];
  isLoading?: boolean;
  isError?: boolean;
};

const clampPercentage = (value: number) => Math.min(Math.max(value, 0), 100);

const calculateScore = (user: TodayRankUser) =>
  clampPercentage(user.performanceRate) + clampPercentage(user.attendanceRate);

export function TodayRankWidget({
  ranks,
  isLoading = false,
  isError = false,
}: TodayRankWidgetProps) {
  const topRanks = ranks
    .slice()
    .sort((a, b) => calculateScore(b) - calculateScore(a))
    .slice(0, 3);

  const renderLoading = () => (
    <div className="mt-4 flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-9 w-full rounded-[5px] bg-grey-200 animate-pulse"
        />
      ))}
    </div>
  );

  const renderError = () => (
    <div className="mt-4 rounded-[5px] border border-grey-200 bg-white/60 p-4">
      <p className="body-sm text-grey-600">
        랭킹을 불러오는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.
      </p>
    </div>
  );

  const renderEmpty = () => (
    <div className="mt-4 flex flex-col items-start gap-3">
      <p className="body-base text-grey-900 font-normal">
        1호 갓생이가 되어 주세요🐹
      </p>
    </div>
  );

  const renderRanks = () => (
    <ul className="mt-4 flex flex-col gap-4">
      {topRanks.map((user, index) => {
        const safePerf = clampPercentage(user.performanceRate);
        const safeAttend = clampPercentage(user.attendanceRate);

        return (
          <li
            key={user.userId}
            className="grid grid-cols-[minmax(84px,1fr)_83px_83px] items-center gap-2 sm:grid-cols-[122px_83px_83px] sm:gap-4 md:gap-6"
          >
            <div className="flex items-center gap-2 min-w-0 w-full overflow-hidden sm:w-[122px]">
              <span className="brand-h4 text-primary-500 flex-shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="body-sm text-grey-900 font-semibold truncate whitespace-nowrap">
                {user.displayName}
              </span>
              <span className="body-xs text-grey-500 flex-shrink-0 whitespace-nowrap">
                {user.departmentName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 body-sm w-[83px]">
              <Icon
                icon="icon-park-solid:up-two"
                className="w-4 h-4 text-primary-500"
              />
              <span className="body-sm text-grey-500">성과 {safePerf}%</span>
            </div>
            <div className="flex items-center gap-1.5 body-sm w-[83px]">
              <Icon
                icon="fluent:flash-on-24-filled"
                className="w-4 h-4 text-primary-500"
              />
              <span className="body-sm text-grey-500">근태 {safeAttend}%</span>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-2 md:min-h-[210px]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Icon icon="icon-park:trophy" className="w-6 h-6 text-primary-500" />
          <h2 className="brand-h3 text-grey-900">Today 갓생이</h2>
        </div>
      </div>

      {isLoading
        ? renderLoading()
        : isError
          ? renderError()
          : topRanks.length
            ? renderRanks()
            : renderEmpty()}
    </section>
  );
}

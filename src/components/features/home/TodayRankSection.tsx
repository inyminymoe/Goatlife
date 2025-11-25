'use client';

import { TodayRankWidget } from '@/components/home/TodayRankWidget';
import { useTodayRanks } from '@/hooks/useTodayRanks';

/**
 * TodayRankWidget을 위한 Client Component Wrapper
 * useTodayRanks 훅을 사용하여 데이터를 가져옴
 */
export function TodayRankSection() {
  const {
    ranks: todayRanks,
    isLoading: isTodayRanksLoading,
    isError: isTodayRanksError,
  } = useTodayRanks();

  return (
    <TodayRankWidget
      ranks={todayRanks}
      isLoading={isTodayRanksLoading}
      isError={isTodayRanksError}
    />
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTodayRanks } from '@/services/todayRank';
import type { TodayRankUser } from '@/types/todayRank';

export interface UseTodayRanksResult {
  ranks: TodayRankUser[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

type TodayRankPeriod = '1d' | '7d' | '30d';

const PERIOD_DAY_MAP: Record<TodayRankPeriod, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
};

export function useTodayRanks(
  period: TodayRankPeriod = '7d',
  limit = 3
): UseTodayRanksResult {
  const [ranks, setRanks] = useState<TodayRankUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const periodDays = PERIOD_DAY_MAP[period] ?? 7;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const runFetch = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchTodayRanks({
      periodDays,
      limit,
    });
    if (!isMountedRef.current) return;

    if (result.ok) {
      setRanks(result.data);
      setError(null);
    } else {
      setRanks([]);
      setError(result.error);
    }
    setIsLoading(false);
  }, [limit, periodDays]);

  useEffect(() => {
    void runFetch();
  }, [runFetch]);

  return {
    ranks,
    isLoading,
    isError: Boolean(error),
    error,
    refresh: runFetch,
  };
}

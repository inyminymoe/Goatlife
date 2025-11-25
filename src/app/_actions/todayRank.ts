'use server';

import { admin } from '@/lib/supabase/admin';
import type { TodayRankUser } from '@/types/todayRank';

export type TodayRankOptions = {
  periodDays?: number;
  limit?: number;
};

type TodayRankRow = {
  user_id: string;
  display_name: string | null;
  rank: string | null;
  department_name: string | null;
  performance_rate: number | null;
  attendance_rate: number | null;
};

const clampPercentage = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
};

export async function getTodayRanks(
  options?: TodayRankOptions
): Promise<TodayRankUser[]> {
  const periodDays = options?.periodDays ?? 7;
  const limit = options?.limit ?? 3;

  try {
    const { data, error } = await admin.rpc('get_today_ranks', {
      period_days: periodDays,
      limit_count: limit,
    });

    if (error) {
      console.error('[getTodayRanks] RPC failed', error);
      return [];
    }

    const rows = (data ?? []) as TodayRankRow[];

    const ranks: TodayRankUser[] = rows
      .filter((row: TodayRankRow) => !!row.user_id)
      .map(
        (row: TodayRankRow): TodayRankUser => ({
          userId: row.user_id,
          displayName: (row.display_name ?? '익명 사원').trim() || '익명 사원',
          rank: (row.rank ?? '사원').trim() || '사원',
          departmentName:
            (row.department_name ?? '부서 미정').trim() || '부서 미정',
          performanceRate: clampPercentage(row.performance_rate),
          attendanceRate: clampPercentage(row.attendance_rate),
        })
      );

    return ranks;
  } catch (error) {
    console.error('[getTodayRanks] unexpected error', error);
    return [];
  }
}

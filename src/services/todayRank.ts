import type { TodayRankUser } from '@/types/todayRank';
import { getTodayRanks, type TodayRankOptions } from '@/app/_actions/todayRank';

const DEFAULT_TIMEOUT = 6000;

const withTimeout = <T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);

export type TodayRankResult =
  | { ok: true; data: TodayRankUser[] }
  | { ok: false; error: string };

export async function fetchTodayRanks(
  options?: TodayRankOptions
): Promise<TodayRankResult> {
  try {
    const data = await withTimeout(
      getTodayRanks({
        periodDays: options?.periodDays ?? 7,
        limit: options?.limit ?? 3,
      })
    );
    return { ok: true, data };
  } catch (error) {
    console.error('[services/todayRank] fetchTodayRanks failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

import { getUserSummary } from '@/app/_actions/userInfo';
import type { UserInfoResult } from '@/app/_actions/userInfo';

const DEFAULT_TIMEOUT = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

export async function fetchUserSummary(): Promise<UserInfoResult> {
  try {
    const result = await withTimeout(getUserSummary());
    return result;
  } catch (error) {
    console.error('[services/user] fetchUserSummary failed', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

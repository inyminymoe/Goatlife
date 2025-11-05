'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchUserSummary } from '@/services/user';
import type { UserSummary } from '@/app/_actions/userInfo';

export type UserInfoError = 'UNAUTHENTICATED' | 'NOT_FOUND' | 'UNKNOWN';
export type UserInfoStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseUserInfoOptions {
  autoLoad?: boolean;
  mode?: 'compact' | 'full';
}

export interface UseUserInfoResult {
  status: UserInfoStatus;
  summary: UserSummary | null;
  error: UserInfoError | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  mode: 'compact' | 'full';
}

export function useUserInfo(
  options: UseUserInfoOptions = {}
): UseUserInfoResult {
  const { autoLoad = true, mode = 'compact' } = options;
  const [status, setStatus] = useState<UserInfoStatus>('idle');
  const [summary, setSummary] = useState<UserSummary | null>(null);
  const [error, setError] = useState<UserInfoError | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    const result = await fetchUserSummary();
    if (result.ok) {
      setSummary(result.data);
      setStatus('success');
      setError(null);
    } else {
      setSummary(null);
      setError(result.error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    void load();
  }, [autoLoad, load]);

  return {
    status,
    summary,
    error,
    isLoading: status === 'loading',
    refresh: load,
    mode,
  };
}

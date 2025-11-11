'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchExecMessage } from '@/services/execMessage';
import type { ExecMessage } from '@/app/_actions/execMessage';

export type ExecMessageLifecycle = 'idle' | 'loading' | 'success' | 'error';

interface UseExecMessageOptions {
  autoLoad?: boolean;
}

interface UseExecMessageResult {
  lifecycle: ExecMessageLifecycle;
  data: ExecMessage | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useExecMessage(
  options: UseExecMessageOptions = {}
): UseExecMessageResult {
  const { autoLoad = true } = options;
  const [lifecycle, setLifecycle] = useState<ExecMessageLifecycle>('idle');
  const [data, setData] = useState<ExecMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLifecycle('loading');
    setError(null);

    try {
      const result = await fetchExecMessage();

      // 안전장치: result가 undefined인 경우 처리
      if (!result) {
        console.error('[useExecMessage] fetchExecMessage returned undefined');
        setData(null);
        setError('UNKNOWN');
        setLifecycle('error');
        return;
      }

      if (result.ok) {
        setData(result.data);
        setLifecycle('success');
      } else {
        setData(null);
        setError(result.error);
        setLifecycle('error');
      }
    } catch (err) {
      console.error('[useExecMessage] load failed:', err);
      setData(null);
      setError('UNKNOWN');
      setLifecycle('error');
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return;
    void load();
  }, [autoLoad, load]);

  return {
    lifecycle,
    data,
    error,
    refresh: load,
  };
}

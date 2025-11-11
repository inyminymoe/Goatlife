'use client';

import { useCallback, useState } from 'react';
import {
  createQuote,
  deleteQuote,
  listQuotes,
  updateQuote,
  type ExecQuote,
} from '@/app/_actions/execMessage';

interface PageState {
  page: number;
  pageSize: number;
  q: string;
}

interface DataState {
  items: ExecQuote[];
  total: number;
}

export function useExecQuotes() {
  const [loading, setLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>({
    page: 1,
    pageSize: 20,
    q: '',
  });
  const [data, setData] = useState<DataState>({ items: [], total: 0 });

  const fetchList = useCallback(
    async (override?: Partial<PageState>) => {
      setLoading(true);
      try {
        const state = { ...pageState, ...(override ?? {}) };
        const res = await listQuotes(state);
        setData({ items: res.data as ExecQuote[], total: res.count ?? 0 });
        setPageState({ page: res.page, pageSize: res.pageSize, q: state.q });
      } catch (error) {
        console.error('[useExecQuotes] fetchList failed', error);
        setData({ items: [], total: 0 });
      } finally {
        setLoading(false);
      }
    },
    [pageState]
  );

  const add = useCallback(async (payload: unknown) => {
    try {
      const created = await createQuote(payload);
      setData(prev => ({
        items: [created as ExecQuote, ...prev.items],
        total: prev.total + 1,
      }));
    } catch (error) {
      console.error('[useExecQuotes] add failed', error);
      throw error;
    }
  }, []);

  const patch = useCallback(async (id: string, patchData: unknown) => {
    try {
      const updated = await updateQuote(id, patchData);
      setData(prev => ({
        items: prev.items.map(i => (i.id === id ? (updated as ExecQuote) : i)),
        total: prev.total,
      }));
    } catch (error) {
      console.error('[useExecQuotes] patch failed', error);
      throw error;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteQuote(id);
      setData(prev => ({
        items: prev.items.filter(i => i.id !== id),
        total: Math.max(0, prev.total - 1),
      }));
    } catch (error) {
      console.error('[useExecQuotes] remove failed', error);
      throw error;
    }
  }, []);

  return {
    loading,
    pageState,
    data,
    fetchList,
    add,
    patch,
    remove,
  };
}

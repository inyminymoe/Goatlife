'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export type RoutineItemCategory = 'work' | 'break' | 'leisure';
export type RoutineItemPeriod = 'AM' | 'PM';

export type RoutineItem = {
  id: string;
  user_id: string;
  title: string;
  period: RoutineItemPeriod;
  category: RoutineItemCategory;
  url: string | null;
  pomodoro_count: number;
  order_index: number;
  created_at: string;
  updated_at: string;
};

type RoutineItemsResponse =
  | { ok: true; data: RoutineItem[] }
  | { ok: false; error: string };

type RoutineItemResponse =
  | { ok: true; data: RoutineItem }
  | { ok: false; error: string };

type DeleteResponse = { ok: true; data: null } | { ok: false; error: string };

async function getUserSupabaseClient() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: 'UNAUTHENTICATED' };
  }

  return { ok: true as const, supabase, user };
}

export async function getRoutineItems(): Promise<RoutineItemsResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('routine_items')
    .select('*')
    .eq('user_id', client.user.id)
    .order('period', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data as RoutineItem[]) ?? [] };
}

export async function createRoutineItem(input: {
  title: string;
  period: RoutineItemPeriod;
  category: RoutineItemCategory;
  url?: string;
  pomodoro_count?: number;
}): Promise<RoutineItemResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  if (!input.title.trim()) return { ok: false, error: '제목을 입력해주세요.' };

  const { data: existing } = await client.supabase
    .from('routine_items')
    .select('order_index')
    .eq('user_id', client.user.id)
    .eq('period', input.period)
    .order('order_index', { ascending: false })
    .limit(1);

  const maxOrderIndex = existing?.[0]?.order_index ?? 0;
  const newOrderIndex = maxOrderIndex + 1000;

  const { data, error } = await client.supabase
    .from('routine_items')
    .insert({
      user_id: client.user.id,
      title: input.title.trim(),
      period: input.period,
      category: input.category,
      url: input.url?.trim() || null,
      pomodoro_count: input.pomodoro_count ?? 1,
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data as RoutineItem };
}

export async function updateRoutineItem(
  id: string,
  updates: {
    title?: string;
    period?: RoutineItemPeriod;
    category?: RoutineItemCategory;
    url?: string | null;
    pomodoro_count?: number;
  }
): Promise<RoutineItemResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  if (updates.title !== undefined && !updates.title.trim()) {
    return { ok: false, error: '제목을 입력해주세요.' };
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.period !== undefined) payload.period = updates.period;
  if (updates.category !== undefined) payload.category = updates.category;
  if ('url' in updates) payload.url = updates.url?.trim() || null;
  if (updates.pomodoro_count !== undefined)
    payload.pomodoro_count = updates.pomodoro_count;

  const { data, error } = await client.supabase
    .from('routine_items')
    .update(payload)
    .eq('id', id)
    .eq('user_id', client.user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: '루틴을 찾을 수 없습니다.' };
  return { ok: true, data: data as RoutineItem };
}

export async function deleteRoutineItem(id: string): Promise<DeleteResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { error } = await client.supabase
    .from('routine_items')
    .delete()
    .eq('id', id)
    .eq('user_id', client.user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}

export async function reorderRoutineItems(
  items: Array<{ id: string; order_index: number }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  try {
    for (const item of items) {
      const { error } = await client.supabase
        .from('routine_items')
        .update({
          order_index: item.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
        .eq('user_id', client.user.id);

      if (error) throw error;
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : '순서 변경에 실패했습니다.',
    };
  }
}

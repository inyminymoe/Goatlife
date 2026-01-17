'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type Task = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  order_index: number;
  estimated_time: string | null;
  created_at: string;
  updated_at: string;
};

type TasksResponse = { ok: true; data: Task[] } | { ok: false; error: string };

type TaskResponse = { ok: true; data: Task } | { ok: false; error: string };

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

/**
 * 상위 TODO 태스크 가져오기 (최대 4개)
 */
export async function getTopTodos(): Promise<TasksResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', client.user.id)
    .eq('status', 'todo')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(4);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: (data as Task[]) ?? [] };
}

/**
 * 모든 태스크 가져오기 (상태별 필터링 가능)
 */
export async function getTasks(status?: TaskStatus): Promise<TasksResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  let query = client.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', client.user.id);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: (data as Task[]) ?? [] };
}

/**
 * 태스크 생성
 */
export async function createTask(input: {
  title: string;
  description?: string;
  estimated_time?: string;
}): Promise<TaskResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  if (!input.title.trim()) {
    return { ok: false, error: '제목을 입력해주세요.' };
  }

  // 현재 todo 상태의 최대 order_index 가져오기
  const { data: existingTasks } = await client.supabase
    .from('tasks')
    .select('order_index')
    .eq('user_id', client.user.id)
    .eq('status', 'todo')
    .order('order_index', { ascending: false })
    .limit(1);

  // 마지막 태스크의 order_index + 1000으로 설정
  const maxOrderIndex = existingTasks?.[0]?.order_index ?? 0;
  const newOrderIndex = maxOrderIndex + 1000;

  const { data, error } = await client.supabase
    .from('tasks')
    .insert({
      user_id: client.user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      estimated_time: input.estimated_time || null,
      status: 'todo',
      order_index: newOrderIndex,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: data as Task };
}

/**
 * 태스크 상태 변경
 */
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<TaskResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { data, error } = await client.supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .eq('user_id', client.user.id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: '태스크를 찾을 수 없습니다.' };
  }

  return { ok: true, data: data as Task };
}

/**
 * 태스크 정보 업데이트
 */
export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    order_index?: number;
    estimated_time?: string;
  }
): Promise<TaskResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  if (updates.title !== undefined && !updates.title.trim()) {
    return { ok: false, error: '제목을 입력해주세요.' };
  }

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.description !== undefined)
    payload.description = updates.description.trim() || null;
  if (updates.order_index !== undefined)
    payload.order_index = updates.order_index;
  if (updates.estimated_time !== undefined)
    payload.estimated_time = updates.estimated_time || null;

  const { data, error } = await client.supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('user_id', client.user.id)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: '태스크를 찾을 수 없습니다.' };
  }

  return { ok: true, data: data as Task };
}

/**
 * 여러 태스크를 한 번에 업데이트 (제출용)
 */
export async function batchUpdateTasks(
  updates: Array<{
    id: string;
    status: TaskStatus;
    order_index: number;
  }>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  try {
    // 각 태스크를 순차적으로 업데이트
    for (const update of updates) {
      const { error } = await client.supabase
        .from('tasks')
        .update({
          status: update.status,
          order_index: update.order_index,
        })
        .eq('id', update.id)
        .eq('user_id', client.user.id);

      if (error) {
        throw error;
      }
    }

    return { ok: true };
  } catch (error) {
    console.error('Batch update error:', error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : '업데이트에 실패했습니다.',
    };
  }
}

/**
 * 태스크 삭제
 */
export async function deleteTask(taskId: string): Promise<DeleteResponse> {
  const client = await getUserSupabaseClient();
  if (!client.ok) return client;

  const { error } = await client.supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', client.user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: null };
}

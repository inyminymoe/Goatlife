'use server';

import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';

export type ExecMessage = {
  id: string;
  authorName: string | null;
  authorTitle: string | null;
  avatarUrl: string | null;
  message: string;
  lang: string | null;
  createdAt: string;
  isExplicit: boolean;
};

export type ExecMessageResult =
  | { ok: true; data: ExecMessage }
  | { ok: false; error: string };

export async function getCurrentExecMessage(): Promise<ExecMessageResult> {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('v_exec_message_current_or_quote')
      .select('*')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return { ok: false, error: 'NO_MESSAGE' };
    }

    return {
      ok: true,
      data: {
        id: data.id,
        authorName: data.author_name ?? null,
        authorTitle: data.author_title ?? null,
        avatarUrl: data.avatar_url ?? null,
        message: data.message,
        lang: data.lang ?? null,
        createdAt: data.created_at,
        isExplicit: data.is_explicit_message ?? false,
      },
    };
  } catch (e) {
    console.error('[getCurrentExecMessage] failed', e);
    return { ok: false, error: 'UNKNOWN' };
  }
}

// ============================================================================
// 관리자용 CRUD 액션 (exec_quotes)
// ============================================================================

export type ExecQuote = {
  id: string;
  author_code: string;
  author_name: string;
  author_title: 'CEO' | 'CTO' | 'COO';
  avatar_url: string | null;
  message: string;
  lang: string;
  is_explicit: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const QuoteSchema = z.object({
  id: z.string().uuid().optional(),
  author_code: z.string().min(1).default('exec'),
  author_name: z.string().min(1),
  author_title: z.enum(['CEO', 'CTO', 'COO']),
  avatar_url: z
    .string()
    .url()
    .optional()
    .nullable()
    .transform(v => v || null),
  message: z.string().min(1).max(500),
  lang: z.string().default('ko'),
  is_explicit: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export async function listQuotes({
  q,
  page = 1,
  pageSize = 20,
}: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from('exec_quotes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (q?.trim()) {
      query = query.ilike('message', `%${q}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return { data: data ?? [], count: count ?? 0, page, pageSize };
  } catch (e) {
    console.error('[listQuotes] failed', e);
    throw e;
  }
}

export async function createQuote(input: unknown) {
  try {
    const supabase = await createServerSupabase();
    const body = QuoteSchema.omit({ id: true }).parse(input);
    const { data, error } = await supabase
      .from('exec_quotes')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (e) {
    console.error('[createQuote] failed', e);
    throw e;
  }
}

export async function updateQuote(id: string, patch: unknown) {
  try {
    const supabase = await createServerSupabase();
    const body = QuoteSchema.partial().parse(patch);
    const { data, error } = await supabase
      .from('exec_quotes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (e) {
    console.error('[updateQuote] failed', e);
    throw e;
  }
}

export async function deleteQuote(id: string) {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from('exec_quotes').delete().eq('id', id);

    if (error) throw error;

    return { ok: true };
  } catch (e) {
    console.error('[deleteQuote] failed', e);
    throw e;
  }
}

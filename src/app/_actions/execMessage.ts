'use server';

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

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_DEPARTMENT = 'IT부';
const DEFAULT_WORK_HOURS = '주간(09:00-18:00)';
const DEFAULT_WORK_TYPE = '풀타임';
const DEFAULT_RANK = '인턴';

const sanitizeHandle = (raw: string | null | undefined) => {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/[^a-z0-9_-]/g, '');
  return sanitized || null;
};

const getEmailLocalPart = (email?: string | null) => {
  if (!email) return null;
  const [local] = email.split('@');
  return sanitizeHandle(local);
};

async function generateUserId(
  supabase: SupabaseClient,
  baseCandidates: (string | null | undefined)[]
) {
  const candidates = baseCandidates
    .map(candidate => sanitizeHandle(candidate ?? undefined))
    .filter(Boolean) as string[];

  if (candidates.length === 0) {
    candidates.push(`gl${Math.random().toString(36).slice(2, 8)}`);
  }

  for (const base of candidates) {
    const available = await findAvailableHandle(supabase, base);
    if (available) {
      return available;
    }
  }

  return `gl${Math.random().toString(36).slice(2, 10)}`;
}

async function findAvailableHandle(supabase: SupabaseClient, base: string) {
  let attempt = 0;
  while (attempt < 5) {
    const candidate = attempt === 0 ? base : `${base}-${attempt}`;
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
    attempt += 1;
  }
  return null;
}

async function ensureProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    return;
  }

  const metadata = user.user_metadata ?? {};
  const email =
    user.email ??
    (metadata['account_email'] as string | undefined) ??
    (metadata['email'] as string | undefined) ??
    null;

  const nickname =
    (metadata['profile_nickname'] as string | undefined) ??
    (metadata['nickname'] as string | undefined) ??
    null;

  const generatedUserId = await generateUserId(supabase, [
    getEmailLocalPart(email),
    nickname,
    user.id.replace(/-/g, ''),
  ]);

  const payload = {
    id: user.id,
    user_id: generatedUserId,
    email,
    last_name: nickname ?? generatedUserId,
    first_name: null,
    rank: DEFAULT_RANK,
    department: DEFAULT_DEPARTMENT,
    work_hours: DEFAULT_WORK_HOURS,
    work_type: DEFAULT_WORK_TYPE,
    work_style: metadata['work_style'] ?? null,
    work_ethic: metadata['work_ethic'] ?? null,
    avatar_url:
      (metadata['avatar_url'] as string | undefined) ??
      (metadata['picture'] as string | undefined) ??
      null,
  };

  const { error: insertError } = await supabase
    .from('profiles')
    .insert(payload);

  if (insertError) {
    console.error('[auth/callback] profile upsert failed', insertError);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectToParam = requestUrl.searchParams.get('redirect_to');
  const errorDescription = requestUrl.searchParams.get('error_description');

  let redirectDestination = '/';
  if (redirectToParam) {
    try {
      const redirectUrl = new URL(redirectToParam, requestUrl.origin);
      if (redirectUrl.origin === requestUrl.origin) {
        redirectDestination = `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
      }
    } catch (error) {
      console.error('[auth/callback] failed to parse redirect_to', error);
    }
  }

  if (errorDescription) {
    console.error('[auth/callback] provider error', errorDescription);
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'oauth_failed');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  if (!code) {
    console.error('[auth/callback] missing auth code');
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed', {
      code: error.code,
      message: error.message,
    });
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'session_exchange_failed');
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  await ensureProfile(supabase);

  return NextResponse.redirect(
    new URL(redirectDestination, requestUrl.origin),
    { status: 303 }
  );
}

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    console.error('[auth/callback] missing auth code');
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', 'missing_code');
    return NextResponse.redirect(loginUrl);
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
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(redirectDestination, requestUrl.origin));
}

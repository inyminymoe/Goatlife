import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const getAuthCookieNames = (cookieStore: CookieStore) => {
  const projectRef =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, '') ?? '';
  const prefix = `sb-${projectRef.split('.')[0]}-auth-token`;
  return cookieStore
    .getAll()
    .filter(cookie => cookie.name.startsWith(prefix))
    .map(cookie => cookie.name);
};

const buildResponse = (
  payload: Record<string, unknown>,
  options?: { status?: number; authCookies?: string[] }
) => {
  const response = NextResponse.json(payload, {
    status: options?.status ?? 200,
  });
  const cookieNames = options?.authCookies ?? [];

  cookieNames.forEach(name =>
    response.cookies.set({
      name,
      value: '',
      path: '/',
      maxAge: 0,
    })
  );

  return response;
};

export async function POST() {
  const cookieStore = await cookies();
  const authCookies = getAuthCookieNames(cookieStore);

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('[api/auth/signout] signOut failed (ignored)', {
        code: error.code,
        message: error.message,
        status: error.status,
      });
      return buildResponse(
        {
          success: true,
          revoked: false,
          message:
            '세션 쿠키는 삭제되었지만 Supabase 세션 종료는 확인되지 않았습니다.',
        },
        { authCookies }
      );
    }
  } catch (error) {
    console.error('[api/auth/signout] unexpected error (ignored)', error);
    return buildResponse(
      {
        success: true,
        revoked: false,
        message:
          '세션 쿠키는 삭제되었지만 로그아웃 처리 중 오류가 발생했습니다.',
      },
      { authCookies }
    );
  }

  return buildResponse({ success: true, revoked: true }, { authCookies });
}

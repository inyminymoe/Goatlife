'use server';

import { admin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type ToastPayload = {
  show: boolean;
  type: 'success' | 'error';
  message: string;
};

// Next.js redirect sentinel guard (version-safe)
function isNextRedirect(err: unknown): boolean {
  const digest = (err as { digest?: unknown })?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

const errorToast = (message: string): ToastPayload => ({
  show: true,
  type: 'error',
  message,
});

const mapAuthErrorToMessage = (code?: string, message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid')) {
    return '아이디 또는 비밀번호가 일치하지 않습니다.';
  }

  return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
};

export type LoginLookupResult = {
  success: boolean;
  email?: string;
  toast?: ToastPayload;
};

export type LoginActionState = {
  ok: boolean;
  message?: string;
};

export async function lookupEmailByUserId(
  userId: string
): Promise<LoginLookupResult> {
  try {
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('[lookupEmailByUserId] profile lookup failed', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });
    }

    if (profileError || !profile?.email) {
      return {
        success: false,
        toast: errorToast('아이디를 찾을 수 없습니다.'),
      };
    }

    return {
      success: true,
      email: profile.email,
    };
  } catch (error) {
    console.error('[lookupEmailByUserId] unexpected error', error);
    return {
      success: false,
      toast: errorToast(mapAuthErrorToMessage(undefined, undefined)),
    };
  }
}

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  try {
    const userId = String(formData.get('userId') ?? '')
      .trim()
      .toLowerCase();
    const password = String(formData.get('password') ?? '');

    if (!userId || !password) {
      return { ok: false, message: '아이디와 비밀번호를 모두 입력해주세요.' };
    }

    const lookup = await lookupEmailByUserId(userId);
    if (!lookup.success || !lookup.email) {
      return {
        ok: false,
        message:
          lookup.toast?.message ??
          '아이디를 찾을 수 없습니다. 다시 확인해주세요.',
      };
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: lookup.email,
      password,
    });

    if (error) {
      return {
        ok: false,
        message: mapAuthErrorToMessage(error.code, error.message),
      };
    }

    redirect('/');
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    console.error('[loginAction] unexpected error', error);
    return {
      ok: false,
      message: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}

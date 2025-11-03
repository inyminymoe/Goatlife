'use server';

import { admin } from '@/lib/supabase/admin';
import { createServerSupabase } from '@/lib/supabase/server';

type ToastPayload = {
  show: boolean;
  type: 'success' | 'error';
  message: string;
};

const errorToast = (message: string): ToastPayload => ({
  show: true,
  type: 'error',
  message,
});

const successToast = (message: string): ToastPayload => ({
  show: true,
  type: 'success',
  message,
});

const mapAuthErrorToMessage = (code?: string, message?: string) => {
  const normalizedMessage = message?.toLowerCase() ?? '';

  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid')) {
    return '아이디 또는 비밀번호가 일치하지 않습니다.';
  }

  if (
    code === 'email_not_confirmed' ||
    normalizedMessage.includes('email not confirmed')
  ) {
    return '이메일 인증이 필요합니다.';
  }

  return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
};

export type LoginLookupResult = {
  success: boolean;
  email?: string;
  toast?: ToastPayload;
};

export type LoginActionResult = {
  success: boolean;
  toast: ToastPayload;
  session?: {
    access_token: string;
    refresh_token: string;
  };
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
      toast: errorToast('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    };
  }
}

export async function loginWithUserId(
  userId: string,
  password: string
): Promise<LoginActionResult> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('[loginWithUserId] Missing required environment variables');
      return {
        success: false,
        toast: errorToast('서버 설정 오류입니다. 관리자에게 문의하세요.'),
      };
    }

    const emailLookup = await lookupEmailByUserId(userId);

    if (!emailLookup.success || !emailLookup.email) {
      return {
        success: false,
        toast:
          emailLookup.toast ??
          errorToast('아이디를 찾을 수 없습니다. 다시 확인해주세요.'),
      };
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailLookup.email,
      password,
    });

    if (error || !data.session) {
      console.error('[loginWithUserId] signInWithPassword failed', {
        code: error?.code,
        message: error?.message,
      });
      return {
        success: false,
        toast: errorToast(mapAuthErrorToMessage(error?.code, error?.message)),
      };
    }

    return {
      success: true,
      toast: successToast('로그인 성공! 홈으로 이동합니다.'),
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    };
  } catch (error) {
    console.error('[loginWithUserId] unexpected error', error);
    return {
      success: false,
      toast: errorToast('로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    };
  }
}

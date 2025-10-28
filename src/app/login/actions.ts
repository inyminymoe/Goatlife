'use server';

import { admin } from '@/lib/supabase/admin';

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

export type LoginLookupResult = {
  success: boolean;
  email?: string;
  toast?: ToastPayload;
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

'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { admin } from '@/lib/supabase/admin';

export async function loginWithUserId(userId: string, password: string) {
  try {
    // userId로 profiles 테이블에서 email 찾기 (admin client 사용 - RLS 우회)
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.email) {
      return {
        success: false,
        error: '아이디를 찾을 수 없습니다.',
      };
    }

    // email과 password로 로그인
    const supabase = await createServerSupabase();
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password,
      });

    if (authError || !authData?.user) {
      const raw = authError?.message || '';
      const message = raw.includes('Invalid login credentials')
        ? '아이디 또는 비밀번호가 일치하지 않습니다.'
        : raw.toLowerCase().includes('email not confirmed')
          ? '이메일 인증이 필요합니다. 메일함을 확인해주세요.'
          : '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';

      return {
        success: false,
        error: message,
      };
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('[login] Unexpected error:', err);
    return {
      success: false,
      error: '알 수 없는 오류가 발생했습니다.',
    };
  }
}

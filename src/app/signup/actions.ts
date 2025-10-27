'use server';

import { signupSchema, type SignupFormData } from '@/app/signup/schema';
import { createServerSupabase } from '@/lib/supabase/server';

export async function createUser(form: SignupFormData) {
  const parsed = signupSchema.safeParse(form);
  if (!parsed.success) {
    return { success: false, error: '폼 검증 실패' };
  }

  const supabase = await createServerSupabase();

  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        // IDs
        user_id: form.userId,
        userId: form.userId,

        // Names
        last_name: form.lastName,
        lastName: form.lastName,
        first_name: form.firstName ?? null,
        firstName: form.firstName ?? null,

        // Job info
        department: form.department,
        rank: '인턴',

        // Enums (둘 다 전달)
        work_hours: form.workHours,
        workHours: form.workHours,
        work_type: form.workType,
        workType: form.workType,

        // Optional fields
        work_style: form.workStyle ?? null,
        workStyle: form.workStyle ?? null,
        work_ethic: form.workEthic ?? null,
        workEthic: form.workEthic ?? null,
        avatar_url: form.avatarUrl ?? null,
        avatarUrl: form.avatarUrl ?? null,
      },
    },
  });

  if (authErr || !authData?.user) {
    const errorCode = authErr?.code || '';
    if (errorCode === 'user_already_exists') {
      return { success: false, error: '이미 가입된 이메일입니다.' };
    }
    if (errorCode === 'weak_password') {
      return { success: false, error: '비밀번호 정책을 확인해주세요.' };
    }
    return {
      success: false,
      error: '회원 생성 실패: ' + (authErr?.message ?? '알 수 없는 오류'),
    };
  }

  return { success: true };
}

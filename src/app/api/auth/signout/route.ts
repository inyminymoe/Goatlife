import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[api/auth/signout] signOut failed', {
        code: error.code,
        message: error.message,
        status: error.status,
      });

      return NextResponse.json(
        {
          success: false,
          message: '로그아웃 처리에 실패했습니다.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/auth/signout] unexpected error', error);
    return NextResponse.json(
      { success: false, message: '로그아웃 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

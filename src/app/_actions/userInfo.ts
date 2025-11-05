'use server';

import { createServerSupabase } from '@/lib/supabase/server';

export type UserSummary = {
  displayName: string;
  userId: string;
  rank: string | null;
  department: string | null;
  workHours: string | null;
  workType: string | null;
  avatarUrl: string | null;
  joinedDays: number;
  performanceRate: number;
};

export type UserInfoResult =
  | { ok: true; data: UserSummary }
  | { ok: false; error: 'UNAUTHENTICATED' | 'NOT_FOUND' | 'UNKNOWN' };

// 뷰에서 반환하는 데이터 타입 (snake_case)
type ViewRow = {
  auth_user_id: string;
  handle: string | null;
  display_name: string;
  rank: string | null;
  department: string | null;
  work_hours: string | null;
  work_type: string | null;
  avatar_url: string | null;
  created_at: string | null;
  joined_days: number;
  performance_rate: number;
};

export async function getUserSummary(): Promise<UserInfoResult> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, error: 'UNAUTHENTICATED' };
    }

    const { data: viewRow, error: viewError } = await supabase
      .from('v_user_summary_self')
      .select('*')
      .maybeSingle<ViewRow>();

    if (viewError) {
      console.error('[getUserSummary] View query failed:', viewError.message);
      return { ok: false, error: 'UNKNOWN' };
    }

    if (!viewRow) {
      return { ok: false, error: 'NOT_FOUND' };
    }

    const metadata = user.user_metadata ?? {};
    const nickname =
      metadata['profile_nickname'] ?? metadata['nickname'] ?? null;

    const summary: UserSummary = {
      displayName: nickname || viewRow.display_name,
      userId: viewRow.handle || user.email || 'user',
      rank: viewRow.rank,
      department: viewRow.department,
      workHours: viewRow.work_hours,
      workType: viewRow.work_type,
      avatarUrl: viewRow.avatar_url,
      joinedDays: viewRow.joined_days,
      performanceRate: viewRow.performance_rate,
    };

    return { ok: true, data: summary };
  } catch (error) {
    console.error('[getUserSummary] Unexpected error:', error);
    return { ok: false, error: 'UNKNOWN' };
  }
}

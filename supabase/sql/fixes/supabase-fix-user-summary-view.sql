-- ============================================================================
-- v_user_summary_self 뷰 업데이트: joined_at 사용하도록 수정
-- 실행 위치: Supabase SQL Editor
-- 목적: 입사일자를 created_at 대신 joined_at으로 계산
-- ============================================================================

-- v_user_summary_self 뷰 재생성
create or replace view public.v_user_summary_self as
select
  p.id                                     as auth_user_id,
  p.user_id                                as handle,
  coalesce(
    nullif(p.last_name, ''),
    nullif(p.first_name, ''),
    '사용자'
  )                                        as display_name,
  p.rank,
  p.department,
  p.work_hours,
  p.work_type,
  p.avatar_url,
  p.created_at,
  -- ✅ 입사 일차 계산: joined_at 우선, 없으면 created_at 사용
  greatest(
    1,  -- 최소 1일차
    floor(
      extract(epoch from (
        timezone('Asia/Seoul', now())
        - timezone('Asia/Seoul', coalesce(p.joined_at, p.created_at, now()))
      )) / 86400
    ) + 1
  )::int                                   as joined_days,
  -- 임시로 0 반환 (나중에 실제 performance 테이블 연동)
  0::int                                   as performance_rate
from public.profiles p
where p.id = auth.uid();

comment on view public.v_user_summary_self is
  '사원정보 카드용 뷰. joined_at (또는 created_at) 기준 joined_days 계산, 내 정보만 반환.';

alter view public.v_user_summary_self set (security_invoker = on);

-- ============================================================================
-- 확인 쿼리
-- ============================================================================
-- 내 프로필 정보 확인
select
  auth.uid() as my_user_id,
  p.user_id,
  p.last_name,
  p.joined_at,
  p.created_at,
  extract(day from (now() - coalesce(p.joined_at, p.created_at))) + 1 as calculated_days
from public.profiles p
where p.id = auth.uid();

-- 뷰 결과 확인
select * from public.v_user_summary_self;

-- 사원정보 카드용 뷰: 내 정보 1행만 반환
-- Supabase SQL Editor에서 실행

drop view if exists public.v_user_summary_self;

create or replace view public.v_user_summary_self as
select
  p.id                                     as auth_user_id,      -- auth.users.id와 동일
  p.user_id                                as handle,            -- 화면의 @아이디용
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
  -- 입사 일차 계산 (created_at 기준, KST)
  greatest(
    0,
    floor(
      extract(epoch from (
        timezone('Asia/Seoul', now())
        - timezone('Asia/Seoul', coalesce(p.created_at, now()))
      )) / 86400
    ) + 1
  )::int                                   as joined_days,
  -- 임시로 0 반환 (나중에 실제 performance 테이블 연동)
  0::int                                   as performance_rate
from public.profiles p
where p.id = auth.uid();  -- ★ 내 정보만 1행 반환

comment on view public.v_user_summary_self is
  '사원정보 카드용 뷰. created_at 기준 joined_days 계산, 내 정보만 반환.';

-- security_invoker로 설정하여 호출자의 RLS 컨텍스트 사용
alter view public.v_user_summary_self set (security_invoker = on);

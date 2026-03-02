-- ============================================================================
-- 갓생상사 사원 정보 요약 뷰 및 정책
-- 목적:
--   - profiles 테이블 기반으로 홈 화면 사원 정보 요약 데이터를 제공
--   - joined_days, performance_rate 등의 파생 컬럼 계산
-- ============================================================================

-- 기존 뷰 제거 (재실행 대비)
drop view if exists public.v_user_summary;

create or replace view public.v_user_summary as
select
  p.id as user_id,
  p.user_id as login_id,
  coalesce(nullif(p.last_name, ''), nullif(p.first_name, ''), '사용자') as display_name,
  p.rank,
  p.department,
  p.work_hours,
  p.work_type,
  p.avatar_url,
  p.joined_at,
  greatest(
    0,
    floor(
      extract(
        epoch from (
          timezone('Asia/Seoul', now()) - timezone('Asia/Seoul', coalesce(p.joined_at, now()::date))
        )
      ) / 86400
    ) + 1
  ) as joined_days,
  coalesce(p.performance_rate, 0) as performance_rate
from public.profiles p;

comment on view public.v_user_summary is
  '사원 대시보드용 요약 뷰. joined_days 등 파생 컬럼을 포함합니다.';

-- 뷰는 실행자 권한으로 동작하도록 설정 (접근 이용자에 맞게 필터)
alter view public.v_user_summary set (security_invoker = on);

-- 선택: 인증 사용자에게 자신의 행만 조회 허용
-- (RLS와 함께 사용 시 보조 정책으로 활용)

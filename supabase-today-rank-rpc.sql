-- ============================================================================
-- Today 갓생이 랭킹 계산용 RPC (최근 7일 rolling 기준)
-- ============================================================================
-- 함수명: get_today_ranks(period_days int default 7, limit_count int default 3)
-- 반환 컬럼:
--   user_id UUID
--   display_name TEXT
--   department_name TEXT
--   performance_rate NUMERIC (0~100)
--   attendance_rate NUMERIC (0~100)
--
-- period_days 는 1~30 범위 내 값으로 클램핑하며,
-- attendance_rate 는 기준 기간 일수 대비 출근일 비율,
-- performance_rate 는 기간 내 완료된 업무 비율(없으면 profiles.performance_rate)로 계산.
-- ============================================================================

drop function if exists public.get_today_ranks;

create or replace function public.get_today_ranks(
  period_days integer default 7,
  limit_count integer default 3
)
returns table (
  user_id uuid,
  display_name text,
  department_name text,
  performance_rate numeric,
  attendance_rate numeric
)
language sql
security definer
set search_path = public
as $$
with params as (
  select
    greatest(1, least(coalesce(period_days, 7), 30))::int as period_days,
    greatest(1, coalesce(limit_count, 3))::int as limit_count
),
range as (
  select
    timezone('Asia/Seoul', now())::date as today,
    (timezone('Asia/Seoul', now())::date - (select period_days - 1 from params)) as start_date,
    (select period_days from params) as period_days
),
attendance as (
  select
    al.user_id,
    count(*) filter (where al.status is not null and al.status != 'none')::numeric as attended_days
  from public.attendance_logs al
  cross join range r
  where al.work_date between r.start_date and r.today
  group by al.user_id
),
performance as (
  select
    t.user_id,
    count(*)::numeric as total_tasks,
    count(*) filter (where t.status = 'done')::numeric as done_tasks
  from public.tasks t
  cross join range r
  where (t.created_at at time zone 'Asia/Seoul')::date between r.start_date and r.today
  group by t.user_id
),
profile_base as (
  select
    p.id,
    trim(concat_ws(' ', nullif(p.last_name, ''), nullif(p.first_name, ''))) as raw_name,
    p.department,
    0::numeric as fallback_performance
  from public.profiles p
) ,
rank_base as (
  select
  pb.id as user_id,
  coalesce(nullif(pb.raw_name, ''), '익명 사원') as display_name,
  coalesce(nullif(pb.department, ''), '부서 미정') as department_name,
  case
    when perf.total_tasks > 0
      then round((perf.done_tasks / nullif(perf.total_tasks, 0)) * 100, 2)
    else pb.fallback_performance
  end as performance_rate,
  round(
    (coalesce(att.attended_days, 0) / (select period_days from range)) * 100,
    2
  ) as attendance_rate
from profile_base pb
cross join range r
left join performance perf on perf.user_id = pb.id
left join attendance att on att.user_id = pb.id
)
select *
from rank_base
order by
  (performance_rate + attendance_rate) desc,
  attendance_rate desc,
  performance_rate desc,
  display_name asc
limit (select limit_count from params);
$$;

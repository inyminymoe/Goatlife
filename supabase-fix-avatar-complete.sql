-- ============================================================================
-- exec_quotes avatar_url 컬럼 추가 및 뷰 업데이트 (통합 버전)
-- 실행 위치: Supabase SQL Editor
-- 목적: avatar_url 컬럼 추가 → 뷰 업데이트 → 아바타 표시 가능
-- ============================================================================

-- 1) exec_quotes 테이블에 avatar_url 컬럼 추가 ---------------------------
-- 이미 있으면 무시됨
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'exec_quotes'
    and column_name = 'avatar_url'
  ) then
    alter table public.exec_quotes add column avatar_url text;
    raise notice 'avatar_url 컬럼 추가 완료';
  else
    raise notice 'avatar_url 컬럼 이미 존재';
  end if;
end $$;

-- 2) is_explicit 컬럼 추가 (필요한 경우) ----------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'exec_quotes'
    and column_name = 'is_explicit'
  ) then
    alter table public.exec_quotes add column is_explicit boolean not null default false;
    raise notice 'is_explicit 컬럼 추가 완료';
  else
    raise notice 'is_explicit 컬럼 이미 존재';
  end if;
end $$;

-- 3) v_exec_quote_of_today 뷰 업데이트 ------------------------------------
-- avatar_url 포함
create or replace view public.v_exec_quote_of_today as
select *
from public.exec_quotes q
where q.is_active = true
order by md5(q.id::text || to_char(now()::date, 'YYYYMMDD')) asc
limit 1;

-- 4) v_exec_message_current_or_quote 뷰 업데이트 --------------------------
-- exec_quotes의 avatar_url을 실제로 사용하도록 수정
create or replace view public.v_exec_message_current_or_quote as
with current_msg as (
  select
    em.id,
    coalesce(em.author_name, '임원') as author_name,
    coalesce(em.author_title, '임원진') as author_title,
    em.avatar_url,
    em.message,
    em.lang,
    em.created_at,
    true as is_explicit_message
  from public.v_exec_message_current em
),
today_quote as (
  select
    q.id,
    q.author_name,
    q.author_title,
    q.avatar_url,  -- ✅ null::text에서 q.avatar_url로 변경
    q.message,
    q.lang,
    q.created_at,
    false as is_explicit_message
  from public.v_exec_quote_of_today q
)
select * from current_msg
union all
select * from today_quote
order by is_explicit_message desc, created_at desc
limit 1;

comment on view public.v_exec_message_current_or_quote is '임원 공지 우선, 없으면 오늘의 명언을 반환 (avatar_url 포함)';


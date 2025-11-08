-- ============================================================================
-- 임원진 한마디 & 명언 시스템 (exec_messages / exec_quotes)
-- 실행 위치: Supabase SQL Editor
-- 목적: 홈 위젯과 향후 페이지에서 사용할 운영 공지/명언 데이터 준비
-- ============================================================================

-- 1) exec_messages 테이블 ----------------------------------------------------
create table if not exists public.exec_messages (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references auth.users(id),
  author_name text,
  author_title text,
  avatar_url text,
  message text not null,
  lang text,
  is_active boolean not null default true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_exec_message_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_exec_messages_updated_at on public.exec_messages;
create trigger trg_exec_messages_updated_at
before update on public.exec_messages
for each row execute function public.set_exec_message_updated_at();

alter table public.exec_messages enable row level security;

drop policy if exists exec_messages_read on public.exec_messages;
drop policy if exists exec_messages_write_self on public.exec_messages;

create policy exec_messages_read
  on public.exec_messages
  for select
  to authenticated
  using (true);

create policy exec_messages_write_self
  on public.exec_messages
  for all
  to authenticated
  using (coalesce(author_user_id, auth.uid()) = auth.uid())
  with check (coalesce(author_user_id, auth.uid()) = auth.uid());

-- 2) exec_quotes 테이블 ------------------------------------------------------
create table if not exists public.exec_quotes (
  id uuid primary key default gen_random_uuid(),
  author_code text not null,
  author_name text not null,
  author_title text not null,
  message text not null,
  lang text not null default 'ko',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_exec_quote_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_exec_quotes_updated_at on public.exec_quotes;
create trigger trg_exec_quotes_updated_at
before update on public.exec_quotes
for each row execute function public.set_exec_quote_updated_at();

alter table public.exec_quotes enable row level security;

drop policy if exists exec_quotes_read on public.exec_quotes;
drop policy if exists exec_quotes_write_self on public.exec_quotes;

create policy exec_quotes_read
  on public.exec_quotes
  for select
  to authenticated
  using (true);

create policy exec_quotes_write_self
  on public.exec_quotes
  for all
  to authenticated
  using (true)
  with check (true);

-- 3) 뷰 정의 ----------------------------------------------------------------
-- 최신 공지 1건
create or replace view public.v_exec_message_current as
select
  em.id,
  coalesce(em.author_name, p.last_name) as author_name,
  coalesce(em.author_title, p.rank::text) as author_title,
  coalesce(em.avatar_url, p.avatar_url) as avatar_url,
  em.message,
  em.lang,
  em.created_at
from public.exec_messages em
left join public.profiles p on p.id = em.author_user_id
where em.is_active = true
  and (em.start_at is null or now() >= em.start_at)
  and (em.end_at is null or now() < em.end_at)
order by coalesce(em.start_at, em.created_at) desc, em.created_at desc
limit 1;

-- 오늘의 명언 1건
create or replace view public.v_exec_quote_of_today as
select *
from public.exec_quotes q
where q.is_active = true
order by md5(q.id::text || to_char(now()::date, 'YYYYMMDD')) asc
limit 1;

-- 공지 우선, 없으면 명언
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
    null::text as avatar_url,
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

comment on view public.v_exec_message_current_or_quote is '임원 공지 우선, 없으면 오늘의 명언을 반환';

-- 4) 시드 데이터 -------------------------------------------------------------
insert into public.exec_quotes (author_code, author_name, author_title, message)
values
('ceo','갓끼','CEO','일찍 일어나는 새는 수업가서 존다. 8시간 이상 숙면🩷'),
('cto','갓햄','CTO','일찍 일어나는 벌레는 오운완해서 잽싸게 도망간다.'),
('coo','갓냥','COO','계속 미루는 사람은 하루를 주든 1년을 주든 못 끝냄')
on conflict (id) do nothing;

-- ============================================================================

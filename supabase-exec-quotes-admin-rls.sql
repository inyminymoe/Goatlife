-- ============================================================================
-- 임원진 명언 관리 RLS 정책 & exec_admins 테이블
-- 실행 위치: Supabase SQL Editor
-- 목적: exec_admins 테이블 생성 및 exec_quotes 쓰기 권한을 임원으로 제한
-- ============================================================================

-- 1) exec_admins 테이블 생성 -------------------------------------------------
create table if not exists public.exec_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.exec_admins enable row level security;

-- exec_admins는 모든 authenticated 사용자가 읽을 수 있음 (권한 체크용)
drop policy if exists exec_admins_read on public.exec_admins;
create policy exec_admins_read
  on public.exec_admins
  for select
  to authenticated
  using (true);

-- exec_admins 자체는 슈퍼관리자만 수정 가능 (별도 관리)
-- 필요시 supabase dashboard에서 직접 관리

comment on table public.exec_admins is '임원진 관리자 목록';
comment on column public.exec_admins.user_id is '임원진 사용자 ID';

-- 2) exec_quotes RLS 정책 업데이트 -------------------------------------------
-- 기존 정책 삭제
drop policy if exists exec_quotes_write_self on public.exec_quotes;

-- 새 정책: 임원만 쓰기 허용
drop policy if exists exec_quotes_write_admins on public.exec_quotes;
create policy exec_quotes_write_admins
  on public.exec_quotes
  for all
  to authenticated
  using (
    exists (
      select 1 from public.exec_admins a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exec_admins a
      where a.user_id = auth.uid()
    )
  );

comment on policy exec_quotes_write_admins on public.exec_quotes is 'exec_admins에 등록된 임원만 명언 CRUD 가능';

-- 3) exec_quotes 테이블 컬럼 확인 및 추가 ------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'exec_quotes'
    and column_name = 'avatar_url'
  ) then
    alter table public.exec_quotes add column avatar_url text;
  end if;
end $$;

-- is_explicit 컬럼 추가 (선택사항, 명시적 메시지 여부)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'exec_quotes'
    and column_name = 'is_explicit'
  ) then
    alter table public.exec_quotes add column is_explicit boolean not null default false;
  end if;
end $$;

comment on column public.exec_quotes.avatar_url is '임원 아바타 URL (옵션)';
comment on column public.exec_quotes.is_explicit is '명시적 메시지 여부';

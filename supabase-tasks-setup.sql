-- ================================================
-- 업무계획(칸반) Tasks 테이블 및 뷰 설정
-- ================================================

-- 1. tasks 테이블 생성
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('todo','in_progress','done')) default 'todo',
  order_index int not null default 0,
  estimated_time text, -- 예상 포모도로 개수 (예: '2')
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. 인덱스 생성 (성능 최적화)
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);
create index if not exists idx_tasks_user_order on public.tasks(user_id, order_index);

-- 3. updated_at 자동 업데이트 함수 (이미 있으면 재사용)
create or replace function public.fn_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. updated_at 트리거
drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch
  before update on public.tasks
  for each row
  execute function public.fn_touch_updated_at();

-- 5. RLS 활성화
alter table public.tasks enable row level security;

-- 6. RLS 정책: 자신의 태스크만 조회 가능
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select
  using (auth.uid() = user_id);

-- 7. RLS 정책: 자신의 태스크만 삽입 가능
drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert
  with check (auth.uid() = user_id);

-- 8. RLS 정책: 자신의 태스크만 수정 가능
drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update
  using (auth.uid() = user_id);

-- 9. RLS 정책: 자신의 태스크만 삭제 가능
drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete
  using (auth.uid() = user_id);

-- 10. 뷰: 홈 카드용 (todo 상태 최대 4개)
create or replace view public.v_tasks_todo_top4
with (security_invoker = true) as
select
  id,
  title,
  description,
  status,
  order_index,
  estimated_time,
  created_at
from public.tasks
where user_id = auth.uid() and status = 'todo'
order by order_index asc, created_at asc
limit 4;
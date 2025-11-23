-- 확장 설치 (gen_random_uuid용)
create extension if not exists "pgcrypto";

-- 1) 게시글 테이블
create table if not exists public.board_posts (
  id          uuid primary key default gen_random_uuid(),
  -- 전사 / 부서 게시판 스코프
  scope       text not null check (scope in ('company', 'department')),
  -- 전사게시판일 경우: 공지사항, 성과보고, 브레인연료 등
  board       text,
  -- 부서게시판일 경우: IT부, 공시부 등
  dept        text,

  -- 말머리(분류) → topic
  topic       text not null,

  -- 본문 정보
  title       text not null,
  content     text not null,

  -- 해시태그 배열 (UI에서 #태그 입력으로 들어오는 값들)
  hashtags    text[] not null default '{}'::text[],

  -- 작성자 정보
  author_id   uuid not null references auth.users(id) on delete cascade,
  author_name text,

  -- 메타 정보
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 간단한 인덱스들 (필터/정렬용)
create index if not exists board_posts_scope_board_idx
  on public.board_posts (scope, board);

create index if not exists board_posts_scope_dept_idx
  on public.board_posts (scope, dept);

create index if not exists board_posts_created_at_idx
  on public.board_posts (created_at desc);

-- updated_at 자동 갱신 트리거
create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_board_posts on public.board_posts;

create trigger set_timestamp_board_posts
before update on public.board_posts
for each row
execute procedure public.set_timestamp();

-- RLS 켜기
alter table public.board_posts enable row level security;

-- 로그인 유저는 자기 글 insert 가능
create policy "board_posts_insert_own"
  on public.board_posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- 로그인 유저는 모든 글 조회 가능 (필요시 나중에 조건 강화)
create policy "board_posts_select_all"
  on public.board_posts
  for select
  to authenticated
  using (true);

-- ============================================================================
-- profiles 테이블에 joined_at 컬럼 추가 및 기존 데이터 마이그레이션
-- 실행 위치: Supabase SQL Editor
-- 목적: 카카오 로그인 사용자의 입사일자가 1일차로 나오는 문제 해결
-- ============================================================================

-- 1) profiles 테이블에 joined_at 컬럼 추가 (이미 있으면 무시됨)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'joined_at'
  ) then
    alter table public.profiles add column joined_at timestamptz;
    raise notice 'joined_at 컬럼 추가 완료';
  else
    raise notice 'joined_at 컬럼 이미 존재';
  end if;
end $$;

-- 2) 기존 사용자들의 joined_at을 created_at으로 설정 (NULL인 경우만)
update public.profiles
set joined_at = created_at
where joined_at is null;

-- 3) 트리거 함수 업데이트: 신규 사용자의 joined_at을 자동으로 설정
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md jsonb := new.raw_user_meta_data;
  v_user_id    text;
  v_last_name  text;
  v_first_name text;
  v_department text;
  v_rank       rank_enum;
  v_wh         work_hours_enum;
  v_wt         work_type_enum;
  v_style      text;
  v_ethic      text;
  v_avatar     text;
begin
  -- camel & snake 모두 수용
  v_user_id := coalesce(
    nullif(md->>'user_id', ''),
    nullif(md->>'userId', ''),
    nullif(split_part(new.email, '@', 1), ''),
    concat('guest_', left(new.id::text, 8))
  );

  v_last_name := coalesce(
    nullif(md->>'last_name', ''),
    nullif(md->>'lastName', ''),
    nullif(md->>'profile_nickname', ''),
    nullif(md->>'nickname', ''),
    v_user_id,
    '게스트'
  );
  v_first_name := nullif(coalesce(md->>'first_name', md->>'firstName'), '');
  v_department := coalesce(md->>'department', 'IT부');

  -- enum은 안전 캐스팅 (없으면 기본값)
  begin
    v_rank := coalesce((md->>'rank')::rank_enum, '인턴'::rank_enum);
  exception when others then
    v_rank := '인턴'::rank_enum;
  end;

  begin
    v_wh := coalesce((md->>'work_hours')::work_hours_enum, '주간(09:00-18:00)'::work_hours_enum);
  exception when others then
    v_wh := '주간(09:00-18:00)'::work_hours_enum;
  end;

  begin
    v_wt := coalesce((md->>'work_type')::work_type_enum, '풀타임'::work_type_enum);
  exception when others then
    v_wt := '풀타임'::work_type_enum;
  end;

  v_style  := nullif(coalesce(md->>'work_style', md->>'workStyle'), '');
  v_ethic  := nullif(coalesce(md->>'work_ethic', md->>'workEthic'), '');
  v_avatar := nullif(coalesce(md->>'avatar_url', md->>'avatarUrl'), '');

  insert into public.profiles (
    id, user_id, email, last_name, first_name,
    rank, department, work_hours, work_type,
    work_style, work_ethic, avatar_url, joined_at, created_at, updated_at
  )
  values (
    new.id,
    v_user_id,
    new.email::citext,
    v_last_name,
    v_first_name,
    coalesce(v_rank, '인턴'::rank_enum),
    v_department,
    v_wh,
    v_wt,
    v_style,
    v_ethic,
    v_avatar,
    now(),  -- ✅ joined_at 추가
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;

-- 4) 확인 쿼리
select id, user_id, last_name, joined_at, created_at
from public.profiles
order by created_at desc
limit 10;
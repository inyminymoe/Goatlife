-- ============================================================================
-- 기존 auth.users 사용자들의 profiles 레코드 생성 (백필)
-- 실행 위치: Supabase SQL Editor
-- 목적: 트리거 실행 전에 가입한 사용자들의 profiles 레코드 생성
-- ============================================================================

-- 1) profiles 테이블에 joined_at 컬럼이 있는지 확인 및 추가
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

-- 2) auth.users에는 있지만 profiles에 없는 사용자 확인
select
  u.id,
  u.email,
  u.created_at as user_created_at,
  u.raw_user_meta_data->>'nickname' as kakao_nickname,
  u.raw_user_meta_data->>'name' as kakao_name
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
order by u.created_at desc;

-- 3) profiles 레코드가 없는 기존 사용자들을 자동으로 생성
insert into public.profiles (
  id,
  user_id,
  email,
  last_name,
  first_name,
  rank,
  department,
  work_hours,
  work_type,
  avatar_url,
  joined_at,
  created_at,
  updated_at
)
select
  u.id,
  -- user_id: 이메일 앞부분 또는 guest_xxx
  coalesce(
    nullif(u.raw_user_meta_data->>'user_id', ''),
    nullif(split_part(u.email, '@', 1), ''),
    concat('guest_', left(u.id::text, 8))
  ),
  u.email::citext,
  -- last_name: 카카오 닉네임 또는 이름, 없으면 이메일 앞부분
  coalesce(
    nullif(u.raw_user_meta_data->>'nickname', ''),
    nullif(u.raw_user_meta_data->>'profile_nickname', ''),
    nullif(u.raw_user_meta_data->>'name', ''),
    nullif(u.raw_user_meta_data->>'last_name', ''),
    nullif(split_part(u.email, '@', 1), ''),
    '게스트'
  ),
  -- first_name: 보통 비어있음
  nullif(u.raw_user_meta_data->>'first_name', ''),
  -- rank: 기본값 인턴
  '인턴'::rank_enum,
  -- department: 기본값 IT부
  'IT부',
  -- work_hours: 기본값
  '주간(09:00-18:00)'::work_hours_enum,
  -- work_type: 기본값
  '풀타임'::work_type_enum,
  -- avatar_url: 카카오에서 제공하는 이미지 URL
  nullif(u.raw_user_meta_data->>'avatar_url', ''),
  -- joined_at: auth.users의 created_at 사용 (실제 가입일)
  u.created_at,
  -- created_at, updated_at
  now(),
  now()
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null  -- profiles에 없는 사용자만
on conflict (id) do nothing;

-- 4) 기존 profiles 레코드의 joined_at이 NULL이면 created_at으로 설정
update public.profiles
set joined_at = created_at
where joined_at is null;

-- 5) 결과 확인
select
  p.id,
  p.user_id,
  p.last_name,
  p.email,
  p.joined_at,
  p.created_at,
  extract(day from (now() - p.joined_at)) + 1 as calculated_days
from public.profiles p
order by p.created_at desc
limit 20;
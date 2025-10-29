-- 회원가입 트리거 설정 (A안: 트리거로 profiles 자동생성)
-- Supabase > SQL Editor에서 실행

-- 필요한 확장 (이미 켜져있으면 스킵)
create extension if not exists citext;

-- 1) 새 사용자 생성 시 profiles 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer               -- RLS 우회
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
    work_style, work_ethic, avatar_url, created_at, updated_at
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
    now(), now()
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    -- 디버깅에 도움(로그에서 확인)
    raise warning 'handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;

-- 2) 트리거 재생성
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

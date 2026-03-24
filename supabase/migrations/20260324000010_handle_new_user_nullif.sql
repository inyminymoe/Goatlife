-- ============================================================================
-- Migration 010: handle_new_user() 빈 문자열 처리 보완
--
-- 수정 항목:
--   009에서 work_hours/workHours, work_type/workType 폴백에 COALESCE만 사용했으나
--   빈 문자열('')은 COALESCE가 NULL로 처리하지 않아 camelCase 폴백이 누락될 수 있음.
--   → NULLIF(value, '')로 감싸 빈 문자열도 NULL로 정규화한 뒤 COALESCE 적용.
--   (함수 내 v_first_name, v_style, v_ethic 등 기존 패턴과 일관성 유지)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  md           jsonb := new.raw_user_meta_data;
  v_user_id    text;
  v_last_name  text;
  v_first_name text;
  v_department text;
  v_rank       text;
  v_wh         text;
  v_wt         text;
  v_style      text;
  v_ethic      text;
  v_avatar     text;

  -- 허용값 목록
  valid_ranks  text[] := ARRAY[
    '인턴','사원','주임','대리','과장','차장','부장',
    '이사','상무','전무','부사장','사장','부회장','회장'
  ];
  valid_wh     text[] := ARRAY['주간(09:00-18:00)','오후(17:00-01:00)','야간(22:00-06:00)'];
  valid_wt     text[] := ARRAY['풀타임','파트타임'];
BEGIN
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
  v_first_name := nullif(coalesce(nullif(md->>'first_name', ''), md->>'firstName'), '');
  v_department := coalesce(nullif(md->>'department', ''), 'IT부');

  -- text로 받아서 허용값 검증 후 기본값 fallback
  v_rank := CASE
    WHEN (md->>'rank') = ANY(valid_ranks) THEN md->>'rank'
    ELSE '인턴'
  END;

  -- snake_case + camelCase 모두 수용, 빈 문자열은 NULL로 정규화
  v_wh := CASE
    WHEN coalesce(nullif(md->>'work_hours', ''), nullif(md->>'workHours', '')) = ANY(valid_wh)
      THEN coalesce(nullif(md->>'work_hours', ''), nullif(md->>'workHours', ''))
    ELSE '주간(09:00-18:00)'
  END;

  v_wt := CASE
    WHEN coalesce(nullif(md->>'work_type', ''), nullif(md->>'workType', '')) = ANY(valid_wt)
      THEN coalesce(nullif(md->>'work_type', ''), nullif(md->>'workType', ''))
    ELSE '풀타임'
  END;

  v_style  := nullif(coalesce(nullif(md->>'work_style', ''), md->>'workStyle'), '');
  v_ethic  := nullif(coalesce(nullif(md->>'work_ethic', ''), md->>'workEthic'), '');
  v_avatar := nullif(coalesce(nullif(md->>'avatar_url', ''), md->>'avatarUrl'), '');

  INSERT INTO public.profiles (
    id, user_id, email, last_name, first_name,
    rank, department, work_hours, work_type,
    work_style, work_ethic, avatar_url, joined_at, created_at, updated_at
  )
  VALUES (
    new.id,
    v_user_id,
    new.email::citext,
    v_last_name,
    v_first_name,
    v_rank,
    v_department,
    v_wh,
    v_wt,
    v_style,
    v_ethic,
    v_avatar,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed: %', SQLERRM;
    RETURN new;
END;
$$;

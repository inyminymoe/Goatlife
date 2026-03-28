-- ============================================================================
-- Migration 009: handle_new_user() camelCase 키 누락 보완
--
-- 수정 항목:
--   1. work_hours: md->>'workHours' 폴백 추가 (기존 008에서 누락)
--   2. work_type:  md->>'workType'  폴백 추가 (기존 008에서 누락)
--   3. board_types_scope_name_dept_uniq 인덱스 생성 전 중복 행 사전 제거
--      (중복이 있을 경우 CREATE UNIQUE INDEX가 실패하므로 idempotent 처리)
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. handle_new_user() — workHours / workType camelCase 폴백 추가
-- ──────────────────────────────────────────────────────────────────────────────

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
  v_first_name := nullif(coalesce(md->>'first_name', md->>'firstName'), '');
  v_department := coalesce(md->>'department', 'IT부');

  -- text로 받아서 허용값 검증 후 기본값 fallback
  v_rank := CASE
    WHEN (md->>'rank') = ANY(valid_ranks) THEN md->>'rank'
    ELSE '인턴'
  END;

  -- snake_case + camelCase 모두 수용 (workHours / work_hours)
  v_wh := CASE
    WHEN coalesce(md->>'work_hours', md->>'workHours') = ANY(valid_wh)
      THEN coalesce(md->>'work_hours', md->>'workHours')
    ELSE '주간(09:00-18:00)'
  END;

  -- snake_case + camelCase 모두 수용 (workType / work_type)
  v_wt := CASE
    WHEN coalesce(md->>'work_type', md->>'workType') = ANY(valid_wt)
      THEN coalesce(md->>'work_type', md->>'workType')
    ELSE '풀타임'
  END;

  v_style  := nullif(coalesce(md->>'work_style', md->>'workStyle'), '');
  v_ethic  := nullif(coalesce(md->>'work_ethic', md->>'workEthic'), '');
  v_avatar := nullif(coalesce(md->>'avatar_url', md->>'avatarUrl'), '');

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

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. board_types UNIQUE index 중복 보호
--    이미 인덱스가 존재하면 건너뜀 (IF NOT EXISTS로 안전)
--    중복 행이 있을 경우 가장 오래된 행만 남기고 나머지 삭제
-- ──────────────────────────────────────────────────────────────────────────────

-- 중복 제거: 동일 (scope, name, COALESCE(dept,'')) 그룹에서 id가 가장 작은 행만 유지
DELETE FROM public.board_types
WHERE id NOT IN (
  SELECT DISTINCT ON (scope, name, COALESCE(dept, '')) id
  FROM public.board_types
  ORDER BY scope, name, COALESCE(dept, ''), id
);

-- 인덱스 재생성 (008에서 이미 만들어졌을 경우 IF NOT EXISTS로 무시)
CREATE UNIQUE INDEX IF NOT EXISTS board_types_scope_name_dept_uniq
  ON public.board_types (scope, name, COALESCE(dept, ''));

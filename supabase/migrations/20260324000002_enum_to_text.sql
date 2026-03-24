-- ============================================================================
-- Migration 002: PostgreSQL enum → text + CHECK constraint 전환
-- 이유: enum은 값 변경/삭제가 불가능해서 서비스 확장 시 migration 비용이 큼
--       text + CHECK는 값 추가/수정이 단순한 ALTER TABLE로 가능
-- 영향 테이블: profiles (rank, work_hours, work_type), exec_admins (role)
-- 주의: rank/work_hours/work_type 컬럼을 참조하는 뷰를 먼저 드롭 후 재생성
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 0. 의존 뷰 드롭 (rank, work_hours, work_type 참조)
-- v_exec_message_current_or_quote → v_exec_message_current 순으로 드롭
-- ──────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.v_exec_message_current_or_quote;
DROP VIEW IF EXISTS public.v_exec_message_current;
DROP VIEW IF EXISTS public.v_user_summary_self;

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. rank_enum → text
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ALTER COLUMN rank DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN rank TYPE text USING rank::text;
ALTER TABLE public.profiles ALTER COLUMN rank SET DEFAULT '인턴';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rank_check
  CHECK (rank IN (
    '인턴','사원','주임','대리','과장','차장','부장',
    '이사','상무','전무','부사장','사장','부회장','회장'
  ));

DROP TYPE public.rank_enum;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. work_hours_enum → text
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ALTER COLUMN work_hours DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN work_hours TYPE text USING work_hours::text;
ALTER TABLE public.profiles ALTER COLUMN work_hours SET DEFAULT '주간(09:00-18:00)';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_work_hours_check
  CHECK (work_hours IN ('주간(09:00-18:00)', '오후(17:00-01:00)', '야간(22:00-06:00)'));

DROP TYPE public.work_hours_enum;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. work_type_enum → text
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ALTER COLUMN work_type DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN work_type TYPE text USING work_type::text;
ALTER TABLE public.profiles ALTER COLUMN work_type SET DEFAULT '풀타임';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_work_type_check
  CHECK (work_type IN ('풀타임', '파트타임'));

DROP TYPE public.work_type_enum;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. admin_role_enum → text (exec_admins.role)
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.exec_admins ALTER COLUMN role TYPE text USING role::text;

ALTER TABLE public.exec_admins
  ADD CONSTRAINT exec_admins_role_check
  CHECK (role IN ('CEO', 'COO', 'CTO'));

DROP TYPE public.admin_role_enum;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. 뷰 재생성 (컬럼이 이제 text이므로 ::text 캐스팅 불필요)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE VIEW public.v_exec_message_current AS
  SELECT
    em.id,
    COALESCE(em.author_name, p.last_name::text) AS author_name,
    COALESCE(em.author_title, p.rank) AS author_title,
    COALESCE(em.avatar_url, p.avatar_url) AS avatar_url,
    em.message,
    em.lang,
    em.created_at
  FROM public.exec_messages em
    LEFT JOIN public.profiles p ON p.id = em.author_user_id
  WHERE
    em.is_active = true
    AND (em.start_at IS NULL OR now() >= em.start_at)
    AND (em.end_at IS NULL OR now() < em.end_at)
  ORDER BY COALESCE(em.start_at, em.created_at) DESC, em.created_at DESC
  LIMIT 1;

CREATE VIEW public.v_exec_message_current_or_quote AS
  WITH current_msg AS (
    SELECT
      em.id,
      COALESCE(em.author_name, '임원'::text) AS author_name,
      COALESCE(em.author_title, '임원진'::text) AS author_title,
      em.avatar_url,
      em.message,
      em.lang,
      em.created_at,
      true AS is_explicit_message
    FROM public.v_exec_message_current em
  ), today_quote AS (
    SELECT
      q.id,
      q.author_name,
      q.author_title,
      q.avatar_url,
      q.message,
      q.lang,
      q.created_at,
      false AS is_explicit_message
    FROM public.v_exec_quote_of_today q
  )
  SELECT * FROM current_msg
  UNION ALL
  SELECT * FROM today_quote
  WHERE NOT EXISTS (SELECT 1 FROM current_msg);

COMMENT ON VIEW public.v_exec_message_current_or_quote IS '임원 공지 우선, 없으면 오늘의 명언을 반환 (avatar_url 포함)';

CREATE VIEW public.v_user_summary_self WITH (security_invoker = 'on') AS
  SELECT
    id AS auth_user_id,
    user_id AS handle,
    COALESCE(NULLIF(last_name::text, ''), NULLIF(first_name::text, ''), '사용자') AS display_name,
    rank,
    department,
    work_hours,
    work_type,
    avatar_url,
    created_at,
    GREATEST(1, floor(
      EXTRACT(epoch FROM (
        timezone('Asia/Seoul', now()) - timezone('Asia/Seoul', COALESCE(joined_at, created_at, now()))
      )) / 86400
    ) + 1)::integer AS joined_days,
    0 AS performance_rate
  FROM public.profiles p
  WHERE id = auth.uid();

COMMENT ON VIEW public.v_user_summary_self IS '사원정보 카드용 뷰. joined_at (또는 created_at) 기준 joined_days 계산, 내 정보만 반환.';

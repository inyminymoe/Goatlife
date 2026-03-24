-- ============================================================================
-- Migration 008: CodeRabbit 리뷰 반영 수정
--
-- 수정 항목:
--   1. [긴급] handle_new_user() — 삭제된 enum 타입 참조 제거
--   2. [긴급] pg_cron 실행 순서 — 댓글 먼저 삭제 후 게시글 (FK cascade 문제)
--   3. deleted_at 부분 인덱스 추가 (purge 쿼리 성능)
--   4. board_posts_select RLS — board_type_id 명시적 테이블 한정
--   5. board_types UNIQUE — NULL dept 중복 허용 문제 수정
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. handle_new_user() 재작성 — enum → text
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

  v_wh := CASE
    WHEN (md->>'work_hours') = ANY(valid_wh) THEN md->>'work_hours'
    ELSE '주간(09:00-18:00)'
  END;

  v_wt := CASE
    WHEN (md->>'work_type') = ANY(valid_wt) THEN md->>'work_type'
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
-- 2. pg_cron 순서 수정 — 댓글 먼저, 게시글 나중 (FK 관계 고려)
--    기존 두 job을 제거하고 단일 job으로 합쳐 트랜잭션 내에서 순서 보장
-- ──────────────────────────────────────────────────────────────────────────────

SELECT cron.unschedule('purge-deleted-board-posts');
SELECT cron.unschedule('purge-deleted-board-comments');

SELECT cron.schedule(
  'purge-deleted-board-content',
  '0 18 * * *',  -- UTC 18:00 = KST 03:00
  $$
    -- 댓글 먼저 삭제 (board_posts FK 자식)
    DELETE FROM public.board_post_comments
    WHERE deleted_at < now() - interval '30 days';

    -- 게시글 삭제 (board_posts FK 부모)
    DELETE FROM public.board_posts
    WHERE deleted_at < now() - interval '30 days';
  $$
);

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. deleted_at 부분 인덱스 — purge 쿼리 풀스캔 방지
-- ──────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS board_posts_deleted_at_idx
  ON public.board_posts (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS board_post_comments_deleted_at_idx
  ON public.board_post_comments (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. board_posts_select RLS — board_type_id 명시적 한정
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS board_posts_select ON public.board_posts;

CREATE POLICY board_posts_select ON public.board_posts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      board_posts.board_type_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.board_types bt
        WHERE bt.id = board_posts.board_type_id
          AND (bt.requires_auth = false OR auth.uid() IS NOT NULL)
      )
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. board_types UNIQUE NULL 처리
--    기존 UNIQUE(scope, name, dept)는 dept=NULL일 때 중복 허용 → 인덱스로 교체
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.board_types
  DROP CONSTRAINT IF EXISTS board_types_scope_name_dept_key;

CREATE UNIQUE INDEX IF NOT EXISTS board_types_scope_name_dept_uniq
  ON public.board_types (scope, name, COALESCE(dept, ''));

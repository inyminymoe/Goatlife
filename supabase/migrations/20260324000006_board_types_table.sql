-- ============================================================================
-- Migration 006: board_types 참조 테이블 + 게시판 접근 레벨 RLS
-- board_posts.scope/board/dept text 자유형을 참조 테이블로 관리
-- requires_auth: true면 로그인한 사용자만 게시글 읽기 가능
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. board_types 테이블 생성
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.board_types (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope         text NOT NULL CHECK (scope IN ('company', 'department')),
  name          text NOT NULL,
  dept          text,                          -- scope='department'일 때만 사용
  description   text,
  requires_auth boolean NOT NULL DEFAULT false, -- true = 로그인 필수
  order_index   integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, name, dept)
);

COMMENT ON COLUMN public.board_types.requires_auth IS 'true = 인증된 사용자만 읽기 가능 (사내신문고 등).';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.board_types ENABLE ROW LEVEL SECURITY;

-- 게시판 목록은 전체 공개 (실제 게시글 접근 제어는 board_posts RLS에서)
CREATE POLICY board_types_public_read ON public.board_types
  FOR SELECT USING (true);

-- 쓰기: 어드민만 (초기에는 Supabase 대시보드에서 직접 관리)
CREATE POLICY board_types_admin_write ON public.board_types
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. board_posts에 board_type_id 추가
-- 기존 scope/board/dept 컬럼은 코드 마이그레이션 완료 후 별도 migration으로 제거
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS board_type_id uuid REFERENCES public.board_types(id);

COMMENT ON COLUMN public.board_posts.board_type_id IS 'board_types 참조. NULL이면 기존 scope/board/dept로 동작 (마이그레이션 기간 중).';

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. board_posts SELECT RLS 교체
-- 기존 정책 2개(중복)를 제거하고 deleted_at + requires_auth 반영한 단일 정책으로
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow read to all users" ON public.board_posts;
DROP POLICY IF EXISTS "board_posts_select_all" ON public.board_posts;

-- 읽기 조건:
--   1. soft delete 아닌 것
--   2. board_type_id 없으면 기존 방식 유지 (전체 공개)
--   3. board_type_id 있으면 requires_auth 체크
CREATE POLICY board_posts_select ON public.board_posts
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      board_type_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.board_types bt
        WHERE bt.id = board_type_id
          AND (bt.requires_auth = false OR auth.uid() IS NOT NULL)
      )
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. 초기 시드: 기존 board_posts 값 기반 board_types 생성
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO public.board_types (scope, name, dept, requires_auth)
  SELECT DISTINCT
    scope,
    COALESCE(board, dept, '일반') AS name,
    CASE WHEN scope = 'department' THEN dept ELSE NULL END,
    false
  FROM public.board_posts
  WHERE scope IS NOT NULL
ON CONFLICT (scope, name, dept) DO NOTHING;

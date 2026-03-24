-- ============================================================================
-- Migration 003: profiles 확장 및 is_admin() 함수
-- 추가 항목:
--   - profiles.role: 시스템 권한 레벨 (user/admin)
--   - profiles.locale: 다국어 대비 언어 설정
--   - profiles.timezone: 글로벌 서비스 대비 시간대 설정
--   - is_admin(): RLS 전반에서 사용할 권한 체크 함수
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. profiles 컬럼 추가
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ko',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Asia/Seoul';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin'));

COMMENT ON COLUMN public.profiles.role IS '시스템 권한 레벨. admin은 게시판/부서 등 관리 가능.';
COMMENT ON COLUMN public.profiles.locale IS '사용자 언어 설정. 다국어 서비스 시 사용 (기본: ko).';
COMMENT ON COLUMN public.profiles.timezone IS '사용자 시간대. 글로벌 서비스 시 사용 (기본: Asia/Seoul).';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. is_admin() 함수
-- SECURITY DEFINER: RLS 우회해서 profiles 조회 가능
-- STABLE: 동일 트랜잭션 내에서 결과 캐싱 → RLS 성능 최적화
-- ──────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin IS 'profiles.role = admin 여부 확인. RLS 정책에서 사용.';

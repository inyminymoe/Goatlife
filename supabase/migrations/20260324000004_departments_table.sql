-- ============================================================================
-- Migration 004: departments 참조 테이블
-- 이유: profiles.department가 text 자유형이라 부서명 오타/불일치 가능
--       참조 테이블로 관리하면 부서 개편 시 row 하나만 수정하면 전파됨
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. departments 테이블 생성
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  is_active   boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.departments IS '사내 부서 목록. 부서 개편 시 이 테이블만 수정하면 전체 반영.';
COMMENT ON COLUMN public.departments.is_active IS 'false = 폐지된 부서. 기존 데이터 보존하면서 신규 선택 불가.';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RLS
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 읽기: 인증된 사용자 전체
CREATE POLICY departments_read ON public.departments
  FOR SELECT TO authenticated USING (true);

-- 쓰기: 어드민만 (어드민 페이지 개발 전까지는 Supabase 대시보드에서 직접 관리)
CREATE POLICY departments_admin_write ON public.departments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. 기존 profiles.department 값으로 시드
-- ──────────────────────────────────────────────────────────────────────────────

INSERT INTO public.departments (name)
  SELECT DISTINCT department
  FROM public.profiles
  WHERE department IS NOT NULL AND department <> ''
ON CONFLICT (name) DO NOTHING;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. profiles에 department_id FK 추가 및 기존 데이터 마이그레이션
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id);

-- 기존 department text → department_id 매핑
UPDATE public.profiles p
  SET department_id = d.id
  FROM public.departments d
  WHERE p.department = d.name;

-- profiles.department는 코드 마이그레이션 완료 후 별도 migration으로 제거
COMMENT ON COLUMN public.profiles.department IS 'DEPRECATED: department_id로 대체 예정. 코드 마이그레이션 완료 후 제거.';

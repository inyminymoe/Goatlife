-- ============================================================================
-- 임원진(Executive) 시스템 구축
-- ============================================================================
-- 목적: 일반 회원과 구분되는 임원진 전용 직함 관리
--       (갓끼 CEO, 갓냥 COO, 갓햄 CTO)
-- ============================================================================

-- 1. profiles 테이블에 executive_title 컬럼 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS executive_title TEXT NULL;

-- 2. executive_title에 코멘트 추가
COMMENT ON COLUMN public.profiles.executive_title IS
'임원진 전용 직함 (CEO, COO, CTO 등). NULL이면 일반 회원.';

-- 3. 임원진 설정
-- 갓끼 CEO
UPDATE public.profiles
SET executive_title = 'CEO'
WHERE last_name LIKE '%갓끼%'
   OR first_name LIKE '%갓끼%'
   OR email ILIKE '%godkki%'
   OR email ILIKE '%gatkki%';

-- 갓냥 COO
UPDATE public.profiles
SET executive_title = 'COO'
WHERE last_name LIKE '%갓냥%'
   OR first_name LIKE '%갓냥%'
   OR email ILIKE '%godnyang%'
   OR email ILIKE '%gatnyang%';

-- 갓햄 CTO
UPDATE public.profiles
SET executive_title = 'CTO'
WHERE last_name LIKE '%갓햄%'
   OR first_name LIKE '%갓햄%'
   OR email ILIKE '%godham%'
   OR email ILIKE '%gatham%';

-- 4. 확인용 쿼리
SELECT
  id,
  email,
  last_name,
  first_name,
  rank,
  executive_title,
  department
FROM public.profiles
WHERE executive_title IS NOT NULL;

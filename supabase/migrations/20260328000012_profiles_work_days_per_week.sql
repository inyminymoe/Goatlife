-- profiles 테이블에 주당 근무일 수 컬럼 추가
-- 기본값 5 (평일 근무), 1~7 사이의 정수
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER NOT NULL DEFAULT 5;

-- CHECK 제약 조건을 별도 statement로 분리
-- (ADD COLUMN IF NOT EXISTS와 함께 쓰면 컬럼이 이미 존재할 때 CHECK가 누락될 수 있음)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_work_days_per_week_range'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_work_days_per_week_range
        CHECK (work_days_per_week BETWEEN 1 AND 7);
  END IF;
END $$;

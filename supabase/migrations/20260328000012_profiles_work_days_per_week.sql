-- profiles 테이블에 주당 근무일 수 컬럼 추가
-- 기본값 5 (평일 근무), 1~7 사이의 정수
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER NOT NULL DEFAULT 5
    CHECK (work_days_per_week BETWEEN 1 AND 7);

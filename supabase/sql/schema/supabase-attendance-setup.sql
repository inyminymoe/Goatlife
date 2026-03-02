-- ============================================================================
-- 갓생상사 근태관리 시스템 설정 스크립트
-- ============================================================================
-- 이 스크립트는 다음을 생성합니다:
-- 1. attendance_logs 테이블 (출퇴근 로그)
-- 2. v_attendance_summary 뷰 (출근율 계산)
-- 3. fn_clock_in, fn_early_leave, fn_clock_out RPC 함수들
-- 4. RLS (Row Level Security) 정책
-- ============================================================================

-- ============================================================================
-- 1. attendance_logs 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  clock_in_at TIMESTAMPTZ,
  early_leave_at TIMESTAMPTZ,
  clock_out_at TIMESTAMPTZ,
  work_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'in', 'early', 'out')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 한 사용자는 하루에 하나의 근태 기록만 가질 수 있음
  UNIQUE(user_id, work_date)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON public.attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_work_date ON public.attendance_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date ON public.attendance_logs(user_id, work_date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_attendance_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendance_logs_updated_at ON public.attendance_logs;
CREATE TRIGGER trigger_update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_attendance_logs_updated_at();

-- ============================================================================
-- 2. RLS (Row Level Security) 정책 설정
-- ============================================================================
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재실행 시 충돌 방지)
DROP POLICY IF EXISTS "Users can view own attendance logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can insert own attendance logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can update own attendance logs" ON public.attendance_logs;

-- 사용자는 자신의 근태 기록만 조회 가능
CREATE POLICY "Users can view own attendance logs"
  ON public.attendance_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 근태 기록만 생성 가능
CREATE POLICY "Users can insert own attendance logs"
  ON public.attendance_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 근태 기록만 업데이트 가능
CREATE POLICY "Users can update own attendance logs"
  ON public.attendance_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. v_attendance_summary 뷰 생성 (출근율 계산)
-- ============================================================================
-- 기존 뷰 삭제 (재실행 시 충돌 방지)
DROP VIEW IF EXISTS public.v_attendance_summary;

CREATE VIEW public.v_attendance_summary AS
SELECT
  user_id,
  COUNT(*) AS total_days,
  COUNT(CASE WHEN status != 'none' THEN 1 END) AS attended_days,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((COUNT(CASE WHEN status != 'none' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    ELSE 0
  END AS attendance_rate
FROM public.attendance_logs
GROUP BY user_id;

-- 뷰에 대한 RLS 정책
ALTER VIEW public.v_attendance_summary SET (security_invoker = on);

-- ============================================================================
-- 4. fn_clock_in 함수 생성 (출근 처리)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_clock_in(
  p_user_id UUID,
  p_work_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_log public.attendance_logs;
  v_result public.attendance_logs;
BEGIN
  -- 권한 확인: 본인만 출근 처리 가능
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only clock in for yourself';
  END IF;

  -- 기존 기록 확인
  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  -- 이미 출근 기록이 있으면 에러
  IF v_existing_log.id IS NOT NULL AND v_existing_log.clock_in_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already clocked in today';
  END IF;

  -- 새 출근 기록 생성 또는 업데이트
  INSERT INTO public.attendance_logs (user_id, work_date, clock_in_at, status)
  VALUES (p_user_id, p_work_date, NOW(), 'in')
  ON CONFLICT (user_id, work_date)
  DO UPDATE SET
    clock_in_at = NOW(),
    status = 'in',
    updated_at = NOW()
  RETURNING * INTO v_result;

  -- JSON 형식으로 반환
  RETURN row_to_json(v_result);
END;
$$;

-- ============================================================================
-- 5. fn_early_leave 함수 생성 (조퇴 처리)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_early_leave(
  p_user_id UUID,
  p_work_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_log public.attendance_logs;
  v_result public.attendance_logs;
  v_work_minutes INTEGER;
BEGIN
  -- 권한 확인: 본인만 조퇴 처리 가능
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only process early leave for yourself';
  END IF;

  -- 기존 기록 확인
  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  -- 출근 기록이 없으면 에러
  IF v_existing_log.id IS NULL OR v_existing_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for today';
  END IF;

  -- 이미 조퇴 또는 퇴근 처리된 경우 에러
  IF v_existing_log.status IN ('early', 'out') THEN
    RAISE EXCEPTION 'Already processed early leave or clock out';
  END IF;

  -- 근무 시간 계산 (분 단위)
  v_work_minutes := EXTRACT(EPOCH FROM (NOW() - v_existing_log.clock_in_at)) / 60;

  -- 조퇴 처리
  UPDATE public.attendance_logs
  SET
    early_leave_at = NOW(),
    work_minutes = v_work_minutes,
    status = 'early',
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  -- JSON 형식으로 반환
  RETURN row_to_json(v_result);
END;
$$;

-- ============================================================================
-- 6. fn_clock_out 함수 생성 (퇴근 처리)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_clock_out(
  p_user_id UUID,
  p_work_date DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_log public.attendance_logs;
  v_result public.attendance_logs;
  v_work_minutes INTEGER;
BEGIN
  -- 권한 확인: 본인만 퇴근 처리 가능
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only clock out for yourself';
  END IF;

  -- 기존 기록 확인
  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  -- 출근 기록이 없으면 에러
  IF v_existing_log.id IS NULL OR v_existing_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for today';
  END IF;

  -- 이미 퇴근 처리된 경우 에러
  IF v_existing_log.status = 'out' THEN
    RAISE EXCEPTION 'Already clocked out';
  END IF;

  -- 근무 시간 계산 (분 단위)
  -- 조퇴한 경우 조퇴 시간부터 퇴근 시간까지는 계산하지 않음
  IF v_existing_log.status = 'early' AND v_existing_log.early_leave_at IS NOT NULL THEN
    v_work_minutes := EXTRACT(EPOCH FROM (v_existing_log.early_leave_at - v_existing_log.clock_in_at)) / 60;
  ELSE
    v_work_minutes := EXTRACT(EPOCH FROM (NOW() - v_existing_log.clock_in_at)) / 60;
  END IF;

  -- 퇴근 처리
  UPDATE public.attendance_logs
  SET
    clock_out_at = NOW(),
    work_minutes = v_work_minutes,
    status = 'out',
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  -- JSON 형식으로 반환
  RETURN row_to_json(v_result);
END;
$$;

-- ============================================================================
-- 7. RPC 함수에 대한 권한 부여
-- ============================================================================
-- 인증된 사용자만 RPC 함수 실행 가능
GRANT EXECUTE ON FUNCTION public.fn_clock_in TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_early_leave TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_clock_out TO authenticated;


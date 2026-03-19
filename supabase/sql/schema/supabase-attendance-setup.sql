-- ============================================================================
-- 갓생상사 근태관리 시스템 설정 스크립트
-- ============================================================================
-- 이 스크립트는 다음을 생성합니다:
-- 1. attendance_logs 테이블 (출퇴근 로그)
-- 2. v_attendance_summary 뷰 (출근율 계산)
-- 3. fn_clock_in, fn_early_leave, fn_clock_out, fn_undo_clock_out RPC 함수들
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
  note TEXT,
  status TEXT NOT NULL DEFAULT 'absent'
    CHECK (status IN ('present', 'late', 'early_leave', 'absent', 'vacation')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id
  ON public.attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_work_date
  ON public.attendance_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date
  ON public.attendance_logs(user_id, work_date);

CREATE OR REPLACE FUNCTION public.update_attendance_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attendance_logs_updated_at
  ON public.attendance_logs;
CREATE TRIGGER trigger_update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_attendance_logs_updated_at();

-- ============================================================================
-- 2. RLS (Row Level Security) 정책 설정
-- ============================================================================
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attendance logs"
  ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can insert own attendance logs"
  ON public.attendance_logs;
DROP POLICY IF EXISTS "Users can update own attendance logs"
  ON public.attendance_logs;

CREATE POLICY "Users can view own attendance logs"
  ON public.attendance_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance logs"
  ON public.attendance_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance logs"
  ON public.attendance_logs
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. v_attendance_summary 뷰 생성 (출근율 계산)
-- ============================================================================
DROP VIEW IF EXISTS public.v_attendance_summary;

CREATE VIEW public.v_attendance_summary AS
SELECT
  user_id,
  COUNT(*) AS total_days,
  COUNT(
    CASE
      WHEN status IN ('present', 'late', 'early_leave') THEN 1
      ELSE NULL
    END
  ) AS attended_days,
  COUNT(CASE WHEN status = 'late' THEN 1 ELSE NULL END) AS late_days,
  COUNT(CASE WHEN status = 'early_leave' THEN 1 ELSE NULL END) AS early_leave_days,
  COUNT(CASE WHEN status = 'vacation' THEN 1 ELSE NULL END) AS vacation_days,
  COUNT(CASE WHEN status = 'absent' THEN 1 ELSE NULL END) AS absent_days,
  CASE
    WHEN COUNT(*) > 0 THEN
      ROUND((
        COUNT(
          CASE
            WHEN status IN ('present', 'late', 'early_leave') THEN 1
            ELSE NULL
          END
        )::NUMERIC / COUNT(*)::NUMERIC
      ) * 100, 2)
    ELSE 0
  END AS attendance_rate
FROM public.attendance_logs
GROUP BY user_id;

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
  v_status TEXT;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only clock in for yourself';
  END IF;

  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  IF v_existing_log.id IS NOT NULL AND v_existing_log.clock_in_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already clocked in today';
  END IF;

  IF v_existing_log.id IS NOT NULL
     AND v_existing_log.status IN ('vacation', 'absent') THEN
    RAISE EXCEPTION 'Attendance already finalized for today';
  END IF;

  v_status := CASE
    WHEN (timezone('Asia/Seoul', NOW()))::time > TIME '09:00' THEN 'late'
    ELSE 'present'
  END;

  INSERT INTO public.attendance_logs (
    user_id,
    work_date,
    clock_in_at,
    early_leave_at,
    clock_out_at,
    work_minutes,
    status
  )
  VALUES (
    p_user_id,
    p_work_date,
    NOW(),
    NULL,
    NULL,
    0,
    v_status
  )
  ON CONFLICT (user_id, work_date)
  DO UPDATE SET
    clock_in_at = NOW(),
    early_leave_at = NULL,
    clock_out_at = NULL,
    work_minutes = 0,
    status = v_status,
    updated_at = NOW()
  WHERE attendance_logs.status NOT IN ('vacation', 'absent')
  RETURNING * INTO v_result;

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
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only process early leave for yourself';
  END IF;

  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date
  FOR UPDATE;

  IF v_existing_log.id IS NULL OR v_existing_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for today';
  END IF;

  IF v_existing_log.early_leave_at IS NOT NULL OR v_existing_log.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already processed early leave or clock out';
  END IF;

  v_work_minutes := EXTRACT(EPOCH FROM (NOW() - v_existing_log.clock_in_at)) / 60;

  UPDATE public.attendance_logs
  SET
    early_leave_at = NOW(),
    clock_out_at = NOW(),
    work_minutes = v_work_minutes,
    status = 'early_leave',
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

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
  v_next_status TEXT;
  v_finalized_at TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only clock out for yourself';
  END IF;

  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date
  FOR UPDATE;

  IF v_existing_log.id IS NULL OR v_existing_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for today';
  END IF;

  IF v_existing_log.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already clocked out';
  END IF;

  IF v_existing_log.status = 'early_leave' AND v_existing_log.early_leave_at IS NOT NULL THEN
    v_work_minutes := FLOOR(
      EXTRACT(
        EPOCH FROM (v_existing_log.early_leave_at - v_existing_log.clock_in_at)
      ) / 60.0
    )::INT;
    v_next_status := 'early_leave';
  ELSE
    v_work_minutes := FLOOR(
      EXTRACT(EPOCH FROM (v_finalized_at - v_existing_log.clock_in_at)) / 60.0
    )::INT;
    v_next_status := CASE
      WHEN (v_finalized_at - v_existing_log.clock_in_at) < INTERVAL '8 hours' THEN 'early_leave'
      WHEN v_existing_log.status = 'late' THEN 'late'
      ELSE 'present'
    END;
  END IF;

  UPDATE public.attendance_logs
  SET
    clock_out_at = v_finalized_at,
    early_leave_at = CASE
      WHEN v_next_status = 'early_leave' THEN
        COALESCE(v_existing_log.early_leave_at, v_finalized_at)
      ELSE NULL
    END,
    work_minutes = v_work_minutes,
    status = v_next_status,
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- ============================================================================
-- 7. fn_undo_clock_out 함수 생성 (퇴근 취소)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_undo_clock_out(
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
  v_next_status TEXT;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only undo clock out for yourself';
  END IF;

  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date
  FOR UPDATE;

  IF v_existing_log.id IS NULL OR v_existing_log.clock_out_at IS NULL THEN
    RAISE EXCEPTION 'No clock-out record found for today';
  END IF;

  v_next_status := CASE
    WHEN (timezone('Asia/Seoul', v_existing_log.clock_in_at))::time > TIME '09:00'
      THEN 'late'
    ELSE 'present'
  END;

  UPDATE public.attendance_logs
  SET
    clock_out_at = NULL,
    early_leave_at = NULL,
    work_minutes = 0,
    status = v_next_status,
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- ============================================================================
-- 8. RPC 함수에 대한 권한 부여
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.fn_clock_in TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_early_leave TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_clock_out TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_undo_clock_out TO authenticated;

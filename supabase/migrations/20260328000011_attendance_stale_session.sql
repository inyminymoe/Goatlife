-- Migration: attendance stale session support
-- Adds is_manual_close column and two RPCs for closing orphaned sessions.

-- ── 1. 컬럼 추가 ──────────────────────────────────────────────────────────────
ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS is_manual_close BOOLEAN NOT NULL DEFAULT FALSE;


-- ── 2. fn_close_stale_session ─────────────────────────────────────────────────
-- 사용자가 직접 퇴근 시간을 입력해 고아 세션을 소급 처리한다.
-- p_clock_out_at 은 출근 시각 + 8h 를 초과하면 8h 로 자동 캡핑된다.
CREATE OR REPLACE FUNCTION public.fn_close_stale_session(
  p_user_id      uuid,
  p_work_date    date,
  p_clock_out_at timestamptz
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log          public.attendance_logs;
  v_result       public.attendance_logs;
  v_capped_out   TIMESTAMPTZ;
  v_work_minutes INTEGER;
  v_next_status  TEXT;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only close your own stale session';
  END IF;

  SELECT * INTO v_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  IF v_log.id IS NULL OR v_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for the given date';
  END IF;

  IF v_log.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Session already closed';
  END IF;

  -- 8h 캡 적용
  v_capped_out := LEAST(p_clock_out_at, v_log.clock_in_at + INTERVAL '8 hours');

  v_work_minutes := FLOOR(
    EXTRACT(EPOCH FROM (v_capped_out - v_log.clock_in_at)) / 60.0
  )::INT;

  v_next_status := CASE
    WHEN v_work_minutes < 480 THEN 'early_leave'
    WHEN v_log.status = 'late'  THEN 'late'
    ELSE 'present'
  END;

  UPDATE public.attendance_logs
  SET
    clock_out_at    = v_capped_out,
    early_leave_at  = CASE WHEN v_next_status = 'early_leave' THEN v_capped_out ELSE NULL END,
    work_minutes    = v_work_minutes,
    status          = v_next_status,
    is_manual_close = TRUE,
    updated_at      = NOW()
  WHERE id = v_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;


-- ── 3. fn_auto_close_stale_session ────────────────────────────────────────────
-- 시스템이 고아 세션을 출근 시각 + 8h 로 자동 마감한다.
-- 사용자가 직접 호출하지만 UI 에서 "자동 닫기" 동선으로만 진입한다.
CREATE OR REPLACE FUNCTION public.fn_auto_close_stale_session(
  p_user_id   uuid,
  p_work_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_log        public.attendance_logs;
  v_result     public.attendance_logs;
  v_clock_out  TIMESTAMPTZ;
  v_next_status TEXT;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only auto-close your own stale session';
  END IF;

  SELECT * INTO v_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  IF v_log.id IS NULL OR v_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for the given date';
  END IF;

  IF v_log.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Session already closed';
  END IF;

  v_clock_out   := v_log.clock_in_at + INTERVAL '8 hours';
  v_next_status := CASE WHEN v_log.status = 'late' THEN 'late' ELSE 'present' END;

  UPDATE public.attendance_logs
  SET
    clock_out_at    = v_clock_out,
    early_leave_at  = NULL,
    work_minutes    = 480,
    status          = v_next_status,
    is_manual_close = FALSE,
    updated_at      = NOW()
  WHERE id = v_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

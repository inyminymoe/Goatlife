-- Migration: fix stale session auth check and work_minutes lower-bound cap
--
-- #169  fn_close_stale_session / fn_auto_close_stale_session:
--       auth.uid() != p_user_id 는 auth.uid()가 NULL일 때 NULL(falsy)로 평가되어
--       미인증 호출이 인가 체크를 우회할 수 있음.
--       IS DISTINCT FROM 으로 교체해 NULL-safe 비교를 보장한다.
--
-- #168  fn_close_stale_session:
--       p_clock_out_at 이 clock_in_at 보다 이른 경우 work_minutes 가 음수가 됨.
--       GREATEST(p_clock_out_at, v_log.clock_in_at) 로 하한 캡을 추가한다.


-- ── fn_close_stale_session ────────────────────────────────────────────────────
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
  -- #169: IS DISTINCT FROM 으로 NULL-safe 인가 체크
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
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

  -- #168: 하한(clock_in_at) + 상한(clock_in_at + 8h) 양방향 캡 적용
  v_capped_out := GREATEST(p_clock_out_at, v_log.clock_in_at);
  v_capped_out := LEAST(v_capped_out, v_log.clock_in_at + INTERVAL '8 hours');

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


-- ── fn_auto_close_stale_session ───────────────────────────────────────────────
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
  -- #169: IS DISTINCT FROM 으로 NULL-safe 인가 체크
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
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

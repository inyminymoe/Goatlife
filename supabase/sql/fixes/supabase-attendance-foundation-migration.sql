-- ============================================================================
-- attendance foundation migration
-- 131번 foundation 이슈 기준으로 상태 체계와 note 컬럼, summary view, RPC를 갱신한다.
-- ============================================================================

ALTER TABLE public.attendance_logs
  ADD COLUMN IF NOT EXISTS note TEXT;

UPDATE public.attendance_logs
SET status = CASE
  WHEN status = 'early' THEN 'early_leave'
  WHEN status = 'in' THEN
    CASE
      WHEN clock_in_at IS NOT NULL
        AND (clock_in_at AT TIME ZONE 'Asia/Seoul')::time > TIME '09:00'
        THEN 'late'
      ELSE 'present'
    END
  WHEN status = 'out' THEN
    CASE
      WHEN early_leave_at IS NOT NULL THEN 'early_leave'
      WHEN clock_in_at IS NOT NULL
        AND (clock_in_at AT TIME ZONE 'Asia/Seoul')::time > TIME '09:00'
        THEN 'late'
      ELSE 'present'
    END
  WHEN status = 'none' OR status IS NULL THEN 'absent'
  ELSE status
END
WHERE status IS NULL OR status IN ('none', 'in', 'early', 'out');

ALTER TABLE public.attendance_logs
  ALTER COLUMN status SET DEFAULT 'absent';

ALTER TABLE public.attendance_logs
  DROP CONSTRAINT IF EXISTS attendance_logs_status_check;

ALTER TABLE public.attendance_logs
  ADD CONSTRAINT attendance_logs_status_check
  CHECK (status IN ('present', 'late', 'early_leave', 'absent', 'vacation'));

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
  WHERE user_id = p_user_id AND work_date = p_work_date;

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
    work_minutes = v_work_minutes,
    status = 'early_leave',
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

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
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: You can only clock out for yourself';
  END IF;

  SELECT * INTO v_existing_log
  FROM public.attendance_logs
  WHERE user_id = p_user_id AND work_date = p_work_date;

  IF v_existing_log.id IS NULL OR v_existing_log.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'No clock-in record found for today';
  END IF;

  IF v_existing_log.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'Already clocked out';
  END IF;

  IF v_existing_log.status = 'early_leave' AND v_existing_log.early_leave_at IS NOT NULL THEN
    v_work_minutes := EXTRACT(
      EPOCH FROM (v_existing_log.early_leave_at - v_existing_log.clock_in_at)
    ) / 60;
    v_next_status := 'early_leave';
  ELSE
    v_work_minutes := EXTRACT(EPOCH FROM (NOW() - v_existing_log.clock_in_at)) / 60;
    v_next_status := CASE
      WHEN v_existing_log.status = 'late' THEN 'late'
      ELSE 'present'
    END;
  END IF;

  UPDATE public.attendance_logs
  SET
    clock_out_at = NOW(),
    work_minutes = v_work_minutes,
    status = v_next_status,
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_clock_in TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_early_leave TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_clock_out TO authenticated;

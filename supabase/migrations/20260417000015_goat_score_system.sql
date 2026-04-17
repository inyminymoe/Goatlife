-- Migration #204: Gamification score system
--
-- New tables:
--   goat_score_events  — append-only log of every score-earning action
--   character_stats    — per-user aggregate (intelligence / fitness / happiness / achievement)
--
-- Trigger:
--   trg_update_character_stats — AFTER INSERT on goat_score_events
--   → delta-applies the new event to character_stats, recomputes goat_score
--
-- handle_new_user update:
--   character_stats row is created automatically on signup (same pattern as profiles)
--
-- Helper:
--   fn_check_daily_cap — returns TRUE if user is still under today's cap for event_type


-- ── goat_score_events ─────────────────────────────────────────────────────────
CREATE TABLE public.goat_score_events (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL
                     CHECK (event_type IN (
                       'todo_submit',   -- 업무계획서 제출 (task 단위)
                       'board_post',    -- 게시글 작성
                       'attendance',    -- 출근 기록
                       'milestone',     -- 마일스톤 달성
                       'leisure'        -- 취미/휴식 활동
                     )),
  ref_id           TEXT,                -- 연결된 엔티티 ID (task_id, post_id 등 — 없는 이벤트는 NULL 허용)
  idempotency_key  TEXT        NOT NULL UNIQUE,  -- '{event_type}_{ref_id}' — 중복 방지; 앱에서 항상 생성 필수
  stat_type        TEXT        NOT NULL
                     CHECK (stat_type IN ('intelligence', 'fitness', 'happiness', 'achievement')),
  delta            INTEGER     NOT NULL CHECK (delta > 0),
  difficulty       TEXT        CHECK (difficulty IN ('light', 'medium', 'hard')),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fn_check_daily_cap 에서 (user_id, event_type, created_at) 필터를 사용하므로 복합 인덱스 필수
CREATE INDEX idx_goat_score_events_user_type_created
  ON public.goat_score_events (user_id, event_type, created_at DESC);

ALTER TABLE public.goat_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score events"
  ON public.goat_score_events FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT is allowed from client; idempotency_key UNIQUE constraint prevents duplicates.
-- The AFTER INSERT trigger updates character_stats atomically.
CREATE POLICY "Users can insert own score events"
  ON public.goat_score_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ── character_stats ───────────────────────────────────────────────────────────
CREATE TABLE public.character_stats (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intelligence INTEGER     NOT NULL DEFAULT 0 CHECK (intelligence >= 0),
  fitness      INTEGER     NOT NULL DEFAULT 0 CHECK (fitness >= 0),
  happiness    INTEGER     NOT NULL DEFAULT 0 CHECK (happiness >= 0),
  achievement  INTEGER     NOT NULL DEFAULT 0 CHECK (achievement >= 0),
  goat_score   INTEGER     NOT NULL DEFAULT 0 CHECK (goat_score >= 0),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own character stats"
  ON public.character_stats FOR SELECT
  USING (auth.uid() = user_id);

-- No direct INSERT/UPDATE from client — rows are created by handle_new_user,
-- and updated exclusively by trg_update_character_stats (SECURITY DEFINER).


-- ── fn_update_character_stats (trigger function) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_update_character_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure row exists (handles edge case where trigger fires before handle_new_user)
  INSERT INTO public.character_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- delta > 0 (CHECK 제약), 스탯은 모두 >= 0 (CHECK 제약)이므로 결과는 항상 비음수.
  -- goat_score = 4개 스탯 합산이고 stat_type 하나만 delta만큼 증가하므로
  -- 전체 합에 NEW.delta를 한 번 더하는 것과 동일. 단일 UPDATE로 처리.
  UPDATE public.character_stats AS cs
  SET
    intelligence = cs.intelligence + CASE WHEN NEW.stat_type = 'intelligence' THEN NEW.delta ELSE 0 END,
    fitness      = cs.fitness      + CASE WHEN NEW.stat_type = 'fitness'      THEN NEW.delta ELSE 0 END,
    happiness    = cs.happiness    + CASE WHEN NEW.stat_type = 'happiness'    THEN NEW.delta ELSE 0 END,
    achievement  = cs.achievement  + CASE WHEN NEW.stat_type = 'achievement'  THEN NEW.delta ELSE 0 END,
    goat_score   = cs.goat_score   + NEW.delta,
    updated_at   = NOW()
  WHERE cs.user_id = NEW.user_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_character_stats
  AFTER INSERT ON public.goat_score_events
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_character_stats();


-- ── fn_check_daily_cap ────────────────────────────────────────────────────────
-- Returns TRUE if the calling user is still under today's cap for event_type.
-- Call this from the application layer before inserting a score event.
-- SECURITY DEFINER 이지만 auth.uid() 검증으로 타인의 활동 빈도 노출을 차단.
CREATE OR REPLACE FUNCTION public.fn_check_daily_cap(
  p_event_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_daily_cap   INTEGER;
  v_today_start TIMESTAMPTZ;
  v_count       INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- KST 기준 오늘 시작 시각
  v_today_start := date_trunc('day', NOW() AT TIME ZONE 'Asia/Seoul')
                     AT TIME ZONE 'Asia/Seoul';

  -- 이벤트 유형별 일일 상한
  v_daily_cap := CASE p_event_type
    WHEN 'todo_submit'  THEN 10
    WHEN 'board_post'   THEN 5
    WHEN 'attendance'   THEN 1
    WHEN 'milestone'    THEN 3
    WHEN 'leisure'      THEN 3
    ELSE 5
  END;

  SELECT COUNT(*) INTO v_count
  FROM public.goat_score_events
  WHERE user_id    = v_user_id
    AND event_type = p_event_type
    AND created_at >= v_today_start
    AND created_at <  v_today_start + INTERVAL '1 day';

  RETURN v_count < v_daily_cap;
END;
$$;


-- ── handle_new_user: character_stats 자동 생성 추가 ──────────────────────────
-- Migration 010의 전체 함수를 재정의해 character_stats INSERT를 추가한다.
-- (profiles INSERT 직후, RETURN new 직전)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  md           jsonb := new.raw_user_meta_data;
  v_user_id    text;
  v_last_name  text;
  v_first_name text;
  v_department text;
  v_rank       text;
  v_wh         text;
  v_wt         text;
  v_style      text;
  v_ethic      text;
  v_avatar     text;

  valid_ranks  text[] := ARRAY[
    '인턴','사원','주임','대리','과장','차장','부장',
    '이사','상무','전무','부사장','사장','부회장','회장'
  ];
  valid_wh     text[] := ARRAY['주간(09:00-18:00)','오후(17:00-01:00)','야간(22:00-06:00)'];
  valid_wt     text[] := ARRAY['풀타임','파트타임'];
BEGIN
  v_user_id := coalesce(
    nullif(md->>'user_id', ''),
    nullif(md->>'userId', ''),
    nullif(split_part(new.email, '@', 1), ''),
    concat('guest_', left(new.id::text, 8))
  );

  v_last_name := coalesce(
    nullif(md->>'last_name', ''),
    nullif(md->>'lastName', ''),
    nullif(md->>'profile_nickname', ''),
    nullif(md->>'nickname', ''),
    v_user_id,
    '게스트'
  );
  v_first_name := nullif(coalesce(nullif(md->>'first_name', ''), md->>'firstName'), '');
  v_department := coalesce(nullif(md->>'department', ''), 'IT부');

  v_rank := CASE
    WHEN (md->>'rank') = ANY(valid_ranks) THEN md->>'rank'
    ELSE '인턴'
  END;

  v_wh := CASE
    WHEN coalesce(nullif(md->>'work_hours', ''), nullif(md->>'workHours', '')) = ANY(valid_wh)
      THEN coalesce(nullif(md->>'work_hours', ''), nullif(md->>'workHours', ''))
    ELSE '주간(09:00-18:00)'
  END;

  v_wt := CASE
    WHEN coalesce(nullif(md->>'work_type', ''), nullif(md->>'workType', '')) = ANY(valid_wt)
      THEN coalesce(nullif(md->>'work_type', ''), nullif(md->>'workType', ''))
    ELSE '풀타임'
  END;

  v_style  := nullif(coalesce(nullif(md->>'work_style', ''), md->>'workStyle'), '');
  v_ethic  := nullif(coalesce(nullif(md->>'work_ethic', ''), md->>'workEthic'), '');
  v_avatar := nullif(coalesce(nullif(md->>'avatar_url', ''), md->>'avatarUrl'), '');

  INSERT INTO public.profiles (
    id, user_id, email, last_name, first_name,
    rank, department, work_hours, work_type,
    work_style, work_ethic, avatar_url, joined_at, created_at, updated_at
  )
  VALUES (
    new.id,
    v_user_id,
    new.email::citext,
    v_last_name,
    v_first_name,
    v_rank,
    v_department,
    v_wh,
    v_wt,
    v_style,
    v_ethic,
    v_avatar,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 신규 가입 시 캐릭터 스탯 행 자동 생성
  INSERT INTO public.character_stats (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed for user % (SQLSTATE=%): %',
                  new.id, SQLSTATE, SQLERRM;
    RETURN new;
END;
$$;

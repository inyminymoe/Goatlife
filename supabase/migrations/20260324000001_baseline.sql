--
-- PostgreSQL database dump
--

\restrict thfDED5CahEDWfHy4TgPUkdkKYmQJXDrsm0bZNaFOwrHnBt3dKQKXp78E0KWUaw

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: admin_role_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_role_enum AS ENUM (
    'CEO',
    'CTO',
    'COO'
);


--
-- Name: rank_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.rank_enum AS ENUM (
    '인턴',
    '사원',
    '주임',
    '대리',
    '과장',
    '차장',
    '부장',
    '이사',
    '상무',
    '전무',
    '부사장',
    '사장',
    '부회장',
    '회장'
);


--
-- Name: work_hours_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.work_hours_enum AS ENUM (
    '주간(09:00-18:00)',
    '오후(17:00-01:00)',
    '야간(22:00-06:00)'
);


--
-- Name: work_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.work_type_enum AS ENUM (
    '풀타임',
    '파트타임'
);


--
-- Name: decrement_comment_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_comment_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  update board_posts set comment_count = greatest(comment_count - 1, 0) where id = OLD.post_id;
  return OLD;
end;
$$;


--
-- Name: decrement_like_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrement_like_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  update board_posts set like_count = greatest(like_count - 1, 0) where id = OLD.post_id;
  return OLD;
end;
$$;


--
-- Name: exec_quotes_set_created_by(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.exec_quotes_set_created_by() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;


--
-- Name: fn_clock_in(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clock_in(p_user_id uuid, p_work_date date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: fn_clock_out(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clock_out(p_user_id uuid, p_work_date date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
  WHERE user_id = p_user_id AND work_date = p_work_date;

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


--
-- Name: fn_early_leave(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_early_leave(p_user_id uuid, p_work_date date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
    clock_out_at = NOW(),
    work_minutes = v_work_minutes,
    status = 'early_leave',
    updated_at = NOW()
  WHERE id = v_existing_log.id
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;


--
-- Name: fn_touch_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: fn_undo_clock_out(uuid, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_undo_clock_out(p_user_id uuid, p_work_date date) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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
  WHERE user_id = p_user_id AND work_date = p_work_date;

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


--
-- Name: get_today_ranks(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_today_ranks(period_days integer DEFAULT 7, limit_count integer DEFAULT 3) RETURNS TABLE(user_id uuid, display_name text, rank text, department_name text, performance_rate numeric, attendance_rate numeric)
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
with params as (
  select
    greatest(1, least(coalesce(period_days, 7), 30))::int as period_days,
    greatest(1, coalesce(limit_count, 3))::int as limit_count
),
range as (
  select
    timezone('Asia/Seoul', now())::date as today,
    (timezone('Asia/Seoul', now())::date - (select period_days - 1 from params)) as start_date,
    (select period_days from params) as period_days
),
attendance as (
  select
    al.user_id,
    count(*) filter (where al.status is not null and al.status != 'none')::numeric as attended_days
  from public.attendance_logs al
  cross join range r
  where al.work_date between r.start_date and r.today
  group by al.user_id
),
performance as (
  select
    t.user_id,
    count(*)::numeric as total_tasks,
    count(*) filter (where t.status = 'done')::numeric as done_tasks
  from public.tasks t
  cross join range r
  where (t.created_at at time zone 'Asia/Seoul')::date between r.start_date and r.today
  group by t.user_id
),
profile_base as (
  select
    p.id,
    trim(concat_ws(' ', nullif(p.last_name, ''), nullif(p.first_name, ''))) as raw_name,
    coalesce(p.rank::text, '사원') as rank,
    p.department,
    p.executive_title,
    0::numeric as fallback_performance
  from public.profiles p
) ,
rank_base as (
  select
  pb.id as user_id,
  coalesce(nullif(pb.raw_name, ''), '익명 사원') as display_name,
  pb.rank,
  coalesce(nullif(pb.department, ''), '부서 미정') as department_name,
  case
    when perf.total_tasks > 0
      then round((perf.done_tasks / nullif(perf.total_tasks, 0)) * 100, 2)
    else pb.fallback_performance
  end as performance_rate,
  round(
    (coalesce(att.attended_days, 0) / (select period_days from range)) * 100,
    2
  ) as attendance_rate,
  pb.executive_title
from profile_base pb
cross join range r
left join performance perf on perf.user_id = pb.id
left join attendance att on att.user_id = pb.id
)
select
  user_id,
  display_name,
  rank,
  department_name,
  performance_rate,
  attendance_rate
from rank_base
where executive_title IS NULL  -- 임원진 제외 (일반 회원만 선정)
order by
  (performance_rate + attendance_rate) desc,
  attendance_rate desc,
  performance_rate desc,
  display_name asc
limit (select limit_count from params);
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
declare
  md jsonb := new.raw_user_meta_data;
  v_user_id    text;
  v_last_name  text;
  v_first_name text;
  v_department text;
  v_rank       rank_enum;
  v_wh         work_hours_enum;
  v_wt         work_type_enum;
  v_style      text;
  v_ethic      text;
  v_avatar     text;
begin
  -- camel & snake 모두 수용
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
  v_first_name := nullif(coalesce(md->>'first_name', md->>'firstName'), '');
  v_department := coalesce(md->>'department', 'IT부');

  -- enum은 안전 캐스팅 (없으면 기본값)
  begin
    v_rank := coalesce((md->>'rank')::rank_enum, '인턴'::rank_enum);
  exception when others then
    v_rank := '인턴'::rank_enum;
  end;

  begin
    v_wh := coalesce((md->>'work_hours')::work_hours_enum, '주간(09:00-18:00)'::work_hours_enum);
  exception when others then
    v_wh := '주간(09:00-18:00)'::work_hours_enum;
  end;

  begin
    v_wt := coalesce((md->>'work_type')::work_type_enum, '풀타임'::work_type_enum);
  exception when others then
    v_wt := '풀타임'::work_type_enum;
  end;

  v_style  := nullif(coalesce(md->>'work_style', md->>'workStyle'), '');
  v_ethic  := nullif(coalesce(md->>'work_ethic', md->>'workEthic'), '');
  v_avatar := nullif(coalesce(md->>'avatar_url', md->>'avatarUrl'), '');

  insert into public.profiles (
    id, user_id, email, last_name, first_name,
    rank, department, work_hours, work_type,
    work_style, work_ethic, avatar_url, joined_at, created_at, updated_at
  )
  values (
    new.id,
    v_user_id,
    new.email::citext,
    v_last_name,
    v_first_name,
    coalesce(v_rank, '인턴'::rank_enum),
    v_department,
    v_wh,
    v_wt,
    v_style,
    v_ethic,
    v_avatar,
    now(),  -- ✅ joined_at 추가
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user failed: %', sqlerrm;
    return new;
end;
$$;


--
-- Name: increment_comment_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_comment_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  update board_posts set comment_count = comment_count + 1 where id = NEW.post_id;
  return NEW;
end;
$$;


--
-- Name: increment_like_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_like_count() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  update board_posts set like_count = like_count + 1 where id = NEW.post_id;
  return NEW;
end;
$$;


--
-- Name: profiles_set_system_fields(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.profiles_set_system_fields() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- updated_at 자동 갱신
  new.updated_at := now();

  -- 닉네임 = "성 + 직급" (NULL 안전)
  new.nickname := coalesce(new.last_name, '') || ' ' || coalesce(new.rank::text, '');

  return new;
end;
$$;


--
-- Name: set_exec_message_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_exec_message_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


--
-- Name: set_exec_quote_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_exec_quote_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end $$;


--
-- Name: set_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  -- like_count 또는 comment_count만 변경된 경우 updated_at 갱신 안 함
  if (NEW.like_count IS DISTINCT FROM OLD.like_count
      or NEW.comment_count IS DISTINCT FROM OLD.comment_count)
     and NEW.title = OLD.title
     and NEW.content = OLD.content
     and NEW.topic = OLD.topic then
    return NEW;
  end if;

  NEW.updated_at = now();
  return NEW;
end;
$$;


--
-- Name: update_attendance_logs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_attendance_logs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    timer_mode text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    duration_seconds integer NOT NULL,
    total_focus_seconds integer DEFAULT 0 NOT NULL,
    session_mode text NOT NULL,
    routine_id text,
    routine_title text,
    routine_index integer,
    routine_total_count integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    remaining_seconds integer,
    is_running boolean DEFAULT true NOT NULL,
    routine_queue jsonb,
    CONSTRAINT active_sessions_session_mode_check CHECK ((session_mode = ANY (ARRAY['idle'::text, 'manual'::text, 'routine'::text]))),
    CONSTRAINT active_sessions_timer_mode_check CHECK ((timer_mode = ANY (ARRAY['focus'::text, 'break'::text])))
);


--
-- Name: attendance_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    work_date date NOT NULL,
    clock_in_at timestamp with time zone,
    early_leave_at timestamp with time zone,
    clock_out_at timestamp with time zone,
    work_minutes integer DEFAULT 0,
    status text DEFAULT 'absent'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    note text,
    CONSTRAINT attendance_logs_status_check CHECK ((status = ANY (ARRAY['present'::text, 'late'::text, 'early_leave'::text, 'absent'::text, 'vacation'::text])))
);


--
-- Name: board_post_bookmarks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_post_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: board_post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    author_name text,
    content text NOT NULL,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    image_urls text[] DEFAULT '{}'::text[],
    parent_id uuid,
    reply_to_name text
);


--
-- Name: board_post_comments_with_reply_count; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.board_post_comments_with_reply_count AS
SELECT
    NULL::uuid AS id,
    NULL::uuid AS post_id,
    NULL::uuid AS user_id,
    NULL::text AS author_name,
    NULL::text AS content,
    NULL::boolean AS is_pinned,
    NULL::timestamp with time zone AS created_at,
    NULL::timestamp with time zone AS updated_at,
    NULL::text[] AS image_urls,
    NULL::uuid AS parent_id,
    NULL::text AS reply_to_name,
    NULL::integer AS reply_count;


--
-- Name: board_post_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_post_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: board_post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: board_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scope text NOT NULL,
    board text,
    dept text,
    topic text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    hashtags text[] DEFAULT '{}'::text[] NOT NULL,
    author_id uuid NOT NULL,
    author_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    CONSTRAINT board_posts_scope_check CHECK ((scope = ANY (ARRAY['company'::text, 'department'::text])))
);


--
-- Name: exec_admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exec_admins (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role public.admin_role_enum NOT NULL,
    display_name text,
    avatar_url text
);


--
-- Name: TABLE exec_admins; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.exec_admins IS '임원진 관리자 목록';


--
-- Name: COLUMN exec_admins.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exec_admins.user_id IS '임원진 사용자 ID';


--
-- Name: exec_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exec_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_user_id uuid,
    author_name text,
    author_title text,
    avatar_url text,
    message text NOT NULL,
    lang text,
    is_active boolean DEFAULT true NOT NULL,
    start_at timestamp with time zone,
    end_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: exec_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exec_quotes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_code text NOT NULL,
    author_name text NOT NULL,
    author_title text NOT NULL,
    message text NOT NULL,
    lang text DEFAULT 'ko'::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    avatar_url text,
    is_explicit boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN exec_quotes.avatar_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exec_quotes.avatar_url IS '임원 아바타 URL (옵션)';


--
-- Name: COLUMN exec_quotes.is_explicit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.exec_quotes.is_explicit IS '명시적 메시지 여부';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id character varying(16) NOT NULL,
    email public.citext NOT NULL,
    last_name character varying(5) NOT NULL,
    first_name character varying(5),
    rank public.rank_enum DEFAULT '인턴'::public.rank_enum NOT NULL,
    department character varying(50) NOT NULL,
    work_hours public.work_hours_enum DEFAULT '주간(09:00-18:00)'::public.work_hours_enum NOT NULL,
    work_type public.work_type_enum DEFAULT '풀타임'::public.work_type_enum NOT NULL,
    work_style character varying(100),
    work_ethic character varying(100),
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    nickname text,
    joined_at timestamp with time zone,
    executive_title text,
    CONSTRAINT first_name_len_chk CHECK (((first_name IS NULL) OR (char_length((first_name)::text) <= 5))),
    CONSTRAINT last_name_len_chk CHECK ((char_length((last_name)::text) <= 5)),
    CONSTRAINT profiles_user_id_check CHECK (((char_length((user_id)::text) >= 1) AND (char_length((user_id)::text) <= 20))),
    CONSTRAINT work_ethic_len_chk CHECK (((work_ethic IS NULL) OR (char_length((work_ethic)::text) <= 100)))
);


--
-- Name: COLUMN profiles.executive_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.profiles.executive_title IS '임원진 전용 직함 (CEO, COO, CTO 등). NULL이면 일반 회원.';


--
-- Name: routine_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.routine_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    period text NOT NULL,
    category text NOT NULL,
    url text,
    pomodoro_count integer DEFAULT 1 NOT NULL,
    order_index integer DEFAULT 1000 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT routine_items_category_check CHECK ((category = ANY (ARRAY['work'::text, 'break'::text, 'leisure'::text]))),
    CONSTRAINT routine_items_period_check CHECK ((period = ANY (ARRAY['AM'::text, 'PM'::text])))
);


--
-- Name: session_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    status text NOT NULL,
    duration_seconds integer NOT NULL,
    started_at timestamp with time zone NOT NULL,
    routine_id text,
    routine_title text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT session_history_status_check CHECK ((status = ANY (ARRAY['focus-done'::text, 'focus-incomplete'::text, 'break'::text])))
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'todo'::text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    estimated_time text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'done'::text])))
);


--
-- Name: v_attendance_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_attendance_summary WITH (security_invoker='on') AS
 SELECT user_id,
    count(*) AS total_days,
    count(
        CASE
            WHEN (status = ANY (ARRAY['present'::text, 'late'::text, 'early_leave'::text])) THEN 1
            ELSE NULL::integer
        END) AS attended_days,
    count(
        CASE
            WHEN (status = 'late'::text) THEN 1
            ELSE NULL::integer
        END) AS late_days,
    count(
        CASE
            WHEN (status = 'early_leave'::text) THEN 1
            ELSE NULL::integer
        END) AS early_leave_days,
    count(
        CASE
            WHEN (status = 'vacation'::text) THEN 1
            ELSE NULL::integer
        END) AS vacation_days,
    count(
        CASE
            WHEN (status = 'absent'::text) THEN 1
            ELSE NULL::integer
        END) AS absent_days,
        CASE
            WHEN (count(*) > 0) THEN round((((count(
            CASE
                WHEN (status = ANY (ARRAY['present'::text, 'late'::text, 'early_leave'::text])) THEN 1
                ELSE NULL::integer
            END))::numeric / (count(*))::numeric) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS attendance_rate
   FROM public.attendance_logs
  GROUP BY user_id;


--
-- Name: v_exec_message_current; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_exec_message_current AS
 SELECT em.id,
    COALESCE(em.author_name, (p.last_name)::text) AS author_name,
    COALESCE(em.author_title, (p.rank)::text) AS author_title,
    COALESCE(em.avatar_url, p.avatar_url) AS avatar_url,
    em.message,
    em.lang,
    em.created_at
   FROM (public.exec_messages em
     LEFT JOIN public.profiles p ON ((p.id = em.author_user_id)))
  WHERE ((em.is_active = true) AND ((em.start_at IS NULL) OR (now() >= em.start_at)) AND ((em.end_at IS NULL) OR (now() < em.end_at)))
  ORDER BY COALESCE(em.start_at, em.created_at) DESC, em.created_at DESC
 LIMIT 1;


--
-- Name: v_exec_quote_of_today; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_exec_quote_of_today AS
 SELECT id,
    author_code,
    author_name,
    author_title,
    message,
    lang,
    is_active,
    created_at,
    updated_at,
    created_by,
    avatar_url,
    is_explicit
   FROM public.exec_quotes q
  WHERE (is_active = true)
  ORDER BY (md5(((id)::text || to_char(((now())::date)::timestamp with time zone, 'YYYYMMDD'::text))))
 LIMIT 1;


--
-- Name: v_exec_message_current_or_quote; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_exec_message_current_or_quote AS
 WITH current_msg AS (
         SELECT em.id,
            COALESCE(em.author_name, '임원'::text) AS author_name,
            COALESCE(em.author_title, '임원진'::text) AS author_title,
            em.avatar_url,
            em.message,
            em.lang,
            em.created_at,
            true AS is_explicit_message
           FROM public.v_exec_message_current em
        ), today_quote AS (
         SELECT q.id,
            q.author_name,
            q.author_title,
            q.avatar_url,
            q.message,
            q.lang,
            q.created_at,
            false AS is_explicit_message
           FROM public.v_exec_quote_of_today q
        )
 SELECT current_msg.id,
    current_msg.author_name,
    current_msg.author_title,
    current_msg.avatar_url,
    current_msg.message,
    current_msg.lang,
    current_msg.created_at,
    current_msg.is_explicit_message
   FROM current_msg
UNION ALL
 SELECT today_quote.id,
    today_quote.author_name,
    today_quote.author_title,
    today_quote.avatar_url,
    today_quote.message,
    today_quote.lang,
    today_quote.created_at,
    today_quote.is_explicit_message
   FROM today_quote
  ORDER BY 8 DESC, 7 DESC
 LIMIT 1;


--
-- Name: VIEW v_exec_message_current_or_quote; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_exec_message_current_or_quote IS '임원 공지 우선, 없으면 오늘의 명언을 반환 (avatar_url 포함)';


--
-- Name: v_exec_message_daily; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_exec_message_daily AS
 SELECT id,
    author_code,
    author_name,
    author_title,
    message,
    lang,
    is_active,
    created_at,
    updated_at
   FROM public.exec_quotes q
  WHERE (is_active IS TRUE)
  ORDER BY (md5((to_char((CURRENT_DATE)::timestamp with time zone, 'YYYYMMDD'::text) || (id)::text)))
 LIMIT 1;


--
-- Name: v_exec_quotes_enriched; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_exec_quotes_enriched AS
 SELECT id,
    author_name,
    author_title,
    message,
    lang,
    is_active,
    created_by,
    created_at,
    updated_at
   FROM public.exec_quotes q
  WHERE (is_active IS TRUE);


--
-- Name: v_tasks_todo_top4; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_tasks_todo_top4 WITH (security_invoker='true') AS
 SELECT id,
    title,
    description,
    status,
    order_index,
    estimated_time,
    created_at
   FROM public.tasks
  WHERE ((user_id = auth.uid()) AND (status = 'todo'::text))
  ORDER BY order_index, created_at
 LIMIT 4;


--
-- Name: v_user_summary_self; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_user_summary_self WITH (security_invoker='on') AS
 SELECT id AS auth_user_id,
    user_id AS handle,
    COALESCE(NULLIF((last_name)::text, ''::text), NULLIF((first_name)::text, ''::text), '사용자'::text) AS display_name,
    rank,
    department,
    work_hours,
    work_type,
    avatar_url,
    created_at,
    (GREATEST((1)::numeric, (floor((EXTRACT(epoch FROM (timezone('Asia/Seoul'::text, now()) - timezone('Asia/Seoul'::text, COALESCE(joined_at, created_at, now())))) / (86400)::numeric)) + (1)::numeric)))::integer AS joined_days,
    0 AS performance_rate
   FROM public.profiles p
  WHERE (id = auth.uid());


--
-- Name: VIEW v_user_summary_self; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_user_summary_self IS '사원정보 카드용 뷰. joined_at (또는 created_at) 기준 joined_days 계산, 내 정보만 반환.';


--
-- Name: active_sessions active_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);


--
-- Name: active_sessions active_sessions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_user_id_key UNIQUE (user_id);


--
-- Name: attendance_logs attendance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_pkey PRIMARY KEY (id);


--
-- Name: attendance_logs attendance_logs_user_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_user_id_work_date_key UNIQUE (user_id, work_date);


--
-- Name: board_post_bookmarks board_post_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_bookmarks
    ADD CONSTRAINT board_post_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: board_post_bookmarks board_post_bookmarks_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_bookmarks
    ADD CONSTRAINT board_post_bookmarks_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: board_post_comments board_post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_comments
    ADD CONSTRAINT board_post_comments_pkey PRIMARY KEY (id);


--
-- Name: board_post_images board_post_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_images
    ADD CONSTRAINT board_post_images_pkey PRIMARY KEY (id);


--
-- Name: board_post_likes board_post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_likes
    ADD CONSTRAINT board_post_likes_pkey PRIMARY KEY (id);


--
-- Name: board_post_likes board_post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_likes
    ADD CONSTRAINT board_post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: board_posts board_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_posts
    ADD CONSTRAINT board_posts_pkey PRIMARY KEY (id);


--
-- Name: exec_admins exec_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_admins
    ADD CONSTRAINT exec_admins_pkey PRIMARY KEY (user_id);


--
-- Name: exec_messages exec_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_messages
    ADD CONSTRAINT exec_messages_pkey PRIMARY KEY (id);


--
-- Name: exec_quotes exec_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_quotes
    ADD CONSTRAINT exec_quotes_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: routine_items routine_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routine_items
    ADD CONSTRAINT routine_items_pkey PRIMARY KEY (id);


--
-- Name: session_history session_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_history
    ADD CONSTRAINT session_history_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: board_posts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX board_posts_created_at_idx ON public.board_posts USING btree (created_at DESC);


--
-- Name: board_posts_scope_board_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX board_posts_scope_board_idx ON public.board_posts USING btree (scope, board);


--
-- Name: board_posts_scope_dept_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX board_posts_scope_dept_idx ON public.board_posts USING btree (scope, dept);


--
-- Name: exec_quotes_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX exec_quotes_created_by_idx ON public.exec_quotes USING btree (created_by);


--
-- Name: idx_attendance_logs_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_logs_user_date ON public.attendance_logs USING btree (user_id, work_date);


--
-- Name: idx_attendance_logs_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_logs_user_id ON public.attendance_logs USING btree (user_id);


--
-- Name: idx_attendance_logs_work_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attendance_logs_work_date ON public.attendance_logs USING btree (work_date);


--
-- Name: idx_profiles_department; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_department ON public.profiles USING btree (department);


--
-- Name: idx_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user_id ON public.profiles USING btree (user_id);


--
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- Name: idx_tasks_user_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_order ON public.tasks USING btree (user_id, order_index);


--
-- Name: idx_tasks_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_user_status ON public.tasks USING btree (user_id, status);


--
-- Name: board_post_comments_with_reply_count _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.board_post_comments_with_reply_count AS
 SELECT c.id,
    c.post_id,
    c.user_id,
    c.author_name,
    c.content,
    c.is_pinned,
    c.created_at,
    c.updated_at,
    c.image_urls,
    c.parent_id,
    c.reply_to_name,
    (count(r.id))::integer AS reply_count
   FROM (public.board_post_comments c
     LEFT JOIN public.board_post_comments r ON ((r.parent_id = c.id)))
  GROUP BY c.id;


--
-- Name: board_post_comments on_comment_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_comment_delete AFTER DELETE ON public.board_post_comments FOR EACH ROW EXECUTE FUNCTION public.decrement_comment_count();


--
-- Name: board_post_comments on_comment_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_comment_insert AFTER INSERT ON public.board_post_comments FOR EACH ROW EXECUTE FUNCTION public.increment_comment_count();


--
-- Name: board_post_likes on_like_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_like_delete AFTER DELETE ON public.board_post_likes FOR EACH ROW EXECUTE FUNCTION public.decrement_like_count();


--
-- Name: board_post_likes on_like_insert; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_like_insert AFTER INSERT ON public.board_post_likes FOR EACH ROW EXECUTE FUNCTION public.increment_like_count();


--
-- Name: board_posts set_timestamp_board_posts; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_timestamp_board_posts BEFORE UPDATE ON public.board_posts FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();


--
-- Name: exec_messages trg_exec_messages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_exec_messages_updated_at BEFORE UPDATE ON public.exec_messages FOR EACH ROW EXECUTE FUNCTION public.set_exec_message_updated_at();


--
-- Name: exec_quotes trg_exec_quotes_set_created_by; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_exec_quotes_set_created_by BEFORE INSERT ON public.exec_quotes FOR EACH ROW EXECUTE FUNCTION public.exec_quotes_set_created_by();


--
-- Name: exec_quotes trg_exec_quotes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_exec_quotes_updated_at BEFORE UPDATE ON public.exec_quotes FOR EACH ROW EXECUTE FUNCTION public.set_exec_quote_updated_at();


--
-- Name: profiles trg_profiles_system_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_profiles_system_fields BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.profiles_set_system_fields();


--
-- Name: tasks trg_tasks_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();


--
-- Name: attendance_logs trigger_update_attendance_logs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_attendance_logs_updated_at BEFORE UPDATE ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION public.update_attendance_logs_updated_at();


--
-- Name: active_sessions active_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: attendance_logs attendance_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_logs
    ADD CONSTRAINT attendance_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_post_bookmarks board_post_bookmarks_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_bookmarks
    ADD CONSTRAINT board_post_bookmarks_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.board_posts(id) ON DELETE CASCADE;


--
-- Name: board_post_bookmarks board_post_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_bookmarks
    ADD CONSTRAINT board_post_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_post_comments board_post_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_comments
    ADD CONSTRAINT board_post_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.board_post_comments(id) ON DELETE CASCADE;


--
-- Name: board_post_comments board_post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_comments
    ADD CONSTRAINT board_post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.board_posts(id) ON DELETE CASCADE;


--
-- Name: board_post_comments board_post_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_comments
    ADD CONSTRAINT board_post_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_post_images board_post_images_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_images
    ADD CONSTRAINT board_post_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.board_posts(id) ON DELETE CASCADE;


--
-- Name: board_post_likes board_post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_likes
    ADD CONSTRAINT board_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.board_posts(id) ON DELETE CASCADE;


--
-- Name: board_post_likes board_post_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_post_likes
    ADD CONSTRAINT board_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_posts board_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_posts
    ADD CONSTRAINT board_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exec_admins exec_admins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_admins
    ADD CONSTRAINT exec_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: exec_messages exec_messages_author_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_messages
    ADD CONSTRAINT exec_messages_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES auth.users(id);


--
-- Name: exec_quotes exec_quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exec_quotes
    ADD CONSTRAINT exec_quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: routine_items routine_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.routine_items
    ADD CONSTRAINT routine_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: session_history session_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_history
    ADD CONSTRAINT session_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: board_posts Allow delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete own posts" ON public.board_posts FOR DELETE TO authenticated USING ((auth.uid() = author_id));


--
-- Name: board_posts Allow inserts for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow inserts for authenticated users" ON public.board_posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));


--
-- Name: board_posts Allow read to all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow read to all users" ON public.board_posts FOR SELECT USING (true);


--
-- Name: board_posts Allow update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update own posts" ON public.board_posts FOR UPDATE TO authenticated USING ((auth.uid() = author_id));


--
-- Name: attendance_logs Users can insert own attendance logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own attendance logs" ON public.attendance_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: attendance_logs Users can update own attendance logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own attendance logs" ON public.attendance_logs FOR UPDATE USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: attendance_logs Users can view own attendance logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own attendance logs" ON public.attendance_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: active_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: active_sessions active_sessions: 본인 데이터만; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "active_sessions: 본인 데이터만" ON public.active_sessions USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: attendance_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: board_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.board_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: board_posts board_posts_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY board_posts_insert_own ON public.board_posts FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));


--
-- Name: board_posts board_posts_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY board_posts_select_all ON public.board_posts FOR SELECT TO authenticated USING (true);


--
-- Name: exec_admins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exec_admins ENABLE ROW LEVEL SECURITY;

--
-- Name: exec_admins exec_admins_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_admins_read ON public.exec_admins FOR SELECT TO authenticated USING (true);


--
-- Name: exec_admins exec_admins_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_admins_select_auth ON public.exec_admins FOR SELECT TO authenticated USING (true);


--
-- Name: exec_admins exec_admins_select_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_admins_select_self ON public.exec_admins FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: exec_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exec_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: exec_messages exec_messages_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_messages_read ON public.exec_messages FOR SELECT TO authenticated USING (true);


--
-- Name: exec_messages exec_messages_write_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_messages_write_self ON public.exec_messages TO authenticated USING ((COALESCE(author_user_id, auth.uid()) = auth.uid())) WITH CHECK ((COALESCE(author_user_id, auth.uid()) = auth.uid()));


--
-- Name: exec_quotes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.exec_quotes ENABLE ROW LEVEL SECURITY;

--
-- Name: exec_quotes exec_quotes_select_public; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_quotes_select_public ON public.exec_quotes FOR SELECT USING (true);


--
-- Name: exec_quotes exec_quotes_write_admins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_quotes_write_admins ON public.exec_quotes TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid()))));


--
-- Name: POLICY exec_quotes_write_admins ON exec_quotes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON POLICY exec_quotes_write_admins ON public.exec_quotes IS 'exec_admins에 등록된 임원만 명언 CRUD 가능';


--
-- Name: exec_quotes exec_quotes_write_admins_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_quotes_write_admins_delete ON public.exec_quotes FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid()))));


--
-- Name: exec_quotes exec_quotes_write_admins_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_quotes_write_admins_insert ON public.exec_quotes FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid()))));


--
-- Name: exec_quotes exec_quotes_write_admins_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY exec_quotes_write_admins_update ON public.exec_quotes FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.exec_admins a
  WHERE (a.user_id = auth.uid()))));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = auth.uid()));


--
-- Name: profiles profiles_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated USING ((id = auth.uid()));


--
-- Name: profiles profiles_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: routine_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.routine_items ENABLE ROW LEVEL SECURITY;

--
-- Name: routine_items routine_items: 본인 데이터만; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "routine_items: 본인 데이터만" ON public.routine_items USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: session_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

--
-- Name: session_history session_history: 본인 데이터만; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "session_history: 본인 데이터만" ON public.session_history USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks tasks_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_delete_own ON public.tasks FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: tasks tasks_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_insert_own ON public.tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tasks tasks_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_select_own ON public.tasks FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tasks tasks_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tasks_update_own ON public.tasks FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: board_post_likes users can delete own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can delete own likes" ON public.board_post_likes FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: board_post_likes users can insert own likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "users can insert own likes" ON public.board_post_likes FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- PostgreSQL database dump complete
--

\unrestrict thfDED5CahEDWfHy4TgPUkdkKYmQJXDrsm0bZNaFOwrHnBt3dKQKXp78E0KWUaw


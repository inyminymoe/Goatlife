-- ============================================================================
-- Migration 005: board_posts / board_post_comments soft delete
-- 정책: 삭제 시 deleted_at 기록 → 30일 후 pg_cron으로 완전 삭제
-- 대상: board_posts, board_post_comments
-- 비대상 (hard delete 유지): tasks, routine_items, active_sessions
-- 비대상 (삭제 불가): attendance_logs, session_history
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. deleted_at 컬럼 추가
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.board_posts
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.board_post_comments
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

COMMENT ON COLUMN public.board_posts.deleted_at IS 'soft delete 시각. NULL = 정상. 30일 후 완전 삭제.';
COMMENT ON COLUMN public.board_post_comments.deleted_at IS 'soft delete 시각. NULL = 정상. 30일 후 완전 삭제.';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. pg_cron: 30일 지난 soft deleted 레코드 자동 완전 삭제
-- Supabase에서 pg_cron은 기본 활성화되어 있음
-- 스케줄: 매일 새벽 3시 (Asia/Seoul 기준으로는 UTC+9 → UTC 18:00 전날)
-- ──────────────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
  'purge-deleted-board-posts',
  '0 18 * * *',  -- UTC 18:00 = KST 03:00
  $$DELETE FROM public.board_posts WHERE deleted_at < now() - interval '30 days'$$
);

SELECT cron.schedule(
  'purge-deleted-board-comments',
  '0 18 * * *',
  $$DELETE FROM public.board_post_comments WHERE deleted_at < now() - interval '30 days'$$
);

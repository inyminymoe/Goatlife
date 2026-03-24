-- ============================================================================
-- Migration 007: updated_at 트리거 일괄 적용
-- fn_touch_updated_at() 함수는 baseline에 이미 포함됨 (tasks migration에서 생성)
-- 이미 트리거 있는 테이블: profiles, board_posts, tasks, attendance_logs,
--                          exec_messages, exec_quotes
-- 누락된 테이블에만 추가: board_post_comments, routine_items, active_sessions
-- ============================================================================

-- board_post_comments
CREATE TRIGGER trg_board_post_comments_updated_at
  BEFORE UPDATE ON public.board_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- routine_items
CREATE TRIGGER trg_routine_items_updated_at
  BEFORE UPDATE ON public.routine_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- active_sessions
CREATE TRIGGER trg_active_sessions_updated_at
  BEFORE UPDATE ON public.active_sessions
  FOR EACH ROW EXECUTE FUNCTION public.fn_touch_updated_at();

-- active_sessions 테이블에 remaining_seconds, is_running 컬럼 추가
-- 목적: 타이머 일시정지 상태로 새로고침했을 때 남은 시간을 정확히 복원하기 위함
--
-- remaining_seconds: 저장 시점의 남은 시간 (null = 구버전 레코드 → duration_seconds로 fallback)
-- is_running: 저장 시점 실행 여부 (false = 일시정지 → savedRemaining 그대로 복원)

ALTER TABLE active_sessions
ADD COLUMN IF NOT EXISTS remaining_seconds INTEGER,
ADD COLUMN IF NOT EXISTS is_running BOOLEAN NOT NULL DEFAULT true;

# Attendance Foundation

131번 이슈 기준으로 `/attendance` foundation에서 사용하는 공통 데이터 계약을 정리한다.

## 도메인 원칙

- `/attendance`는 조회와 실행 중심이다.
- 승인성 기능(휴가 신청, 근태 정정 요청)은 `/approval` 전자결재 도메인으로 분리한다.
- 물리 컬럼은 기존 `attendance_logs`를 재사용하되, 서비스/훅 레이어는 아래 도메인 타입을 기준으로 동작한다.

## 상태 체계

DB/서비스 공통 상태:

- `present`
- `late`
- `early_leave`
- `absent`
- `vacation`

현재 카드 UI 호환 상태:

- `none`: 오늘 기록 없음, 휴가, 결근
- `in`: 출근 후 퇴근 전
- `early`: 조퇴 처리됨
- `out`: 퇴근 완료

호환 상태는 `useAttendance` 내부에서만 사용한다. 신규 기능은 모두 도메인 상태를 직접 사용한다.

## 물리 컬럼 매핑

- `work_date -> date`
- `clock_in_at -> checkInAt`
- `clock_out_at -> checkOutAt`
- `early_leave_at -> earlyLeaveAt`
- `note -> note`

## Query Key 규약

- `['attendance', 'today']`
- `['attendance', 'logs', { from, to, status? }]`
- `['attendance', 'summary', period]`

mutation 성공 후에는 `['attendance']` 전체를 invalidate 한다.

## 공통 훅

- `useAttendanceToday()`
- `useAttendanceActions()`
- `useAttendanceLogs({ from, to, status })`
- `useAttendanceSummary({ period: 'week' | 'month' })`

## 에러 코드

- `UNAUTHENTICATED`
- `ALREADY_CHECKED_IN`
- `NO_CHECK_IN_RECORD`
- `ALREADY_FINALIZED`
- `INVALID_RANGE`
- `UNKNOWN`

## 빈 상태 키

- `attendance_today_empty`
- `attendance_logs_empty`
- `attendance_summary_empty`

## 현재 제약

- `absent`, `vacation`은 foundation 타입에 포함되지만, 현재는 별도 생성 플로우가 없다.
- 기존 legacy status(`none`, `in`, `early`, `out`)는 서비스 레이어에서 읽을 때 새 상태로 정규화한다.
- 실제 DB를 새 상태 체계로 맞추려면 `supabase/sql/fixes/supabase-attendance-foundation-migration.sql` 적용이 필요하다.

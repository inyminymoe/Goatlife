# SQL Organization

DB 관련 SQL 파일 위치와 실행 메모를 정리합니다.

## Rules
- 루트에 새 `*.sql` 파일을 만들지 않습니다.
- DB 관련 SQL은 `supabase/sql/` 아래에만 둡니다.
- 새 SQL은 목적에 맞는 하위 폴더에 저장합니다.

## Directory Layout
- `supabase/sql/schema/`
  - 테이블, 뷰, 함수, RPC, 트리거 등 구조물 정의
- `supabase/sql/policies/`
  - RLS 정책 정의 및 권한 조정
- `supabase/sql/fixes/`
  - 일회성 수정, 보정, 백필, 운영 이슈 대응

## Execution Order (General)
보통은 아래 순서를 따릅니다.

1. `schema/`에서 필요한 구조물 생성
2. `policies/`에서 권한 정책 적용
3. 필요 시 `fixes/`에서 기존 데이터 보정

## Execution Notes
- 실행 순서가 중요한 SQL은 파일 상단 주석에 명시합니다.
- 재실행 가능한 형태(`if exists`, `if not exists`)를 선호합니다.
- `fixes/`는 적용 일시와 이유를 PR/로그에 남기는 것을 권장합니다.

## Current Repository Guidance
- 현재 이 레포는 이미 주요 SQL을 `supabase/sql/**` 아래로 정리했습니다.
- 이후 새 스크립트도 같은 규칙을 따릅니다.
- 파일 이동이 추가로 필요하면 문서 먼저 갱신하고, 실제 이동은 별도 작업으로 처리합니다.

## Examples in This Repo
- 회원가입 트리거: `supabase/sql/schema/setup-auth-trigger.sql`
- 기본 RLS 정책: `supabase/sql/policies/supabase-rls-policies.sql`
- 이메일/프로필 보정: `supabase/sql/fixes/supabase-email-confirmation-fix.sql`

# Migration Strategy

현재는 Supabase SQL Editor에 수동 적용하는 스크립트 중심으로 운영하고 있습니다.

## Current State
- 정식 Supabase CLI 마이그레이션 체계는 아직 도입하지 않았습니다.
- 대신 `supabase/sql/schema`, `supabase/sql/policies`, `supabase/sql/fixes`로 용도별 정리를 유지합니다.

## Short-Term Strategy
- 새 SQL은 먼저 현재 폴더 규칙에 맞춰 저장합니다.
- 실행한 SQL은 PR 설명 또는 VibeCoding 로그에 남깁니다.
- 데이터 보정 스크립트는 적용 대상과 재실행 여부를 기록합니다.

## When to Introduce CLI Migrations
아래 조건이 늘어나면 도입 우선순위를 올립니다.

- 운영 환경 반영 이력이 자주 꼬일 때
- 여러 사람이 SQL 적용 순서를 맞추기 어려울 때
- 스테이징/프로덕션 반영 절차를 명시적으로 관리해야 할 때

## Target Direction
향후 도입 시 목표는 아래와 같습니다.

- 구조 변경은 마이그레이션으로 추적
- 시드/운영 보정은 별도 스크립트로 분리
- PR 단위로 DB 변경 이력을 검토 가능하게 유지

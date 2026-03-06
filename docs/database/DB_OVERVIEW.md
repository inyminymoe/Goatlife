# Database Overview

Goatlife의 데이터 계층은 Supabase(PostgreSQL 기반)를 중심으로 구성합니다.

## What Lives in Supabase
- 인증: Supabase Auth
- 데이터 테이블: `public` 스키마 중심
- 권한 제어: RLS 정책
- 파생 데이터: 뷰
- 서버 측 로직: 함수, RPC, 트리거

## Why This Matters
- 권한 이슈는 대부분 RLS와 함수 정의에서 발생합니다.
- UI 문제처럼 보여도 실제 원인은 SQL 정책이나 뷰 컬럼 변경일 수 있습니다.
- 따라서 DB 변경은 코드 변경과 같은 수준으로 문서화해야 합니다.

## Current SQL Layout
- 스키마 정의: `supabase/sql/schema/`
- 정책: `supabase/sql/policies/`
- 수정/백필: `supabase/sql/fixes/`

## Operational Mindset
- SQL을 실행하기 전에 목적, 영향 테이블, 재실행 안전성을 먼저 확인합니다.
- RLS 변경은 읽기/쓰기 권한 회귀 가능성이 크므로 별도 검토가 필요합니다.
- 일회성 보정 SQL은 실행 대상과 순서를 문서에 남깁니다.

## Related Docs
- SQL 정리 원칙: [SQL_ORGANIZATION.md](SQL_ORGANIZATION.md)
- 마이그레이션 계획: [MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md)

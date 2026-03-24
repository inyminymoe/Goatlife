# Migration Strategy

`supabase/migrations/` 기반의 공식 Supabase CLI migration 체계를 사용합니다.

---

## 파일 구조

```
supabase/
├── config.toml              # Supabase CLI 프로젝트 설정
├── migrations/              # 모든 DB 변경 이력 (순서 보장)
│   ├── 20260324000001_baseline.sql         # 원격 DB 기준선 (pg_dump)
│   ├── 20260324000002_enum_to_text.sql     # enum → text CHECK 전환
│   ├── 20260324000003_profiles_extensions.sql
│   ├── ...
│   └── YYYYMMDDHHMMSS_설명.sql             # 이후 모든 변경은 이 패턴
└── sql/                     # 레거시 참고용 (수동 실행 금지)
    └── schema/, policies/, fixes/
```

---

## 파일명 규칙

```
YYYYMMDDHHMMSS_간결한_설명.sql
예: 20260401120000_add_notifications_table.sql
```

- 타임스탬프는 `date +%Y%m%d%H%M%S` 로 생성
- 설명은 소문자 + 언더스코어, 무엇을 하는지 명확하게

---

## 핵심 규칙 3가지

### 1. 적용된 migration 파일은 절대 수정하지 않는다

원격 DB에 한번 반영된 파일을 수정하면 로컬/원격 상태가 영구적으로 어긋납니다.
수정이 필요하면 **새 migration 파일**을 만드세요.

```
❌ 기존 파일 수정
✅ 새 파일 생성: 20260402000001_fix_profiles_role_constraint.sql
```

### 2. DB 변경은 코드 변경과 같은 PR에 포함한다

새 테이블/컬럼을 사용하는 코드와 migration 파일이 같은 PR에 있어야 합니다.
코드만 있고 migration이 없으면 다른 환경에서 오류가 납니다.

### 3. migration은 항상 앞으로만 간다

이미 반영된 migration을 되돌리는 rollback은 지원하지 않습니다.
실수한 경우 새 migration으로 보정합니다.

---

## migration 파일 작성 지침

### IF NOT EXISTS / OR REPLACE 사용 권장

실수로 재실행해도 안전하도록 idempotent하게 작성합니다.

```sql
-- 테이블
CREATE TABLE IF NOT EXISTS public.some_table (...);

-- 컬럼 추가
ALTER TABLE public.some_table
  ADD COLUMN IF NOT EXISTS new_col text;

-- 함수
CREATE OR REPLACE FUNCTION public.some_fn() ...;

-- 정책은 먼저 DROP하고 재생성
DROP POLICY IF EXISTS some_policy ON public.some_table;
CREATE POLICY some_policy ON public.some_table ...;
```

### seed 데이터는 migration에 넣어도 된다

초기 참조 데이터(departments, board_types 등)는 migration에 포함합니다.
단, 운영 데이터(게시글, 사용자 등)는 migration에 넣지 않습니다.

---

## 원격 DB에 반영하는 방법

현재는 Supabase 대시보드 SQL Editor에서 직접 실행합니다.

```
Supabase 대시보드 → SQL Editor → migration 파일 내용 붙여넣기 → Run
```

향후 Supabase CLI로 자동화 가능:
```bash
supabase db push  # 미반영 migration을 원격에 적용
```

---

## supabase/sql/ 폴더 (레거시)

`supabase/sql/` 하위 파일들은 이전 방식의 참고 자료입니다.
- 직접 실행하지 않습니다
- 삭제하지 않습니다 (히스토리 참고용)
- 새 SQL은 반드시 `supabase/migrations/`에 작성합니다

---

## 주의사항 (팀원 공유용)

| 상황 | 올바른 대응 |
|------|------------|
| 컬럼 추가 필요 | 새 migration 파일 생성 |
| 기존 migration에 오타 발견 | 새 migration으로 보정 |
| 로컬에서만 테스트하고 싶을 때 | Docker 설치 후 `supabase start` |
| 원격 DB 현재 상태 확인 | Supabase 대시보드 Table Editor |
| pg_cron 작업 확인 | `SELECT * FROM cron.job;` |

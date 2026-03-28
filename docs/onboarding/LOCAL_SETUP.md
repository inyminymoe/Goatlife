# Local Setup

로컬에서 Goatlife를 실행하고 기본 인증 설정을 맞추기 위한 가이드입니다.

## Quick Start
```bash
pnpm install
pnpm dev
```

기본 개발 서버는 Next.js dev 서버입니다. 필요하면 `pnpm build`, `pnpm start`로 프로덕션 빌드 확인도 가능합니다.

## Environment Variables
`.env.local`에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

원칙:
- `NEXT_PUBLIC_*` 값은 클라이언트에서 사용됩니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용으로만 사용해야 합니다.

## Supabase Auth Setup
1. Supabase Dashboard에서 Authentication > Providers > Email로 이동합니다.
2. 개발 중에는 `Confirm email`을 `OFF`로 둡니다.
3. DB 스키마는 `supabase/migrations/`의 migration 파일들로 관리됩니다.
   **SQL Editor에 수동 실행하지 않습니다.**
   → 신규 스키마 변경은 [DB Migration 가이드](../database/MIGRATION_STRATEGY.md)를 참고하세요.

테스트 계정을 수동 인증 처리해야 한다면 아래 쿼리를 사용합니다.

```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

## OAuth Notes
- Kakao OAuth Redirect URI
- Production: `https://vdiolcxwsdpsvxpwduos.supabase.co/auth/v1/callback`
- Local: `http://localhost:3000/auth/callback`
- `NEXT_PUBLIC_SITE_URL`을 실제 접속 도메인에 맞춰야 올바른 리다이렉트가 동작합니다.

Kakao Client Secret을 쓰는 경우:
- Supabase Dashboard > Authentication > Providers > Kakao에서 REST API 키와 함께 입력합니다.
- Secret을 재발급하면 즉시 갱신합니다.

## DB Schema
DB 스키마 변경 이력은 `supabase/migrations/`에서 관리합니다.

- 현재 스키마 파악: `supabase/migrations/20260324000001_baseline.sql`
- 변경 규칙 및 컨벤션: [docs/database/MIGRATION_STRATEGY.md](../database/MIGRATION_STRATEGY.md)
- 레거시 참고용 SQL (수동 실행 금지): `supabase/sql/`

> `supabase/sql/` 하위 파일들은 이전 방식의 참고 자료입니다. 새 스키마 변경은 반드시 `supabase/migrations/`에 작성하세요.

## Login/Signup Checklist
- [ ] Email provider 활성화
- [ ] 개발 환경에서 `Confirm email` 비활성화
- [ ] 회원가입 후 `/login`에서 로그인 확인

## Legacy Guide
기존 루트 가이드는 [../../SETUP_GUIDE.md](../../SETUP_GUIDE.md)에 deprecate 안내와 함께 남겨두었습니다.

# Troubleshooting

로컬 개발에서 자주 부딪히는 문제를 정리합니다.

## pnpm Lockfile Mismatch
증상:
- 설치 시 lockfile 관련 경고 또는 충돌이 발생합니다.

대응:
- `package.json` 변경 후 `pnpm install`로 `pnpm-lock.yaml`을 갱신합니다.
- 다른 브랜치에서 돌아왔다면 먼저 현재 브랜치 기준으로 다시 설치합니다.

## Node Version Mismatch
증상:
- `pnpm dev` 또는 `pnpm build`가 런타임 에러와 함께 실패합니다.

대응:
- 최신 LTS Node를 사용합니다.
- 패키지 재설치 전 현재 Node 버전을 먼저 확인합니다.

## Supabase Connection Failure
증상:
- 환경변수 누락, `Invalid API key`, 인증 실패, 요청 타임아웃이 발생합니다.

대응:
- `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`가 모두 있는지 확인합니다.
- 클라이언트에서 service role key를 직접 쓰지 않는지 확인합니다.
- 값 변경 후에는 dev 서버를 재시작합니다.

## Email Confirmation Blocks Login
증상:
- 회원가입 후 로그인 시 이메일 인증 필요 메시지가 나옵니다.

대응:
- 개발 중이라면 Supabase Email provider의 `Confirm email`을 끕니다.
- 또는 [../database/SQL_ORGANIZATION.md](../database/SQL_ORGANIZATION.md)에 정리된 수정용 SQL을 참고해 수동 보정합니다.

## Missing Profile Rows
증상:
- 로그인은 됐지만 `profiles`에 데이터가 없어 아이디 조회가 실패합니다.

대응:
- `supabase/sql/schema/setup-auth-trigger.sql`이 적용됐는지 확인합니다.
- 필요하면 `supabase/sql/fixes/supabase-migrate-existing-users.sql` 또는 `supabase/sql/fixes/supabase-email-confirmation-fix.sql`을 검토합니다.

## Need More Context
- 로컬 실행 전반: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- DB 구조와 SQL 실행 순서: [../database/DB_OVERVIEW.md](../database/DB_OVERVIEW.md)

# 갓생상사 (Goatlife Inc.)
> 나의 값진 시간을 팝니다. 갓생상사.

## 서비스 소개
갓생상사는 **의지박약형 인간을 위한 루틴 강제 커뮤니티**입니다.
혼자서는 작심삼일로 끝나는 사람들도 '회사 출근' 컨셉으로 지속 가능하게 목표를 달성할 수 있도록 도와줍니다.

### 핵심 컨셉
- **자율 입사 방식**: 누구나 지원서 없이 입사 가능
- **온라인 독서실 + 스터디 + 정보공유** 통합 플랫폼
- **9-6 또는 3교대** 일정으로 체계적인 루틴 관리
- **업무 보고 & 승진 시스템**을 통한 게임화
- **디스코드 기반** 실시간 캠스터디

### 차별화 포인트
1. **회사 컨셉**: 단순 To-Do가 아닌 '출근'이라는 책임감 부여
2. **커뮤니티**: 같은 목적을 가진 사람들과 함께
3. **게임화**: 직급 시스템과 승진을 통한 동기부여
4. **통합 관리**: 일-식사-운동 루틴을 한 번에

## 주요 기능

### 출퇴근 시스템
- 정시 출근/퇴근 체크 (버튼 클릭 또는 명령어)
- 3교대 근무 시간 선택 (야간반/주간반/오후반)
- 점심시간 및 휴게시간 관리

### 승진 시스템
- 인턴 → 사원 → 대리 → 과장 → 부장
- 근속일, 업무보고, 기여도 기반 자동 승진
- 직급별 전용 채널 및 권한 부여

### 업무 보고
- 매일 오전 업무계획 + 퇴근 전 결과 보고
- 출근율 및 목표 달성률 추적
- 주간/월간 랭킹 시스템

### 커뮤니티 공간
- 부서별 전문 채널
- 챌린지 및 미션 참여
- 성과 인증 및 정보 공유

갓생상사 컨셉의 루틴 관리·업무 관리·커뮤니티를 위한 Next.js 기반 웹 앱입니다.

## Tech Stack
- Next.js 16
- React 19
- TypeScript 5
- pnpm
- Supabase
- Tailwind CSS 4
- TanStack Query
- Jotai

## Quick Start
1. 저장소를 클론합니다.
2. 의존성을 설치합니다.
3. `.env.local`을 설정합니다.
4. 개발 서버를 실행합니다.

```bash
pnpm install
pnpm dev
```

환경변수, Supabase Auth, 로컬 실행 상세 가이드는 [docs/onboarding/LOCAL_SETUP.md](docs/onboarding/LOCAL_SETUP.md)를 참고하세요.

## Scripts
- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm lint`
- `pnpm lint:fix`
- `pnpm format`
- `pnpm format:check`
- `pnpm typecheck`

## Environment Variables
- 클라이언트 공개값: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
- 서버 전용값: `SUPABASE_SERVICE_ROLE_KEY`
- 상세 설정, 예시 값, 주의사항: [docs/onboarding/LOCAL_SETUP.md](docs/onboarding/LOCAL_SETUP.md)

## Documentation
- Documentation Index: [docs/INDEX.md](docs/INDEX.md)
- Onboarding: [docs/onboarding/LOCAL_SETUP.md](docs/onboarding/LOCAL_SETUP.md)
- Troubleshooting: [docs/onboarding/TROUBLESHOOTING.md](docs/onboarding/TROUBLESHOOTING.md)
- Workflow: [docs/development/WORKFLOW.md](docs/development/WORKFLOW.md)
- Coding Conventions: [docs/development/CODING_CONVENTIONS.md](docs/development/CODING_CONVENTIONS.md)
- Database Overview: [docs/database/DB_OVERVIEW.md](docs/database/DB_OVERVIEW.md)
- SQL Organization: [docs/database/SQL_ORGANIZATION.md](docs/database/SQL_ORGANIZATION.md)
- Migration Strategy: [docs/database/MIGRATION_STRATEGY.md](docs/database/MIGRATION_STRATEGY.md)
- Future Admin Guide: [docs/development/FUTURE_ADMIN_GUIDE.md](docs/development/FUTURE_ADMIN_GUIDE.md)

## Documentation Policy (Public Repository)

This repository is public.
To maintain clarity and security, we separate technical documentation from internal planning materials.

### Maintained in GitHub (Public)

The following documents are version-controlled and publicly available:

- README
- Development workflow (branching / PR rules)
- Database structure and Supabase guidelines
- Future Admin Guide
- Technical architecture and setup documentation

These documents are strictly technical and implementation-focused.

---

### Maintained Outside GitHub (Private)

The following materials are NOT stored in this repository:

- VibeCoding logs (daily development logs)
- Early-stage feature planning drafts
- Strategic direction documents
- Personal retrospectives
- Internal decision discussions

These are managed in a private workspace:

👉 Notion: https://www.notion.so/inykang/3174bf8963a580749d35e69b7f8fe7a6?source=copy_link

---

### Why This Separation?

- This repository is public.
- Strategy, internal reflections, and evolving plans should not be permanently exposed.
- Technical documentation belongs in Git.
- Planning and reflection belong in a private collaboration space.

## Contributing (Summary)
- 브랜치는 작업 단위로 분리하고 `main`에 직접 작업하지 않는 흐름을 권장합니다.
- 커밋은 작은 단위로 나누고, 제목만 봐도 의도가 드러나게 작성합니다.
- PR에는 변경 요약과 검증 내용을 남기고, 가능하면 관련 작업 로그/결정 문서를 링크합니다.
- 상세 규칙은 [docs/development/WORKFLOW.md](docs/development/WORKFLOW.md)를 참고하세요.

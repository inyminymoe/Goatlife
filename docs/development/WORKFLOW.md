# Development Workflow

개발 브랜치, 커밋, PR, 리뷰의 기본 규칙을 정리합니다.

## Branching
- `main`은 배포 기준 브랜치로 취급합니다.
- 새 작업은 기능 단위 브랜치에서 시작합니다.
- 브랜치 이름은 의도가 드러나게 작성합니다.
- 예시: `feat/...`, `fix/...`, `chore/...`, `docs/...`

## Commit
- 커밋은 작고 설명 가능하게 유지합니다.
- 제목만 봐도 변경 목적이 드러나야 합니다.
- 문서/구조 변경은 코드 변경과 가능한 한 분리합니다.

## Pull Requests
- PR 본문에는 변경 요약, 테스트/검증 결과, 영향 범위를 적습니다.
- 관련 문서가 있다면 같이 링크합니다.
- VibeCoding 흐름에서는 관련 로그/결정 링크를 붙이는 것을 권장합니다.
- 권장 링크 위치:
  - 작업 로그: `docs/vibecoding/logs/YYYY-MM.md`
  - 결정 기록: `docs/vibecoding/decisions/000X-*.md`

## Review
- 리뷰는 동작 회귀, 데이터 영향, 권한/RLS, 배포 리스크를 우선 확인합니다.
- UI 변경이라면 경로와 화면 기준으로 확인 범위를 적습니다.
- DB 변경이라면 실행 순서와 롤백 가능성도 함께 적습니다.

## CI and Local Checks
- 문서만 바뀌는 작업이 아니라면 기본적으로 아래를 고려합니다.
- `pnpm lint`
- `pnpm typecheck`
- 필요 시 `pnpm build`

## Related Docs
- 코딩 규칙: [CODING_CONVENTIONS.md](CODING_CONVENTIONS.md)
- VibeCoding 운영: [../vibecoding/README.md](../vibecoding/README.md)

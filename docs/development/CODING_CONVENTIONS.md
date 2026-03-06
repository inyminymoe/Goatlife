# Coding Conventions

현재 레포 구조를 기준으로 폴더 배치와 파일 작성 규칙을 정리합니다.

## Structure
- `src/app/`: Next.js App Router와 라우트 전용 코드
- `src/components/`: 재사용 가능한 UI 및 기능 컴포넌트
- `src/lib/`: 유틸리티, 설정, 공용 타입/헬퍼
- `src/services/`: API 호출 및 서비스 레이어
- `src/providers/`: 전역 Provider
- `src/hooks/`: 범용 훅
- `public/`: 정적 자산

## Placement Rules
- 특정 라우트에서만 쓰는 파일은 해당 라우트 근처에 둡니다.
- 여러 화면에서 재사용되면 `src/components`, `src/lib`, `src/services` 같은 공용 레이어로 이동합니다.
- 페이지 파일이 비대해지면 로직을 훅/서비스로 분리합니다.

## Naming
- 컴포넌트 파일: PascalCase
- 함수/변수: camelCase
- 라우트 세그먼트와 일반 폴더: kebab-case 또는 기존 관례 유지
- 문서 파일: 현재 `docs/` 아래 규칙에 맞춰 일관된 읽기 쉬운 이름 사용

## Service and Data Boundaries
- Supabase 클라이언트 생성 위치는 한곳에서 관리합니다.
- 네트워크/데이터 접근은 가능한 한 서비스 레이어에 모읍니다.
- UI 컴포넌트는 표시 책임과 상호작용에 집중하고, 데이터 조합 로직은 분리합니다.

## SQL and DB Files
- 새 SQL 파일은 루트에 만들지 않습니다.
- `supabase/sql/schema`, `supabase/sql/policies`, `supabase/sql/fixes` 아래에 목적별로 저장합니다.
- 상세 규칙은 [../database/SQL_ORGANIZATION.md](../database/SQL_ORGANIZATION.md)를 따릅니다.

## Future Admin
- Admin 대비 원칙은 [FUTURE_ADMIN_GUIDE.md](FUTURE_ADMIN_GUIDE.md)에 정리합니다.

## Design Tokens and Styling
- 새 컴포넌트를 제작할 때는 반드시 `src/app/globals.css`를 참고합니다.
- Figma 디자인을 픽셀 단위로 그대로 구현하지 않고, globals.css에 정의된 디자인 토큰(색상, 폰트, 유틸리티 클래스)을 우선 사용합니다.
- 색상: `--color-*` 변수 및 유틸리티 클래스(`.bg-dark`, `.text-dark` 등)
- 폰트: `.brand-h1~h6`, `.body-xl~2xs` 등 정의된 타이포그래피 클래스
- 간격/레이아웃: `.app-container`, `.pt-safe`, `.pb-safe` 등 유틸리티 클래스

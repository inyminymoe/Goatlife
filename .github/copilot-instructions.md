# Copilot 코드 리뷰 가이드

> 이 문서는 GitHub Copilot이 PR을 리뷰할 때 참고하는 가이드임

## 리뷰 포커스 영역

### 1. 코드 품질
- TypeScript 타입 안전성
- React 컴포넌트 패턴 및 hooks 사용
- 성능 최적화 (useMemo, useCallback 등)

### 2. 접근성
- ARIA 속성 사용
- 키보드 네비게이션
- 스크린 리더 호환성

### 3. 보안
- XSS 취약점
- 민감 정보 노출
- 입력 검증

### 4. 스타일 가이드
- Tailwind CSS 사용 규칙
- 컴포넌트 네이밍 컨벤션
- 파일 구조 및 조직

### 5. 테스트
- 중요한 로직에 대한 테스트 누락
- Edge case 처리

## 프로젝트 컨텍스트
- Next.js 16 App Router 사용
- Supabase 백엔드
- Tailwind CSS + Framer Motion
- TypeScript strict mode

## 리뷰 시 확인사항
- [ ] 타입 안전성
- [ ] 접근성 (ARIA, 키보드)
- [ ] 성능 (불필요한 리렌더링)
- [ ] 보안 취약점
- [ ] 코드 중복
- [ ] 에러 핸들링

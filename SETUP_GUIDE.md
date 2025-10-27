# 회원가입/로그인 설정 가이드

## 🚨 로그인이 안되는 이유와 해결방법

### 원인 1: 이메일 확인 설정
Supabase에서 "Confirm email" 옵션이 켜져있으면 회원가입 후 이메일 인증을 해야 로그인 가능

**해결방법:**
1. Supabase Dashboard → Authentication → Providers → Email
2. **"Confirm email"을 OFF**로 설정 (개발 중)

또는 기존 사용자들의 이메일을 수동으로 확인 처리:
```sql
-- Supabase SQL Editor에서 실행
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;
```

### 원인 2: DB 트리거 미설정
회원가입 시 profiles 테이블에 자동으로 데이터가 들어가려면 DB 트리거 필요

**해결방법:**
`setup-auth-trigger.sql` 파일을 Supabase SQL Editor에서 실행

---

## 📋 필수 설정 체크리스트

### Supabase 설정
- [ ] Email provider 활성화
- [ ] "Confirm email" OFF (개발 중)
- [ ] setup-auth-trigger.sql 실행 완료

### 회원가입 테스트
1. http://localhost:3002/signup 접속
2. 모든 필드 입력 후 "입사 지원하기" 클릭
3. 성공 Toast 확인
4. 자동으로 /login 페이지로 이동

### 로그인 테스트
1. http://localhost:3002/login 접속
2. 회원가입한 **아이디**(userId)와 비밀번호 입력
3. 로그인 성공 확인

---

## 🗂️ 프로젝트 파일 구조

### 회원가입 관련
- `src/app/signup/page.tsx` - 회원가입 페이지
- `src/app/signup/schema.ts` - 회원가입 폼 검증 스키마
- `src/app/signup/actions.ts` - 회원가입 서버 액션
- `src/components/features/auth/SignupForm.tsx` - 회원가입 폼 컴포넌트

### 로그인 관련
- `src/app/login/page.tsx` - 로그인 페이지
- `src/app/login/actions.ts` - 로그인 서버 액션 (userId → email 변환)

### Supabase 클라이언트
- `src/lib/supabase/index.ts` - 클라이언트 사이드 Supabase 클라이언트
- `src/lib/supabase/server.ts` - 서버 사이드 Supabase 클라이언트
- `src/lib/supabase/admin.ts` - Admin 클라이언트 (RLS 우회)

### UI 컴포넌트
- `src/components/ui/Toast.tsx` - Toast 알림 (Portal 사용, z-index 9999)

### DB 설정 파일
- `setup-auth-trigger.sql` - 회원가입 시 profiles 자동 생성 트리거
- `supabase-email-confirmation-fix.sql` - 이메일 확인 상태 조회/수정 쿼리
- `supabase-rls-policies.sql` - RLS 정책

---

## 🔧 트러블슈팅

### "아이디를 찾을 수 없습니다" 에러
→ profiles 테이블에 user_id가 없음
→ `supabase-email-confirmation-fix.sql`의 4번 쿼리로 확인

### "이메일 인증이 필요합니다" 에러
→ email_confirmed_at이 NULL
→ Supabase에서 "Confirm email" OFF 또는 수동 확인 처리

### "아이디 또는 비밀번호가 일치하지 않습니다" 에러
→ 비밀번호 틀림 또는 이메일/userId 오타
→ 회원가입 시 사용한 정확한 userId와 password 확인

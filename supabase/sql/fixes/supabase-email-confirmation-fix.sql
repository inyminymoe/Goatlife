-- 이메일 확인 문제 해결을 위한 SQL 쿼리들

-- 1) 현재 사용자의 이메일 확인 상태 확인
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'userId' as user_id
FROM auth.users
ORDER BY created_at DESC;

-- 2) 특정 사용자의 이메일을 수동으로 확인 처리 (이메일을 본인의 것으로 변경)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'your-email@example.com';

-- 3) 모든 사용자를 확인 처리 (개발 환경에서만!)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- 4) profiles 테이블에서 user_id 확인
SELECT
  id,
  user_id,
  email,
  last_name,
  first_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

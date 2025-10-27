-- Supabase RLS Policies for profiles table (Updated)
-- Run this in Supabase Dashboard → SQL Editor

-- 먼저 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

-- 1. 회원가입 시 새 프로필 생성 허용
CREATE POLICY "Enable insert for authenticated users"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. 자신의 프로필 조회 허용
CREATE POLICY "Enable read access for own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. 자신의 프로필 수정 허용
CREATE POLICY "Enable update for own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 참고: 로그인 시 user_id로 email 조회는 server-side에서 admin client를 사용하므로
-- RLS를 우회합니다. 따라서 별도의 public SELECT policy가 필요하지 않습니다.

-- RLS 활성화 확인
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

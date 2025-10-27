-- Supabase RLS Policies for profiles table
-- Run this in Supabase Dashboard → SQL Editor

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

-- 3. 자신의 프로필 수정 허용 (옵션)
CREATE POLICY "Enable update for own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

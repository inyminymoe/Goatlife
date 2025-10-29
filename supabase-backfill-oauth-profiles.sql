-- OAuth 사용자 기본값 보정 스크립트
-- Supabase SQL Editor에서 실행하세요.

update public.profiles
set
  user_id = coalesce(nullif(user_id, ''), split_part(email::text, '@', 1), concat('guest_', left(id::text, 8))),
  last_name = coalesce(nullif(last_name, ''), user_id, '게스트'),
  rank = coalesce(rank, '인턴'::rank_enum),
  updated_at = now()
where last_name is null
   or last_name = ''
   or user_id is null
   or user_id = ''
   or rank is null;

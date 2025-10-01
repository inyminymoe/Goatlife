import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  // 이메일 회원가입
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  },

  // 이메일 로그인
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  // 로그아웃
  signOut: async () => {
    return await supabase.auth.signOut();
  },

  // 현재 유저 가져오기
  getUser: async () => {
    return await supabase.auth.getUser();
  },
};

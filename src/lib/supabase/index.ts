import { createBrowserClient } from '@supabase/ssr';
import { loginWithUserId } from '@/app/login/actions';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Auth helper functions
export const auth = {
  /**
   * Sign in with userId (not email)
   * This will look up the email from the profiles table using userId
   */
  signIn: async (userId: string, password: string) => {
    const result = await loginWithUserId(userId, password);

    if (!result.success) {
      return {
        error: {
          message: result.error || 'Login failed',
        },
      };
    }

    return { error: null };
  },

  signOut: async () => {
    const supabase = createClient();
    return await supabase.auth.signOut();
  },

  getUser: async () => {
    const supabase = createClient();
    return await supabase.auth.getUser();
  },
};

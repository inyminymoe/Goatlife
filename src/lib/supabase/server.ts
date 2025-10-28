import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ensurePath = (options?: Record<string, unknown>) => {
  if (!options) {
    return { path: '/' };
  }

  if (!('path' in options)) {
    return { ...options, path: '/' };
  }

  return options;
};

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...ensurePath(options) });
          } catch {
            // Server Component에서는 set이 제한될 수 있음
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...ensurePath(options),
              expires: new Date(0),
            });
          } catch {
            // Server Component에서는 remove가 제한될 수 있음
          }
        },
      },
    }
  );
}

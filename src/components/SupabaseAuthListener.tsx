'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import type { User } from '@/types/user';

type ProfileRow = {
  last_name?: string | null;
  first_name?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  rank?: string | null;
  user_id?: string | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const buildUser = (
  sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  },
  profile?: ProfileRow | null
): User => {
  const lastName = profile?.last_name ?? '';
  const firstName = profile?.first_name ?? '';
  const fullName =
    `${lastName}${firstName}`.trim() ||
    (profile?.user_id ?? '') ||
    sessionUser.email?.split('@')[0] ||
    '사원';

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    name: fullName,
    avatar: profile?.avatar_url ?? undefined,
    lastName: lastName || undefined,
    firstName: firstName || undefined,
    department: profile?.department ?? undefined,
    rank: profile?.rank ?? undefined,
    userId: profile?.user_id ?? undefined,
  };
};

export default function SupabaseAuthListener() {
  const setUser = useSetAtom(userAtom);
  const [supabase] = useState(() =>
    createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  );

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[SupabaseAuthListener] getSession failed', error);
      }

      if (!session) {
        if (isMounted) {
          setUser(null);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('last_name, first_name, avatar_url, department, rank, user_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          '[SupabaseAuthListener] profile fetch failed',
          profileError
        );
      }

      if (isMounted) {
        setUser(buildUser(session.user, profile));
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('last_name, first_name, avatar_url, department, rank, user_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          '[SupabaseAuthListener] profile fetch failed',
          profileError
        );
      }

      setUser(buildUser(session.user, profile));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, supabase]);

  return null;
}

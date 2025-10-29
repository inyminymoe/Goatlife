'use client';
import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import type { Session } from '@supabase/supabase-js';
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
const DEFAULT_NAME = '게스트';
const DEFAULT_RANK = '인턴';

const buildUser = (
  sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  },
  profile?: ProfileRow | null
): User => {
  const metadata = sessionUser.user_metadata ?? {};
  const metaName =
    (metadata['last_name'] as string | undefined) ??
    (metadata['name'] as string | undefined) ??
    (metadata['full_name'] as string | undefined) ??
    (metadata['nickname'] as string | undefined) ??
    undefined;
  const metaNickname =
    (metadata['profile_nickname'] as string | undefined) ??
    (metadata['nickname'] as string | undefined) ??
    undefined;

  const rawLastName = profile?.last_name ?? metaName ?? '';
  let lastName = rawLastName.trim();
  if (!lastName || lastName.includes('@')) {
    lastName = metaNickname?.trim() || metaName?.trim() || DEFAULT_NAME;
  }
  const firstName = (profile?.first_name ?? '').trim();
  const rank = (profile?.rank ?? DEFAULT_RANK).trim() || DEFAULT_RANK;

  const fullName =
    `${lastName}${firstName}`.trim() ||
    profile?.user_id ||
    metaNickname ||
    metaName ||
    sessionUser.email?.split('@')[0]?.replace(/@.*/, '') ||
    DEFAULT_NAME;

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    name: fullName,
    avatar: profile?.avatar_url ?? undefined,
    nickname: metaNickname?.trim() || undefined,
    lastName,
    firstName: firstName || undefined,
    department: profile?.department ?? undefined,
    rank,
    userId: profile?.user_id ?? undefined,
    provider:
      (sessionUser.app_metadata?.provider as string | undefined) ?? undefined,
  };
};

export default function SupabaseAuthListener() {
  const setUser = useSetAtom(userAtom);
  const hasSyncedRef = useRef(false);
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

    const persistSession = async (session: Session | null) => {
      if (!session) {
        return;
      }

      if (hasSyncedRef.current) {
        return;
      }

      if (!session.access_token || !session.refresh_token) {
        return;
      }

      try {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        hasSyncedRef.current = true;
      } catch (error) {
        console.error('[SupabaseAuthListener] setSession failed', error);
      }
    };

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

      await persistSession(session);

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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        hasSyncedRef.current = false;
        setUser(null);
        return;
      }

      if (!session) {
        setUser(null);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await persistSession(session);
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

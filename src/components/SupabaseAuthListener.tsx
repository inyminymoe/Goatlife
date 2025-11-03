'use client';
import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/index';
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
  const router = useRouter();
  const setUser = useSetAtom(userAtom);
  const hasSyncedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  // 싱글턴 supabase 클라이언트 사용 (LoginForm과 동일한 인스턴스)
  const supabase = useMemo(() => createClient(), []);

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
        const hadUser = lastUserIdRef.current !== null;
        lastUserIdRef.current = null;
        setUser(null);

        if (hadUser) {
          router.refresh();
        }
        return;
      }

      if (!session) {
        const hadUser = lastUserIdRef.current !== null;
        lastUserIdRef.current = null;
        setUser(null);

        if (hadUser) {
          router.refresh();
        }
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

      const user = buildUser(session.user, profile);
      const userChanged = lastUserIdRef.current !== user.id;
      lastUserIdRef.current = user.id;

      setUser(user);

      if (
        userChanged &&
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')
      ) {
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, supabase, router]);

  return null;
}

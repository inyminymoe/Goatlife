'use client';
import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  joined_at?: string | null;
};

const DEFAULT_NAME = '게스트';
const DEFAULT_RANK = '인턴';

const sanitizeHandle = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  const sanitized = trimmed.replace(/[^a-z0-9_-]/g, '');
  return sanitized || null;
};

const emailLocalPart = (email?: string | null) => {
  if (!email) return null;
  const [local] = email.split('@');
  return sanitizeHandle(local);
};

const buildUser = (
  sessionUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
    created_at?: string;
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

  const derivedUserId =
    profile?.user_id ??
    sanitizeHandle(metadata['user_id'] as string | undefined) ??
    emailLocalPart(sessionUser.email) ??
    undefined;

  const fullName =
    `${lastName}${firstName}`.trim() ||
    derivedUserId ||
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
    userId: derivedUserId,
    provider:
      (sessionUser.app_metadata?.provider as string | undefined) ?? undefined,
    joinedAt:
      profile?.joined_at ??
      (metadata['joined_at'] as string | undefined) ??
      sessionUser.created_at ??
      undefined,
  };
};

export default function SupabaseAuthListener() {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useSetAtom(userAtom);
  const supabase = useMemo(() => createClient(), []);

  const refreshProfile = useCallback(
    async (session: Session | null) => {
      if (!session) {
        setUser(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'last_name, first_name, avatar_url, department, rank, user_id, joined_at'
        )
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          '[SupabaseAuthListener] profile fetch failed',
          profileError
        );
      }

      setUser(buildUser(session.user, profile));
    },
    [setUser, supabase]
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

      if (!isMounted) return;
      await refreshProfile(session);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (!session) {
        setUser(null);
        if (event === 'SIGNED_OUT') {
          router.refresh();
        }
        return;
      }

      await refreshProfile(session);

      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
      ) {
        router.refresh();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile, router, supabase, setUser]);

  useEffect(() => {
    let aborted = false;

    const syncOnNavigation = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[SupabaseAuthListener] navigation sync failed', error);
      }

      if (aborted) return;
      await refreshProfile(session);
    };

    void syncOnNavigation();

    return () => {
      aborted = true;
    };
  }, [pathname, refreshProfile, supabase]);

  return null;
}

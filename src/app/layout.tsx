import type { Metadata } from 'next';
import { brandFont, bodyFont } from '../lib/fonts';
import Providers from '../components/Providers';
import LayoutWrapper from '../components/LayoutWrapper';
import './globals.css';
import { createServerSupabase } from '@/lib/supabase/server';
import type { User } from '@/types/user';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: '갓생상사 - Goatlife Inc.',
  description: '24시간 OPEN! 갓생이들의 온라인 회사',
  icons: {
    icon: '/favicon.ico',
  },
};

async function getInitialUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const metadata = user.user_metadata ?? {};
    const appMetadata = user.app_metadata ?? {};
    const metaNickname =
      (metadata['profile_nickname'] as string | undefined) ??
      (metadata['nickname'] as string | undefined) ??
      undefined;
    const metaLastName =
      (metadata['last_name'] as string | undefined) ??
      (metadata['name'] as string | undefined) ??
      (metadata['full_name'] as string | undefined) ??
      undefined;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('last_name, first_name, avatar_url, department, rank, user_id')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[RootLayout] profile fetch failed', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    const rawLastName = profile?.last_name ?? metaLastName ?? '';
    let lastName = rawLastName?.trim?.() ?? '';
    if (!lastName || lastName.includes('@')) {
      lastName =
        metaNickname?.trim() ??
        metaLastName?.trim() ??
        user.email?.split('@')[0] ??
        '게스트';
    }
    const firstName = profile?.first_name ?? '';
    const fallbackName =
      profile?.user_id ||
      user.user_metadata?.user_id ||
      metaNickname ||
      metaLastName ||
      user.email?.split('@')[0] ||
      '사원';

    return {
      id: user.id,
      email: user.email ?? '',
      name: `${lastName}${firstName}`.trim() || fallbackName,
      avatar: profile?.avatar_url ?? undefined,
      nickname: metaNickname?.trim() || undefined,
      lastName: lastName || undefined,
      firstName: firstName || undefined,
      department: profile?.department ?? undefined,
      rank: profile?.rank ?? undefined,
      userId: profile?.user_id ?? undefined,
      provider: (appMetadata?.provider as string | undefined) ?? undefined,
    };
  } catch (error) {
    console.error('[RootLayout] failed to resolve initial user', error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await getInitialUser();

  return (
    <html lang="ko" className={`${brandFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers initialUser={initialUser}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

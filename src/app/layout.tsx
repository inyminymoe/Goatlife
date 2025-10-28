import type { Metadata } from 'next';
import { brandFont, bodyFont } from '../lib/fonts';
import Providers from '../components/Providers';
import LayoutWrapper from '../components/LayoutWrapper';
import './globals.css';
import { createServerSupabase } from '@/lib/supabase/server';
import type { User } from '@/types/user';

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

    const lastName = profile?.last_name ?? '';
    const firstName = profile?.first_name ?? '';
    const fallbackName =
      profile?.user_id ||
      user.user_metadata?.user_id ||
      user.email?.split('@')[0] ||
      '사원';

    return {
      id: user.id,
      email: user.email ?? '',
      name: `${lastName}${firstName}`.trim() || fallbackName,
      avatar: profile?.avatar_url ?? undefined,
      lastName: lastName || undefined,
      firstName: firstName || undefined,
      department: profile?.department ?? undefined,
      rank: profile?.rank ?? undefined,
      userId: profile?.user_id ?? undefined,
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

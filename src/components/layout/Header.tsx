'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import IconLogo from '../ui/icons/IconLogo';
import Avatar from '../ui/Avatar';
import { createClient } from '@/lib/supabase/index';
import { useSetAtom } from 'jotai';
import { userAtom } from '@/store/atoms';

interface HeaderProps {
  isLoggedIn?: boolean;
  userProfile?: {
    displayName: string;
    avatar?: string;
    rank?: string;
    provider?: string;
  };
  locale?: 'ko' | 'en';
  onMenuToggle?: () => void;
}

export default function Header({
  isLoggedIn = false,
  userProfile,
  locale = 'ko',
  onMenuToggle,
}: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const setUser = useSetAtom(userAtom);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
  };

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);

    try {
      const [serverResponse, clientResponse] = await Promise.all([
        fetch('/api/auth/signout', {
          method: 'POST',
          credentials: 'include',
        }),
        supabase.auth.signOut({ scope: 'local' }),
      ]);

      if (!serverResponse.ok) {
        const body = await serverResponse.json().catch(() => null);
        console.error('[Header] server signOut failed', body);
      }

      if (clientResponse.error) {
        console.error('[Header] client signOut failed', clientResponse.error);
      }
    } catch (error) {
      console.error('[Header] unexpected signOut error', error);
    }

    setUser(null);
    setIsMenuOpen(false);
    setIsSigningOut(false);
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="w-full bg-dark mt-2">
      <div className="app-container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-dark transition-colors"
            aria-label="메뉴 열기"
          >
            <Icon icon="lucide:menu" className="w-6 h-6" />
          </button>

          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0"
            aria-label="홈으로"
          >
            <IconLogo
              className="cursor-pointer"
              width={locale === 'ko' ? 90 : 100}
              height={locale === 'ko' ? 29 : 16}
              variant={locale}
              isDarkMode={isDarkMode}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-dark hover:bg-dark-subtle transition-colors"
          >
            <Icon
              icon={isDarkMode ? 'lucide:sun' : 'lucide:moon'}
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </button>

          {isLoggedIn && userProfile ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="flex items-center gap-2 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded-full"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <Avatar
                  src={userProfile.avatar}
                  name={userProfile.displayName}
                  rank={userProfile.rank}
                  size="sm"
                  showName={true}
                />
              </button>

              {isMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-3 w-48 rounded-lg bg-white shadow-[0_10px_30px_rgba(15,23,42,0.2)] overflow-hidden z-50"
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="text-left px-4 py-2 body-sm text-fixed-grey-900 hover:bg-dark-subtle focus-visible:outline disabled:opacity-50 transition-colors"
                    role="menuitem"
                  >
                    {isSigningOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="text-dark body-sm font-medium hover:text-primary-500 transition-colors px-2 py-1"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

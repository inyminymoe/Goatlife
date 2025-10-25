'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import IconLogo from '../ui/icons/IconLogo';
import Avatar from '../ui/Avatar';

interface HeaderProps {
  isLoggedIn?: boolean;
  userProfile?: {
    name: string;
    avatar?: string;
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
  const router = useRouter();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDarkMode ? 'dark' : 'light');
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
            <Avatar
              src={userProfile.avatar}
              name={userProfile.name}
              size="sm"
              showName={true}
            />
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

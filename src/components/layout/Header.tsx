'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import IconLogo from '../ui/icons/IconLogo';

interface HeaderProps {
  isLoggedIn?: boolean;
  userProfile?: {
    name: string;
    avatar?: string;
  };
  locale?: 'ko' | 'en';
  variant?: 'default' | 'minimal';
}

export default function Header({
  isLoggedIn = false,
  userProfile,
  locale = 'ko',
  variant = 'default',
}: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleBack = () => {
    router.back();
  };

  // 로그인 페이지용 미니멀 헤더
  if (variant === 'minimal') {
    return (
      <header className="w-full px-4 py-3 md:px-8 md:py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBack}
            className="
              flex items-center justify-center
              w-10 h-10 rounded-lg
              text-grey-700 hover:bg-grey-100
              transition-colors duration-200
            "
            aria-label="뒤로가기"
          >
            <Icon
              icon="material-symbols:arrow-back-ios-rounded"
              className="w-6 h-6"
            />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b border-grey-200 px-4 py-3 md:px-8 md:py-4 lg:px-16">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 브랜드 로고 */}
        <div className="flex-shrink-0">
          <IconLogo
            className="cursor-pointer"
            width={locale === 'ko' ? 80 : 100}
            height={locale === 'ko' ? 29 : 16}
            variant={locale}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* 다크모드 토글 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-grey-500 hover:text-grey-700 hover:bg-grey-100 transition-colors duration-200"
          >
            <Icon
              icon={isDarkMode ? 'lucide:sun' : 'lucide:moon'}
              className="w-5 h-5 md:w-6 md:h-6"
            />
          </button>

          {/* 로그인/프로필 영역 */}
          {isLoggedIn && userProfile ? (
            <UserProfileSection userProfile={userProfile} />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
}

function LoginButton() {
  return (
    <button className="text-grey-900 body-sm font-medium hover:text-primary-500 transition-colors duration-200 px-2 py-1">
      로그인
    </button>
  );
}

function UserProfileSection({
  userProfile,
}: {
  userProfile: { name: string; avatar?: string };
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{userProfile.name}</span>
    </div>
  );
}

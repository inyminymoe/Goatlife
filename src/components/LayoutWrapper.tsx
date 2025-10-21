'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/atoms';
import TopBanner from './layout/TopBanner';
import Header from './layout/Header';
import Footer from './layout/Footer';
import Sidebar from './layout/Sidebar';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Jotai에서 유저 정보 가져오기
  const [user] = useAtom(userAtom);
  const isLoggedIn = !!user;

  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;

  // 로그인/회원가입 페이지: 미니멀 레이아웃
  if (isAuthPage) {
    return (
      <div className="min-h-dvh flex flex-col">
        <TopBanner />
        <Header variant="minimal" />
        <main className="flex-1 min-h-0 flex flex-col">{children}</main>
        <Footer />
      </div>
    );
  }

  // 기본 레이아웃
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBanner />
      <Header
        variant="default"
        isLoggedIn={isLoggedIn}
        userProfile={
          isLoggedIn && user
            ? {
                name: user.name,
                avatar: user.avatar,
              }
            : undefined
        }
        onMenuToggle={() => setIsMobileSidebarOpen(true)}
      />

      {/* Grid 컨테이너 */}
      <div className="flex-1 min-h-0 bg-white">
        {/* Desktop Grid Layout */}
        <div className="hidden lg:block app-container pt-2 pb-4">
          <div className="grid grid-cols-[276px_1fr] gap-6">
            <Sidebar variant="desktop" isLoggedIn={isLoggedIn} />
            <main className="grid grid-cols-2 gap-5 auto-rows-min">
              {children}
            </main>
          </div>
        </div>

        {/* Mobile/Tablet Layout */}
        <div className="lg:hidden min-h-full">
          <Sidebar
            variant="mobile"
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            isLoggedIn={isLoggedIn}
          />
          <main className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

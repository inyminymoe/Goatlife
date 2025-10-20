'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
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

  const isLoginPage = pathname === '/login';
  const isSignupPage = pathname === '/signup';
  const isAuthPage = isLoginPage || isSignupPage;

  // TODO: Jotai userAtom에서 실제 인증 상태 가져오기
  const isLoggedIn = false; // 임시

  // 로그인/회원가입 페이지: 미니멀 레이아웃 (Sidebar 없음)
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

  // 기본 레이아웃: TopBanner + Header + Sidebar + Content + Footer
  return (
    <div className="min-h-dvh flex flex-col">
      <TopBanner />
      <Header
        variant="default"
        isLoggedIn={isLoggedIn}
        userProfile={isLoggedIn ? { name: '강 인턴' } : undefined}
        onMenuToggle={() => setIsMobileSidebarOpen(true)}
      />

      {/* Grid 컨테이너 */}
      <div className="flex-1 min-h-0 bg-white">
        {/* Desktop Grid Layout */}
        <div className="hidden lg:block app-container pt-2 pb-4">
          <div className="grid grid-cols-[276px_1fr] gap-6">
            {/* Sidebar */}
            <Sidebar variant="desktop" isLoggedIn={isLoggedIn} />

            {/* Main Content - 2열 Grid */}
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

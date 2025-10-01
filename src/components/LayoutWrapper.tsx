'use client';
import { usePathname } from 'next/navigation';
import TopBanner from './layout/TopBanner';
import Header from './layout/Header';
import Footer from './layout/Footer';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="min-h-dvh flex flex-col">
      <TopBanner />
      <Header variant={isLoginPage ? 'minimal' : 'default'} />
      <main className="flex-1 min-h-0 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
}

import type { Metadata } from 'next';
import { brandFont, bodyFont } from '../lib/fonts';
import Providers from '../components/Providers';
import LayoutWrapper from '../components/LayoutWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: '갓생상사 - Goatlife Inc.',
  description: '24시간 OPEN! 갓생이들의 온라인 회사',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${brandFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import LoginForm from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="relative flex flex-col flex-1 pt-14 md:pt-0">
      <div className="fixed inset-0 z-0 pointer-events-none select-none">
        <Image
          src="/images/login-background.jpg"
          alt="login background"
          fill
          className="object-cover"
          unoptimized
          priority
        />
      </div>

      <div className="absolute top-0 left-0 z-30 w-full">
        <div className="app-container py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="뒤로가기"
          >
            <Icon
              icon="material-symbols:arrow-back-ios-rounded"
              className="w-6 h-6"
            />
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-80 p-6 flex flex-col relative">
          <div
            className="absolute inset-0 -z-10 rounded-2xl"
            style={{
              background: 'rgba(241, 141, 251, 0.08)',
              backdropFilter: 'blur(3px) saturate(100%)',
              WebkitBackdropFilter: 'blur(3px) saturate(100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: `
              4px 4px 20px 0 rgba(256, 256, 256, 0.10),
              inset 1px 1px 1px 0 rgba(255, 255, 255, 0.15)
              `,
            }}
          />

          <h1 className="brand-h2 font-brand text-white mb-6 relative z-10">
            로그인
          </h1>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}

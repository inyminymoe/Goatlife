'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/lib/supabase';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Icon } from '@iconify/react';

const loginSchema = z.object({
  email: z
    .string()
    .min(3, '아이디는 3자 이상이어야 합니다')
    .max(20, '아이디는 20자 이하여야 합니다')
    .regex(
      /^[a-z0-9_-]+$/,
      '아이디는 영문 소문자, 숫자, 언더스코어(_), 하이픈(-)만 가능합니다'
    ),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // TODO: 아이디(username) → 이메일 매핑 로직이 필요할 수도 있음.
  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    const { error } = await auth.signIn(data.email, data.password);
    if (error) {
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative flex flex-col flex-1">
      {/* 배경 이미지 */}
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

      {/* 뒤로가기 버튼 */}
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

      {/* 로그인 폼 */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div
          className="w-80 p-6 flex flex-col relative"
          style={{
            borderRadius: '15px',
            background: 'rgba(0, 0, 0, 0.00)',
            boxShadow: '4px 4px 4px 0 rgba(241, 141, 251, 0.10)',
          }}
        >
          {/* Glassmorphism */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(2px)',
              border: '0.1px solid rgba(255, 255, 255, 0.1)',
            }}
          />

          <h1 className="brand-h2 font-brand text-white mb-6 relative z-10">
            로그인
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col relative z-10"
          >
            <div className="mb-6">
              <Input
                {...register('email', {
                  setValueAs: v => (v ? String(v).toLowerCase() : ''),
                })}
                type="text"
                inputMode="text"
                autoComplete="username"
                pattern="[a-z0-9_-]*"
                maxLength={20}
                label="사원 아이디"
                variant="dark"
                placeholder="아이디를 입력하세요"
                error={errors.email?.message}
              />
            </div>

            <div className="mb-6">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="비밀번호"
                variant="dark"
                placeholder="*********"
                error={errors.password?.message}
                showPasswordToggle
                showPassword={showPassword}
                onPasswordToggle={() => setShowPassword(!showPassword)}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="mb-3"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>

            <button
              type="button"
              className="flex text-white body-xs font-medium font-body underline hover:opacity-80 mb-6"
            >
              아이디/비밀번호 찾기
            </button>

            <Button
              type="button"
              variant="plain"
              fullWidth
              className="mb-6 bg-yellow-300 text-grey-900 hover:bg-yellow-400 disabled:opacity-50"
            >
              카카오톡으로 로그인
            </Button>

            <div className="flex mb-3 gap-1">
              <Image
                src="/images/icons/icon-park_white-frog.svg"
                alt="frog"
                width={24}
                height={24}
                className="flex-shrink-0"
              />
              <span className="brand-h4 font-brand text-white whitespace-nowrap">
                갓생상사의 일원이 되세요!
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => router.push('/signup')}
              className=""
            >
              입사 지원하기
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

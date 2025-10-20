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

const loginSchema = z.object({
  email: z
    .string()
    .min(1, '아이디를 입력하세요')
    .regex(/^[a-z0-9]+$/, '아이디는 영문 소문자와 숫자만 입력 가능합니다'),
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
    <>
      {/* 배경 이미지 */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/images/login-background.jpg"
          alt="login background"
          fill
          className="object-cover"
          unoptimized
          priority
        />
      </div>

      <div className="w-full flex-1 flex items-center justify-center p-4">
        <div
          className="w-80 p-6 flex flex-col relative"
          style={{
            borderRadius: '15px',
            background: 'rgba(0, 0, 0, 0.00)',
            boxShadow: '4px 4px 4px 0 rgba(241, 141, 251, 0.10)',
          }}
        >
          {/* Glassmorphism  */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(2px)',
              border: '0.1px solid rgba(255, 255, 255, 0.1)',
            }}
          />

          <h1 className="brand-h2 font-brand text-white mb-6">로그인</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
            <div className="mb-6">
              <Input
                {...register('email', {
                  setValueAs: v => (v ? String(v).toLowerCase() : ''),
                })}
                type="text"
                inputMode="text"
                autoComplete="username"
                pattern="[a-z0-9]*"
                label="사원 아이디"
                placeholder="아이디를 입력하세요"
                error={errors.email?.message}
              />
            </div>

            <div className="mb-6">
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="비밀번호"
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
    </>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { loginSchema, type LoginForm } from '@/app/login/schema';
import { loginWithUserId } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/index';

export default function LoginForm() {
  const router = useRouter();
  const [isPasswordLoginLoading, setIsPasswordLoginLoading] = useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'error' });

  const supabase = useMemo(() => createClient(), []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const getOAuthRedirectTo = () => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (siteUrl) {
      return `${siteUrl}/auth/callback`;
    }

    const origin = window.location.origin;
    const isLocalhost =
      origin.includes('localhost') || origin.includes('127.0.0.1');

    if (isLocalhost) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`;
    }

    return `${origin}/auth/callback`;
  };

  const mapAuthErrorToMessage = (code?: string, message?: string) => {
    const normalizedMessage = message?.toLowerCase() ?? '';

    if (
      code === 'invalid_credentials' ||
      normalizedMessage.includes('invalid')
    ) {
      return '아이디 또는 비밀번호가 일치하지 않습니다.';
    }

    if (
      code === 'email_not_confirmed' ||
      normalizedMessage.includes('email not confirmed')
    ) {
      return '이메일 인증이 필요합니다.';
    }

    return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
  };

  const onSubmit = async ({ userId, password }: LoginForm) => {
    setIsPasswordLoginLoading(true);
    setToast({ show: false, message: '', type: 'error' });

    try {
      const result = await loginWithUserId(userId.trim(), password);

      setToast(result.toast);

      if (!result.success || !result.session) {
        return;
      }

      const { error } = await supabase.auth.setSession(result.session);

      if (error) {
        console.error('[LoginForm] setSession error', error);
        setToast({
          show: true,
          type: 'error',
          message: mapAuthErrorToMessage(error.code, error.message),
        });
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('[LoginForm] unexpected login error', error);
      setToast({
        show: true,
        type: 'error',
        message: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsPasswordLoginLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    if (isKakaoLoading) return;

    setToast({ show: false, message: '', type: 'error' });
    setIsKakaoLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: getOAuthRedirectTo(),
        },
      });

      if (error) {
        console.error('[LoginForm] kakao OAuth error', error);
        setToast({
          show: true,
          type: 'error',
          message: '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
        });
        setIsKakaoLoading(false);
      }
    } catch (error) {
      console.error('[LoginForm] kakao OAuth unexpected error', error);
      setToast({
        show: true,
        type: 'error',
        message: '카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
      setIsKakaoLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col relative z-10"
      >
        <div className="mb-6">
          <Input
            {...register('userId', {
              setValueAs: v => (v ? String(v).toLowerCase() : ''),
            })}
            type="text"
            inputMode="text"
            autoComplete="username"
            maxLength={20}
            label="사원 아이디"
            variant="dark"
            placeholder="아이디를 입력하세요"
            error={errors.userId?.message}
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
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isPasswordLoginLoading || isKakaoLoading}
          className="mb-3"
        >
          {isPasswordLoginLoading ? '로그인 중...' : '로그인'}
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
          className="mb-6 bg-yellow-300 text-fixed-grey-900 hover:bg-yellow-400 disabled:opacity-50"
          disabled={isKakaoLoading || isPasswordLoginLoading}
          onClick={handleKakaoLogin}
        >
          {isKakaoLoading ? '카카오 로그인 중...' : '카카오톡으로 로그인'}
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
        >
          입사 지원하기
        </Button>
      </form>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}

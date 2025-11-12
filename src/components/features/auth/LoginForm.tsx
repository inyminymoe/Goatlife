'use client';
import { useEffect, useMemo, useState, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { loginAction, type LoginActionState } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/index';

const initialState: LoginActionState = { ok: true };

export default function LoginForm() {
  const router = useRouter();
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'error' });

  const supabase = useMemo(() => createClient(), []);
  const [actionState, formAction] = useActionState(loginAction, initialState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: '소셜 로그인에 실패했습니다. 다시 시도해주세요.',
        missing_code: '인증 코드가 누락되었습니다.',
        session_exchange_failed: '세션 생성에 실패했습니다. 다시 시도해주세요.',
      };

      setToast({
        show: true,
        type: 'error',
        message: errorMessages[error] || '로그인에 실패했습니다.',
      });

      window.history.replaceState({}, '', '/login');
    }
  }, []);

  useEffect(() => {
    if (!actionState.ok && actionState.message) {
      setToast({
        show: true,
        type: 'error',
        message: actionState.message,
      });
    }
  }, [actionState]);

  const getOAuthRedirectTo = () => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin.replace(/\/$/, '');

      if (/localhost(:\d+)?$/.test(window.location.host)) {
        return `${origin}/auth/callback`;
      }

      const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
      return `${site || origin}/auth/callback`;
    }

    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    return site ? `${site}/auth/callback` : undefined;
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
      <form action={formAction} className="flex flex-col relative z-10">
        <div className="mb-6">
          <Input
            name="userId"
            type="text"
            inputMode="text"
            autoComplete="username"
            maxLength={20}
            label="사원 아이디"
            variant="dark"
            placeholder="아이디를 입력하세요"
            required
          />
        </div>

        <div className="mb-6">
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="비밀번호"
            variant="dark"
            placeholder="*********"
            showPasswordToggle
            showPassword={showPassword}
            onPasswordToggle={() => setShowPassword(prev => !prev)}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>

        <SubmitButton isKakaoLoading={isKakaoLoading} />

        <button
          type="button"
          className="flex text-white body-xs font-medium font-body underline hover:opacity-80 mb-6"
        >
          아이디/비밀번호 찾기
        </button>

        <KakaoButton
          onClick={handleKakaoLogin}
          isKakaoLoading={isKakaoLoading}
        />

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

function SubmitButton({ isKakaoLoading }: { isKakaoLoading: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="primary"
      fullWidth
      disabled={pending || isKakaoLoading}
      className="mb-3"
    >
      {pending ? '로그인 중...' : '로그인'}
    </Button>
  );
}

function KakaoButton({
  onClick,
  isKakaoLoading,
}: {
  onClick: () => void;
  isKakaoLoading: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="button"
      variant="plain"
      fullWidth
      className="mb-6 bg-yellow-300 text-fixed-grey-900 hover:bg-yellow-400 disabled:opacity-50"
      disabled={pending || isKakaoLoading}
      onClick={onClick}
      data-testid="kakao-login-button"
    >
      {isKakaoLoading ? '카카오 로그인 중...' : '카카오톡으로 로그인'}
    </Button>
  );
}

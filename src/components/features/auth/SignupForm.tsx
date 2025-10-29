'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import TextArea from '@/components/ui/TextArea';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import Toast from '@/components/ui/Toast';
import Checkbox from '@/components/ui/Checkbox';
import { signupSchema, type SignupFormValues } from '@/app/signup/schema';
import { createUser } from '@/app/signup/actions';

export default function SignupForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, message: '', type: 'success' });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      department: 'IT부',
      workHours: '주간(09:00-18:00)',
      workType: '풀타임',
      consent: false,
    },
  });
  const workStyle = watch('workStyle') ?? '';
  const consent = watch('consent');
  const consentErrorRaw = errors.consent?.message;
  const consentError = consentErrorRaw?.toLowerCase().includes('expected true')
    ? '개인정보 수집·이용에 동의해야 가입이 가능합니다.'
    : consentErrorRaw;

  const onSubmit = handleSubmit(async data => {
    if (!data.consent) {
      setToast({
        show: true,
        type: 'error',
        message: '개인정보 수집·이용에 동의해야 가입할 수 있어요.',
      });
      return;
    }

    setIsLoading(true);
    setToast({ show: false, message: '', type: 'success' });

    // 호출 전/후 로그로 흐름 보이게
    console.log('[signup] submitting form…', {
      userId: data.userId,
      email: data.email,
    });

    try {
      const res = await createUser(data);
      console.log('[signup] server action returned:', res);

      if (!res.success) {
        console.error('[signup] client received error:', res.error);
        setToast({
          show: true,
          type: 'error',
          message: res.error ?? '회원가입에 실패했습니다.',
        });
        return;
      }

      setToast({
        show: true,
        type: 'success',
        message: '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.',
      });
      setTimeout(() => router.push('/login'), 2000);
    } catch (e) {
      console.error('[signup] client catch:', e);
      setToast({
        show: true,
        type: 'error',
        message: '요청 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <>
      <div className="bg-grey-100 rounded-[5px] p-6 md:p-8 w-full">
        {/* 타이틀 */}
        <div className="flex items-center gap-1 mb-6">
          <Image
            src="/images/icons/icon-park_white-frog.svg"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <h2 className="brand-h3 font-brand text-dark">입사 지원서</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* 프로필 사진 */}
          <ImageUpload
            value={watch('avatarUrl')}
            onChange={(url: string) => setValue('avatarUrl', url)}
          />

          {/* 사원명 */}
          <div className="space-y-2">
            <h4 className="brand-h4 font-brand text-dark">사원명</h4>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <Input
                {...register('lastName')}
                label="성 (필수)"
                placeholder="갓"
                maxLength={5}
                error={errors.lastName?.message}
              />
              <Input
                {...register('firstName')}
                label="이름 (선택)"
                placeholder="생이"
                maxLength={5}
                error={errors.firstName?.message}
              />
              <div className="flex flex-col gap-2 min-w-[80px]">
                <label className="body-sm font-medium text-dark">직급</label>
                <div className="px-3 py-2 bg-grey-200 rounded-[5px] flex items-center justify-center h-10">
                  <span className="body-sm text-grey-500 font-semibold">
                    인턴
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 사원 ID */}
          <Input
            {...register('userId', {
              setValueAs: v => (v ? String(v).toLowerCase() : ''),
            })}
            label="사원 ID"
            placeholder="아이디를 입력하세요"
            maxLength={20}
            error={errors.userId?.message}
          />

          {/* 사원 이메일 */}
          <Input
            {...register('email')}
            label="사원 이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            error={errors.email?.message}
          />

          {/* 비밀번호 */}
          <Input
            {...register('password')}
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="*********"
            error={errors.password?.message}
            showPasswordToggle
            showPassword={showPassword}
            onPasswordToggle={() => setShowPassword(!showPassword)}
          />

          {/* 소속 부서 */}
          <Select
            label="소속 부서"
            value={watch('department')}
            onChange={(val: string) =>
              setValue(
                'department',
                val as
                  | 'IT부'
                  | '공시부'
                  | '취업부'
                  | '자격부'
                  | '창작부'
                  | '글로벌부'
              )
            }
            options={[
              { value: 'IT부', label: 'IT부' },
              { value: '공시부', label: '공시부' },
              { value: '취업부', label: '취업부' },
              { value: '자격부', label: '자격부' },
              { value: '창작부', label: '창작부' },
              { value: '글로벌부', label: '글로벌부' },
            ]}
          />

          {/* 근무시간 */}
          <Select
            label="근무시간"
            value={watch('workHours')}
            onChange={(val: string) =>
              setValue(
                'workHours',
                val as
                  | '주간(09:00-18:00)'
                  | '오후(17:00-01:00)'
                  | '야간(22:00-06:00)'
              )
            }
            options={[
              { value: '주간(09:00-18:00)', label: '🐰 주간 (09:00 - 18:00)' },
              { value: '오후(17:00-01:00)', label: '🐱 오후 (17:00 - 01:00)' },
              { value: '야간(22:00-06:00)', label: '🐹 야간 (22:00 - 06:00)' },
            ]}
          />

          {/* 근무형태 */}
          <Select
            label="근무형태"
            value={watch('workType')}
            onChange={(val: string) =>
              setValue('workType', val as '풀타임' | '파트타임')
            }
            options={[
              { value: '풀타임', label: '풀타임 (8시간)' },
              { value: '파트타임', label: '파트타임 (8시간 미만)' },
            ]}
          />

          {/* 업무스타일 */}
          <Input
            label="나의 업무스타일"
            mode="withButton"
            displayText={workStyle || '업무유형 테스트 결과가 없습니다'}
            buttonLabel="TEST"
            onButtonClick={() => alert('심리테스트 준비 중!')}
          />

          {/* 입사 각오 */}
          <div className="space-y-2">
            <TextArea
              {...register('workEthic')}
              label="입사 각오 한 마디"
              placeholder={`예시\n· 세상에서 가장 해로운 벌레는 대충🐛`}
              rows={4}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <h4 className="brand-h4 font-brand text-dark">약관 동의</h4>
            <div className="rounded-[5px] bg-grey-100 dark:bg-grey-900/40 border border-grey-200 dark:border-grey-700 p-3 space-y-3">
              <div className="max-h-36 overflow-auto pr-1 body-sm text-grey-800 dark:text-grey-100/90">
                <p className="mb-2">
                  회원가입을 위해{' '}
                  <a href="/privacy" className="underline">
                    개인정보 처리방침
                  </a>{' '}
                  및{' '}
                  <a href="/terms" className="underline">
                    이용약관
                  </a>
                  에 동의해 주세요.
                </p>
              </div>
              <div>
                <Checkbox
                  checked={!!consent}
                  onChange={next =>
                    setValue('consent', next, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  label="개인정보 수집·이용에 동의합니다 (필수)"
                />
                {consentError && (
                  <p
                    className="mt-1 body-xs font-medium"
                    style={{ color: 'hsl(296, 94%, 77%)' }}
                  >
                    {consentError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading || !consent}
          >
            {isLoading ? '저장 중...' : '입사 지원하기'}
          </Button>
        </form>
      </div>

      {/* Toast 알림 */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}

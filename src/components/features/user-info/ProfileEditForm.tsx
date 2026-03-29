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
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from '@/app/user-info/schema';
import { updateUserProfile, uploadProfileImage } from '@/app/user-info/actions';

interface ProfileEditFormProps {
  defaultValues: ProfileEditFormValues;
  userId: string;
  email: string;
  rank: string;
}

export default function ProfileEditForm({
  defaultValues,
  userId,
  email,
  rank,
}: ProfileEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
  } = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues,
  });

  const workStyle = watch('workStyle') ?? '';

  const onSubmit = handleSubmit(async data => {
    setIsLoading(true);
    setToast({ show: false, message: '', type: 'success' });

    try {
      const result = await updateUserProfile(data);

      if (!result.ok) {
        setToast({ show: true, type: 'error', message: result.error });
        return;
      }

      setToast({ show: true, type: 'success', message: '저장되었습니다.' });
      router.refresh();
    } catch {
      setToast({
        show: true,
        type: 'error',
        message: '저장 중 오류가 발생했습니다.',
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
          <h2 className="brand-h3 font-brand text-dark">사원정보 설정</h2>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* 프로필 사진 */}
          <ImageUpload
            value={watch('avatarUrl')}
            onChange={(url: string) => setValue('avatarUrl', url)}
            onUploadingChange={setIsUploading}
            disabled={isLoading}
            uploadAction={async file => {
              const formData = new FormData();
              formData.append('file', file);
              return uploadProfileImage(formData);
            }}
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
                    {rank}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 사원 ID (읽기 전용) */}
          <Input
            label="사원 ID"
            value={userId}
            readOnly
            disabled
            className="disabled:opacity-40"
          />

          {/* 사원 이메일 (읽기 전용) */}
          <Input
            label="사원 이메일"
            type="email"
            value={email}
            readOnly
            disabled
            className="disabled:opacity-40"
          />

          {/* 소속 부서 */}
          <Select
            label="소속 부서"
            value={watch('department')}
            onChange={(val: string) =>
              setValue('department', val as ProfileEditFormValues['department'])
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
              setValue('workHours', val as ProfileEditFormValues['workHours'])
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
              setValue('workType', val as ProfileEditFormValues['workType'])
            }
            options={[
              { value: '풀타임', label: '풀타임 (8시간)' },
              { value: '파트타임', label: '파트타임 (8시간 미만)' },
            ]}
          />

          {/* 주당 근무일 */}
          <Select
            label="주당 근무일수"
            value={String(watch('workDaysPerWeek'))}
            onChange={(val: string) => setValue('workDaysPerWeek', Number(val))}
            options={[
              { value: '1', label: '주 1일' },
              { value: '2', label: '주 2일' },
              { value: '3', label: '주 3일' },
              { value: '4', label: '주 4일' },
              { value: '5', label: '주 5일 (평일)' },
              { value: '6', label: '주 6일' },
              { value: '7', label: '주 7일 (매일)' },
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

          {/* 저장 버튼 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading || isUploading}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </Button>
        </form>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </>
  );
}

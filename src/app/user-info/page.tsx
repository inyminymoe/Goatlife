'use client';

import UserInfoView from '@/components/shared/UserInfoView';
import { useUserInfo } from '@/hooks/useUserInfo';

export default function UserInfoPage() {
  const { status, summary, error } = useUserInfo({ mode: 'full' });

  return (
    <div className="col-span-2">
      <div className="mx-auto max-w-[1440px]">
        <UserInfoView
          status={status}
          summary={summary}
          error={error}
          mode="full"
        />
      </div>
    </div>
  );
}

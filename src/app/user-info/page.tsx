'use client';

import UserInfoView from '@/components/shared/UserInfoView';
import { useUserInfo } from '@/hooks/useUserInfo';

export default function UserInfoPage() {
  const { status, summary, error } = useUserInfo({ mode: 'full' });

  return (
    <main className="app-container py-8">
      <UserInfoView
        status={status}
        summary={summary}
        error={error}
        mode="full"
      />
    </main>
  );
}

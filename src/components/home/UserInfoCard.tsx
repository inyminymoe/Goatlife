'use client';

import UserInfoView from '@/components/shared/UserInfoView';
import { useUserInfo } from '@/hooks/useUserInfo';

export default function UserInfoCard() {
  const { status, summary, error, mode } = useUserInfo({
    mode: 'compact',
  });

  return (
    <UserInfoView status={status} summary={summary} error={error} mode={mode} />
  );
}

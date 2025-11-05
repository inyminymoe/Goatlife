'use client';

import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Icon } from '@iconify/react';
import type { UserSummary } from '@/app/_actions/userInfo';
import type { UserInfoError, UserInfoStatus } from '@/hooks/useUserInfo';
import { useMemo } from 'react';

export type UserInfoViewMode = 'compact' | 'full';

interface UserInfoViewProps {
  status: UserInfoStatus;
  summary: UserSummary | null;
  error: UserInfoError | null;
  mode?: UserInfoViewMode;
}

const placeholderSummary = (message: string): UserSummary => ({
  displayName: message,
  userId: '--',
  rank: null,
  department: null,
  workHours: null,
  workType: null,
  avatarUrl: null,
  joinedDays: 0,
  performanceRate: 0,
});

function errorToPlaceholder(error: UserInfoError | null) {
  switch (error) {
    case 'UNAUTHENTICATED':
      return placeholderSummary('로그인이 필요해요');
    case 'NOT_FOUND':
      return placeholderSummary('사원 정보를 찾을 수 없어요');
    case 'UNKNOWN':
    default:
      return placeholderSummary('정보를 불러오지 못했어요');
  }
}

function Skeleton() {
  return (
    <section
      className="bg-grey-100 rounded-[5px] p-6"
      aria-labelledby="userinfo-title"
    >
      <div className="flex items-end gap-1">
        <div className="w-6 h-6 rounded bg-grey-300 animate-pulse" />
        <div className="h-6 w-28 rounded bg-grey-300 animate-pulse" />
      </div>

      <div className="mt-4 grid grid-cols-[80px_1fr] gap-4 items-start">
        <div className="w-20 h-20 rounded-full bg-grey-200 animate-pulse" />
        <div className="flex flex-col gap-3 min-w-0">
          <div className="h-6 w-40 rounded bg-grey-200 animate-pulse" />
          <div className="h-4 w-24 rounded bg-grey-200 animate-pulse" />
          <div className="grid grid-cols-2 gap-x-10 gap-y-3">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-16 rounded bg-grey-200 animate-pulse" />
              <div className="h-6 w-16 rounded bg-grey-200 animate-pulse" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-4 w-16 rounded bg-grey-200 animate-pulse" />
              <div className="h-6 w-16 rounded bg-grey-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function UserInfoView({
  status,
  summary,
  error,
  mode = 'compact',
}: UserInfoViewProps) {
  const resolvedSummary = useMemo(() => {
    if (summary) return summary;
    return errorToPlaceholder(error);
  }, [summary, error]);

  const userIdLabel = useMemo(() => {
    const userId = resolvedSummary.userId?.trim?.() ?? '';
    if (!userId) return '@--';
    return userId.startsWith('@') ? userId : `@${userId}`;
  }, [resolvedSummary.userId]);

  const joinedDays = Math.max(0, resolvedSummary.joinedDays);
  const performanceRate = Math.round(
    Math.max(0, resolvedSummary.performanceRate)
  );

  if (status === 'loading') {
    return <Skeleton />;
  }

  return (
    <section
      className="bg-grey-100 rounded-[5px] p-6"
      aria-labelledby="userinfo-title"
      data-mode={mode}
    >
      <div className="flex items-end gap-1">
        <Icon
          icon="icon-park:necktie"
          className="w-6 h-6 text-grey-900"
          aria-hidden="true"
        />
        <h2 id="userinfo-title" className="brand-h3 text-grey-900">
          사원 정보
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-[88px_1fr] gap-4 md:gap-4 items-start">
        <Avatar
          src={resolvedSummary.avatarUrl ?? undefined}
          name={`${resolvedSummary.displayName} 아바타`}
          size="lg"
          showName={false}
        />

        <div className="flex flex-col min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="body-base font-semibold text-grey-900">
              {resolvedSummary.displayName}
            </span>
            {resolvedSummary.rank && (
              <span className="body-base font-semibold text-grey-900">
                {resolvedSummary.rank}
              </span>
            )}
            {resolvedSummary.department && (
              <span className="body-sm text-grey-500">
                {resolvedSummary.department}
              </span>
            )}
            {resolvedSummary.workHours && (
              <Badge
                variant="white"
                size="xs"
                className="ml-0.5"
                aria-label={`근무시간: ${resolvedSummary.workHours}`}
              >
                {resolvedSummary.workHours.split('(')[0].trim()}
              </Badge>
            )}
            {resolvedSummary.workType && (
              <Badge
                variant="blackRounded"
                size="xs"
                className="ml-0.5"
                aria-label={`근무 형태: ${resolvedSummary.workType}`}
              >
                {resolvedSummary.workType}
              </Badge>
            )}
          </div>

          <div className="body-sm text-grey-300 truncate">{userIdLabel}</div>

          <div className="mt-2 grid grid-cols-2 gap-x-9 md:gap-x-14 gap-y-3 items-start">
            <div className="flex flex-col gap-1">
              <span className="body-sm font-semibold text-grey-300">입사</span>
              <div className="flex items-end gap-1">
                <span className="brand-h1 text-primary-500 tabular-nums">
                  {joinedDays}
                </span>
                <span className="body-xs text-grey-500">일차</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="body-sm font-semibold text-grey-300">
                업무성과
              </span>
              <div className="flex items-end gap-1">
                <span className="brand-h1 text-primary-500 tabular-nums">
                  {performanceRate}
                </span>
                <span className="body-xs text-grey-500">% 달성</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

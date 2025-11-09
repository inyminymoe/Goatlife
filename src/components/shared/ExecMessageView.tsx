'use client';

import Avatar from '@/components/ui/Avatar';
import { Icon } from '@iconify/react';
import type { ExecMessage } from '@/app/_actions/execMessage';
import type { ExecMessageLifecycle } from '@/hooks/useExecMessage';

interface ExecMessageViewProps {
  lifecycle: ExecMessageLifecycle;
  data: ExecMessage | null;
  error?: string | null;
  mode?: 'compact' | 'full';
}

function Skeleton() {
  return (
    <div className="grid grid-cols-[64px_1fr] md:grid-cols-[80px_1fr] gap-2 md:gap-2">
      <div className="size-16 md:size-20 rounded-full bg-grey-300 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 w-28 bg-grey-300 rounded animate-pulse" />
        <div className="h-3 w-16 bg-grey-200 rounded animate-pulse" />
        <div className="h-20 bg-white rounded-[5px] shadow animate-pulse" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="body-sm text-grey-500">{message}</p>;
}

export default function ExecMessageView({
  lifecycle,
  data,
  error,
  mode = 'compact',
}: ExecMessageViewProps) {
  const badgeText = data ? (data.isExplicit ? '공지' : '명언') : null;

  return (
    <section
      className="bg-grey-100 rounded-[5px] p-6"
      aria-labelledby="exec-message-title"
    >
      <div className="flex items-end gap-1 mb-4">
        <Icon
          icon="icon-park:relieved-face"
          className="w-6 h-6 text-primary-500"
          aria-hidden="true"
        />
        <h2 id="exec-message-title" className="brand-h3 text-grey-900">
          임원진 한마디
        </h2>
      </div>

      {lifecycle === 'loading' && <Skeleton />}

      {lifecycle === 'error' && (
        <EmptyState
          message={
            error === 'NO_MESSAGE'
              ? '등록된 메시지가 없습니다.'
              : '메시지를 불러오지 못했어요.'
          }
        />
      )}

      {lifecycle === 'success' && !data && (
        <EmptyState message="등록된 메시지가 없습니다." />
      )}

      {lifecycle === 'success' && data && (
        <div className="grid grid-cols-[64px_1fr] md:grid-cols-[60px_1fr] gap-3 md:gap-3 items-start">
          <div className="flex flex-col items-center text-center md:text-center justify-self-start">
            <Avatar
              src={data.avatarUrl ?? undefined}
              name={`${data.authorName ?? '임원'} 아바타`}
              size={mode === 'full' ? 'lg' : 'md'}
              showName={false}
            />
            <div className="mt-2">
              <div className="body-sm font-medium text-grey-900">
                {data.authorName ?? '임원'}
              </div>
              {data.authorTitle && (
                <div className="body-xs text-grey-500">{data.authorTitle}</div>
              )}
            </div>
          </div>

          <div className="relative bg-white rounded-[5px] shadow-md md:shadow-md drop-shadow-[4px_4px_8px_rgba(0,0,0,0.05)] p-4 md:p-5 before:content-[''] before:absolute before:left-[-8px] before:top-6 before:border-y-[8px] before:border-y-transparent before:border-r-[8px] before:border-r-white">
            <p className="body-sm text-fixed-grey-900 whitespace-pre-line break-words">
              {data.message}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

'use client';
import Image from 'next/image';
import { Icon } from '@iconify/react';

interface AvatarProps {
  src?: string | null;
  lastName?: string;
  rank?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export default function Avatar({
  src,
  lastName,
  rank,
  size = 'sm',
  showName = true,
  className = '',
}: AvatarProps) {
  const SIZES = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  };

  const sizeClass = SIZES[size];

  return (
    <div className={`ui-component flex items-center gap-2 ${className}`}>
      {/* 아바타 이미지 */}
      <div
        className={`${sizeClass} rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        {src ? (
          <Image
            src={src}
            alt={lastName || '프로필'}
            width={size === 'lg' ? 96 : size === 'md' ? 48 : 32}
            height={size === 'lg' ? 96 : size === 'md' ? 48 : 32}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon
            icon="icon-park:user-business"
            width={size === 'lg' ? 80 : size === 'md' ? 40 : 24}
            height={size === 'lg' ? 80 : size === 'md' ? 40 : 24}
            className="text-primary-500"
          />
        )}
      </div>

      {/* 닉네임 (Desktop만) */}
      {showName && (lastName || rank) && (
        <span className="hidden lg:block body-sm font-medium text-grey-900">
          {lastName}
          {rank ? ` ${rank}` : ''}
        </span>
      )}
    </div>
  );
}

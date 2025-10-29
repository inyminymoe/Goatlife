'use client';
import Image from 'next/image';
import { Icon } from '@iconify/react';

interface AvatarProps {
  src?: string | null;
  name?: string;
  rank?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export default function Avatar({
  src,
  name,
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
  const displayName = name?.trim() || '게스트';
  const displayRank = rank?.trim() || '인턴';
  const showLabel = showName && (displayName || displayRank);

  return (
    <div className={`ui-component flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClass} rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        {src ? (
          <Image
            src={src}
            alt={displayName}
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

      {showLabel && (
        <span className="hidden lg:block body-sm font-medium text-grey-900">
          {displayName}
          {displayRank ? ` ${displayRank}` : ''}
        </span>
      )}
    </div>
  );
}

import Image from 'next/image';

interface IconLogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'ko' | 'en';
  isDarkMode?: boolean;
}

export default function IconLogo({
  className = '',
  width = 100,
  height = 36,
  variant = 'ko',
  isDarkMode = false,
}: IconLogoProps) {
  const getLogoSrc = () => {
    if (variant === 'ko') return '/images/logo-ko.svg';
    return isDarkMode ? '/images/logo-en-white.svg' : '/images/logo-en.svg';
  };

  return (
    <Image
      src={getLogoSrc()}
      alt={variant === 'ko' ? '갓생상사' : 'GOATLIFE'}
      width={width}
      height={height}
      className={className}
    />
  );
}

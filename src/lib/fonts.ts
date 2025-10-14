import localFont from 'next/font/local';

export const brandFont = localFont({
  src: '../assets/fonts/DNFBitBitv2.woff2',
  variable: '--font-brand',
  weight: '400',
  display: 'swap',
});

export const bodyFont = localFont({
  src: [
    {
      path: '../assets/fonts/SCoreDream-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SCoreDream-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/SCoreDream-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
});

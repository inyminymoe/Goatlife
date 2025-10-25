'use client';
import { useState, useEffect } from 'react';
import { brandFont } from '@/lib/fonts';
import IconClover from '../ui/icons/IconClover';

const messages = [
  '나의 값진 시간을 팝니다. 갓생상사.',
  '24시간 신입 사원 절찬 모집중',
  '대충 시작부터 하는 성장캐 구합니다',
];

export default function TopBanner() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`w-full bg-[hsl(0_0%_21%)] flex items-center justify-center gap-2 px-4 py-1.5 md:px-8 lg:px-16 text-white ${brandFont.className}`}
    >
      <IconClover
        className="w-4 h-4 flex-shrink-0 transition-transform duration-700 hover:scale-110"
        size={16}
      />
      <span className="text-center text-14 md:text-14 lg:text-16 min-h-[1.2em] transition-all duration-700">
        {messages[currentMessage]}
      </span>
      <IconClover
        className="w-4 h-4 flex-shrink-0 transition-transform duration-700 hover:scale-110"
        size={16}
      />
    </div>
  );
}

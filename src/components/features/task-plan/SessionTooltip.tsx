'use client';

import { cn } from '@/lib/utils';
import { PomodoroSession } from '@/types/pomodoro';

export type TooltipAlign = 'left' | 'center' | 'right';

export function getTooltipAlign(index: number, total: number): TooltipAlign {
  if (index <= 1) return 'left';
  if (index >= total - 2) return 'right';
  return 'center';
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const CLIP_PATHS: Record<TooltipAlign, string> = {
  left: "path('M8 7 L14 7 C16 7 17.5 4.5 18.5 2.5 C19.3 1 20.7 1 21.5 2.5 C22.5 4.5 24 7 26 7 L66 7 C70.4 7 74 10.6 74 15 L74 34 C74 38.4 70.4 42 66 42 L8 42 C3.6 42 0 38.4 0 34 L0 15 C0 10.6 3.6 7 8 7 Z')",
  center:
    "path('M8 7 L31 7 C33 7 34.5 4.5 35.5 2.5 C36.3 1 37.7 1 38.5 2.5 C39.5 4.5 41 7 43 7 L66 7 C70.4 7 74 10.6 74 15 L74 34 C74 38.4 70.4 42 66 42 L8 42 C3.6 42 0 38.4 0 34 L0 15 C0 10.6 3.6 7 8 7 Z')",
  right:
    "path('M8 7 L48 7 C50 7 51.5 4.5 52.5 2.5 C53.3 1 54.7 1 55.5 2.5 C56.5 4.5 58 7 60 7 L66 7 C70.4 7 74 10.6 74 15 L74 34 C74 38.4 70.4 42 66 42 L8 42 C3.6 42 0 38.4 0 34 L0 15 C0 10.6 3.6 7 8 7 Z')",
};

interface SessionTooltipProps {
  session: PomodoroSession;
  align: TooltipAlign;
}

export default function SessionTooltip({
  session,
  align,
}: SessionTooltipProps) {
  const svgPathData = CLIP_PATHS[align].replace(/^path\('(.+)'\)$/, '$1');

  return (
    <div
      className={cn(
        'absolute top-full mt-1 z-30 pointer-events-none',
        align === 'left' && 'left-0',
        align === 'center' && 'left-1/2 -translate-x-1/2',
        align === 'right' && 'right-0'
      )}
      style={{ filter: 'drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35))' }}
    >
      <div className="relative w-[74px] h-[42px]">
        <div
          className="absolute inset-0"
          style={{
            clipPath: CLIP_PATHS[align],
            backdropFilter: 'blur(25px) saturate(250%) brightness(110%)',
            WebkitBackdropFilter: 'blur(25px) saturate(250%) brightness(110%)',
            background: 'rgba(25, 25, 25, 0.3)',
          }}
        />
        <svg
          width="74"
          height="42"
          viewBox="0 0 74 42"
          className="absolute inset-0 overflow-visible"
        >
          <defs>
            <linearGradient
              id="glass-edge-bottom"
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="30%" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
          <path
            d={svgPathData}
            fill="none"
            stroke="url(#glass-edge-bottom)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute left-1/2 -translate-x-1/2 top-[25px] -translate-y-1/2 text-white text-[13px] font-semibold tracking-tight z-10">
          {formatDuration(session.durationSeconds)}
        </span>
      </div>
    </div>
  );
}

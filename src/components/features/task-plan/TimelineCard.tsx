'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { PomodoroSession } from '@/types/pomodoro';
import SessionTooltip, {
  TooltipAlign,
  getTooltipAlign,
} from './SessionTooltip';

const ITEMS_PER_ROW = 10;
const ROWS_PER_PAGE = 3;
const ICON_SIZE = 32;
const ICON_GAP = 19;

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/* ── Session icons ── */

function BlueTomatoIcon() {
  return (
    <Icon
      icon="icon-park:tomato"
      className="w-8 h-8 shrink-0"
      aria-hidden="true"
    />
  );
}

function GreenTomatoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="31"
      viewBox="0 0 30 31"
      fill="none"
      className="w-8 h-8 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M15 28.4165C21.9036 28.4165 27.5 23.6456 27.5 17.7603C27.5 13.5998 24.7033 10.1404 20.625 8.3855L18.4375 9.36445L18.75 12.9165L14.6875 11.6249L10.625 12.9165V9.36445L8.75 8.3855C5.01374 10.228 2.5 13.816 2.5 17.7603C2.5 23.6456 8.09644 28.4165 15 28.4165Z"
        fill="#2FFFD5"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.6875 2.58325L17.068 5.8878L22.5 6.40002L18.5392 9.35372L19.6875 13.5624L14.6875 11.6249L9.6875 13.5624L10.8357 9.35372L6.875 6.40002L12.3069 5.8878L14.6875 2.58325Z"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="31"
      height="31"
      viewBox="0 0 31 31"
      fill="none"
      className="w-8 h-8 shrink-0"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.29199 12.9167C1.29199 20.7638 5.16699 27.1251 12.917 27.1251C20.667 27.1251 24.542 20.7638 24.542 12.9167H1.29199Z"
        fill="white"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.917 9.04167V3.875"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.375 9.04159V6.45825"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.45898 9.04159V6.45825"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.373 19.7772C24.0123 18.1084 24.3893 16.2345 24.5041 14.2413C24.727 14.2195 24.9552 14.2083 25.1876 14.2083C27.6844 14.2083 29.7084 15.5094 29.7084 17.1145C29.7084 18.7196 27.6844 20.0208 25.1876 20.0208C24.5422 20.0208 23.9285 19.9338 23.373 19.7772Z"
        stroke="black"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Dashed line ── */

function DashedLine({ count }: { count: number }) {
  const width = count * ICON_SIZE + (count - 1) * ICON_GAP;
  return (
    <svg
      className="absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none overflow-visible"
      width={width}
      height="2"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="1"
        x2={width}
        y2="1"
        stroke="var(--color-grey-300)"
        strokeWidth="2"
        strokeDasharray="0.1 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Session icon with tooltip ── */

interface SessionIconProps {
  session: PomodoroSession;
  align: TooltipAlign;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}

function SessionIcon({
  session,
  align,
  isSelected,
  onSelect,
}: SessionIconProps) {
  return (
    <div className="relative animate-session-pop">
      <button
        type="button"
        className="block cursor-pointer"
        onClick={() => onSelect(isSelected ? null : session.id)}
        aria-label="세션 상세 보기"
        aria-expanded={isSelected}
      >
        {session.status === 'focus-done' && <BlueTomatoIcon />}
        {session.status === 'focus-incomplete' && <GreenTomatoIcon />}
        {session.status === 'break' && <CoffeeIcon />}
      </button>
      {isSelected && <SessionTooltip session={session} align={align} />}
    </div>
  );
}

/* ── Timeline row ── */

interface TimelineRowProps {
  sessions: PomodoroSession[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function TimelineRow({ sessions, selectedId, onSelect }: TimelineRowProps) {
  return (
    <div className="relative w-full flex items-center gap-[19px] min-h-[32px]">
      <DashedLine count={sessions.length} />
      {sessions.map((session, index) => (
        <SessionIcon
          key={session.id}
          session={session}
          align={getTooltipAlign(index, sessions.length)}
          isSelected={selectedId === session.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* ── Dot Pager ── */

interface DotPagerProps {
  total: number;
  current: number;
  onChange: (index: number) => void;
}

function DotPager({ total, current, onChange }: DotPagerProps) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i + 1}페이지로 이동`}
          onClick={() => onChange(i)}
          className={
            i === current
              ? 'w-2 h-2 rounded-full bg-grey-700 transition-all'
              : 'w-2 h-2 rounded-full bg-grey-300 transition-all hover:bg-grey-500'
          }
        />
      ))}
    </div>
  );
}

/* ── TimelineCard ── */

interface TimelineCardProps {
  sessions: PomodoroSession[];
}

export default function TimelineCard({ sessions }: TimelineCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const rows = chunk(sessions, ITEMS_PER_ROW);

  const pages = chunk(rows, ROWS_PER_PAGE);
  const totalPages = pages.length;
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));

  // 새 페이지가 생기면 자동으로 마지막 페이지로 이동
  useEffect(() => {
    if (totalPages > 0) setCurrentPage(totalPages - 1);
  }, [totalPages]);

  const handlePageChange = (index: number) => {
    setSelectedId(null);
    setCurrentPage(index);
  };

  return (
    <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-4 min-h-[224px]">
      <div className="flex items-end gap-1">
        <Icon
          icon="icon-park:mark"
          className="w-6 h-6 icon-dark-invert"
          aria-hidden="true"
        />
        <h2 className="brand-h3 text-grey-700">Timeline</h2>
      </div>

      {sessions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="body-sm text-grey-500">
            타이머를 시작하면 기록이 쌓여요
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-[19px]">
            {pages[safePage].map((row, i) => (
              <TimelineRow
                key={`${safePage}-${i}`}
                sessions={row}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ))}
          </div>
          <DotPager
            total={totalPages}
            current={safePage}
            onChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}

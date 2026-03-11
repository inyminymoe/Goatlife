'use client';

import { useState } from 'react';
import PomodoroTimerCard from './PomodoroTimerCard';
import TimelineCard from './TimelineCard';
import { PomodoroSession } from '@/types/pomodoro';

export default function WorkPlanTimerSection() {
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  const addSession = (
    status: PomodoroSession['status'],
    durationSeconds: number
  ) => {
    setSessions(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        status,
        durationSeconds,
        startedAt: new Date(),
      },
    ]);
  };

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <PomodoroTimerCard
        onFocusDone={d => addSession('focus-done', d)}
        onFocusFail={d => addSession('focus-incomplete', d)}
        onBreakStart={d => addSession('break', d)}
      />
      <TimelineCard sessions={sessions} />
    </section>
  );
}

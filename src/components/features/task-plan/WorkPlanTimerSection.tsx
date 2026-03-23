'use client';

import { useCallback, useEffect, useRef } from 'react';
import { overlay } from 'overlay-kit';

// 같은 dispatch를 여러 리스너가 처리하는 경우를 막는 모듈 레벨 중복 방지 변수
// (React StrictMode 재마운트나 HMR 후 잔존 리스너 대응)
let _lastHandledEventTimestamp = -1;
import TimerCard from './TimerCard';
import TimelineCard from './TimelineCard';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import { useSessionOrchestrator } from './hooks/useSessionOrchestrator';
import {
  ROUTINE_TIMER_START_EVENT,
  RoutineTimerStartDetail,
} from './routineStartEvent';
import { useToast } from '@/providers/ToastProvider';

type PendingStart =
  | { type: 'manual'; routine: { id: string; title: string } }
  | { type: 'routine'; routines: { id: string; title: string }[] };

export default function WorkPlanTimerSection() {
  const toast = useToast();

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning') => {
      toast[type](message);
    },
    [toast]
  );

  const {
    timerMode,
    isRunning,
    remainingSeconds,
    totalFocusSeconds,
    focusPresetMinutes,
    breakPresetMinutes,
    sessionMode,
    activeRoutine,
    nextRoutineName,
    records,
    startManual,
    startRoutine,
    handleToggleRunning,
    handleSkip,
    handleReset,
    handleEnd,
    handleSaveSettings,
  } = useSessionOrchestrator({
    initialFocusMinutes: 1,
    initialBreakMinutes: 1,
    onToast: showToast,
  });

  // sessionMode를 ref로 관리: useEffect deps에 넣으면 세션 전환 시마다
  // 리스너가 해제/재등록되어 이벤트가 이중으로 처리될 수 있음
  const sessionModeRef = useRef(sessionMode);
  sessionModeRef.current = sessionMode;

  // 확인 바텀시트가 이미 열려 있으면 중복 open 방지
  const isConfirmOverlayOpenRef = useRef(false);

  // handleEnd 호출 시 ref를 즉시 'idle'로 업데이트 (re-render 전에도 반영)
  const wrappedHandleEnd = useCallback(() => {
    sessionModeRef.current = 'idle';
    handleEnd();
  }, [handleEnd]);

  const applyPendingStart = useCallback(
    (pending: PendingStart) => {
      if (pending.type === 'manual') {
        startManual(pending.routine);
      } else {
        startRoutine(pending.routines);
      }
    },
    [startManual, startRoutine]
  );

  // 최신 applyPendingStart를 ref로 유지 — 리스너 재등록 없이 항상 최신 참조
  const applyPendingStartRef = useRef(applyPendingStart);
  applyPendingStartRef.current = applyPendingStart;

  // RoadmapCard dispatch 이벤트 수신 → 타이머 시작
  // deps [] : 리스너를 마운트 시 1번만 등록, 재등록으로 인한 이중 리스너 원천 차단
  useEffect(() => {
    const handleRoutineStart = (e: Event) => {
      const { routines } = (e as CustomEvent<RoutineTimerStartDetail>).detail;
      if (!routines || routines.length === 0) return;

      // 같은 dispatch를 여러 리스너가 받는 경우 첫 번째만 처리
      if (e.timeStamp === _lastHandledEventTimestamp) {
        console.log(
          '[WorkPlanTimerSection] duplicate event skipped',
          e.timeStamp.toFixed(1)
        );
        return;
      }
      _lastHandledEventTimestamp = e.timeStamp;

      console.log('[WorkPlanTimerSection] event fired', {
        timeStamp: e.timeStamp.toFixed(1),
        sessionMode: sessionModeRef.current,
        isConfirmOverlayOpen: isConfirmOverlayOpenRef.current,
        routineCount: routines.length,
      });

      const pending: PendingStart =
        routines.length === 1
          ? {
              type: 'manual',
              routine: { id: routines[0].id, title: routines[0].title },
            }
          : {
              type: 'routine',
              routines: routines.map(r => ({ id: r.id, title: r.title })),
            };

      // 세션 진행 중이면 overlay-kit으로 확인 바텀시트 표시
      if (sessionModeRef.current !== 'idle') {
        if (isConfirmOverlayOpenRef.current) {
          console.log(
            '[WorkPlanTimerSection] guard blocked — overlay already open'
          );
          return;
        }
        isConfirmOverlayOpenRef.current = true;

        const confirmTitle =
          pending.type === 'manual'
            ? `'${pending.routine.title}' 시작하기`
            : '루틴 시작하기';

        console.log('[WorkPlanTimerSection] calling overlay.open()');
        overlay.open(({ isOpen, unmount }) => (
          <BottomSheet
            open={isOpen}
            onClose={() => {
              console.log(
                '[WorkPlanTimerSection] onClose — resetting ref, unmounting'
              );
              isConfirmOverlayOpenRef.current = false;
              unmount();
            }}
            title={confirmTitle}
            description="진행 중인 세션이 종료됩니다. 지금 전환할까요?"
          >
            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  console.log('[WorkPlanTimerSection] 전환하기 clicked');
                  applyPendingStartRef.current(pending);
                  isConfirmOverlayOpenRef.current = false;
                  unmount();
                }}
              >
                전환하기
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  console.log('[WorkPlanTimerSection] 취소 clicked');
                  isConfirmOverlayOpenRef.current = false;
                  unmount();
                }}
              >
                취소
              </Button>
            </div>
          </BottomSheet>
        ));
        return;
      }

      applyPendingStartRef.current(pending);
    };

    window.addEventListener(ROUTINE_TIMER_START_EVENT, handleRoutineStart);
    return () =>
      window.removeEventListener(ROUTINE_TIMER_START_EVENT, handleRoutineStart);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
      <TimerCard
        mode={timerMode}
        isRunning={isRunning}
        remainingSeconds={remainingSeconds}
        totalFocusSeconds={totalFocusSeconds}
        focusPresetMinutes={focusPresetMinutes}
        breakPresetMinutes={breakPresetMinutes}
        routineName={timerMode === 'focus' ? activeRoutine?.title : undefined}
        nextRoutineName={nextRoutineName}
        onToggleRunning={handleToggleRunning}
        onSkip={handleSkip}
        onReset={handleReset}
        onEnd={wrappedHandleEnd}
        onSaveSettings={handleSaveSettings}
      />
      <TimelineCard sessions={records} />
    </section>
  );
}

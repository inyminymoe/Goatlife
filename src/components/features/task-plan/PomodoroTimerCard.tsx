'use client';

import { useCallback, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Toast from '@/components/ui/Toast';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';

const FOCUS_PRESETS = [30, 45, 60];
const BREAK_PRESETS = [15, 20, 25, 30, 60];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds
  ).padStart(2, '0')}`;
}

function formatTotalFocus(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export default function PomodoroTimerCard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleFocusComplete = useCallback(() => {
    setToastMessage('1 뽀모도로 완성🍅');
  }, []);

  const handleBreakComplete = useCallback(() => {
    setToastMessage('잘 쉬었나요? 다시 힘차게 달려요✊');
  }, []);

  const {
    mode,
    isRunning,
    remainingSeconds,
    totalFocusSeconds,
    focusPresetMinutes,
    breakPresetMinutes,
    setFocusPresetMinutes,
    setBreakPresetMinutes,
    toggleRunning,
    startBreak,
  } = usePomodoroTimer({
    initialFocusMinutes: 30,
    initialBreakMinutes: 15,
    onFocusComplete: handleFocusComplete,
    onBreakComplete: handleBreakComplete,
    autoReturnToFocus: true,
  });

  const { hours, minutes } = useMemo(
    () => formatTotalFocus(totalFocusSeconds),
    [totalFocusSeconds]
  );

  const remainingLabel = mode === 'focus' ? '남은 집중시간' : '남은 휴식시간';
  const toggleLabel = isRunning ? '일시정지' : '재시작';

  return (
    <>
      <section className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Icon
              icon="icon-park:tomato"
              className="w-6 h-6 text-grey-900"
              aria-hidden="true"
            />
            <h2 className="brand-h3 text-grey-900">Timer</h2>
          </div>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-grey-200 transition-colors"
            aria-label="타이머 설정 열기"
            onClick={() => setIsModalOpen(true)}
          >
            <Icon icon="icon-park:more-one" className="w-6 h-6 text-grey-700" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="body-sm text-grey-400 font-medium">
              {remainingLabel}
            </span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {formatTime(remainingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="body-sm text-grey-400 font-medium">
              누적 집중시간
            </span>
            <div className="inline-flex items-end gap-1">
              <span className="brand-h1 text-primary-500 tabular-nums">
                {hours}
              </span>
              <span className="body-xs text-grey-500">시간</span>
              <span className="brand-h1 text-primary-500 tabular-nums">
                {minutes}
              </span>
              <span className="body-xs text-grey-500">분</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" fullWidth onClick={toggleRunning}>
            {toggleLabel}
          </Button>
          <Button variant="outline" fullWidth onClick={startBreak}>
            휴식하기
          </Button>
        </div>
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              aria-label="설정 닫기"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="
                fixed bottom-0 left-0 right-0 z-50
                bg-white 
                rounded-t-[20px]
                shadow-2xl
                max-h-[85vh]
                overflow-y-auto
              "
            >
              <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-[20px]">
                <div className="w-12 h-1 bg-grey-300 rounded-full" />
              </div>

              <div className="px-6 pb-4 flex items-center justify-between border-b border-grey-200">
                <h3 className="brand-h3 text-grey-900">타이머 설정</h3>
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-grey-100 transition-colors"
                  aria-label="설정 닫기"
                  onClick={() => setIsModalOpen(false)}
                >
                  <Icon
                    icon="material-symbols:close"
                    className="w-6 h-6 text-grey-700"
                  />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span className="body-sm font-medium text-grey-700">
                    집중 프리셋
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FOCUS_PRESETS.map(preset => (
                      <label
                        key={preset}
                        className="flex items-center gap-2 px-3 py-2 rounded-[5px] border border-grey-200 bg-white cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="focusPreset"
                          value={preset}
                          checked={focusPresetMinutes === preset}
                          onChange={() => setFocusPresetMinutes(preset)}
                          className="accent-primary-500"
                        />
                        <span className="body-sm text-grey-900">
                          {preset}분
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Select
                  label="휴식 프리셋"
                  value={String(breakPresetMinutes)}
                  onChange={value => setBreakPresetMinutes(Number(value))}
                  options={BREAK_PRESETS.map(preset => ({
                    value: String(preset),
                    label: `${preset}분`,
                  }))}
                />
              </div>
              <div className="h-8" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast
        show={!!toastMessage}
        message={toastMessage ?? ''}
        type="success"
        onClose={() => setToastMessage(null)}
      />
    </>
  );
}

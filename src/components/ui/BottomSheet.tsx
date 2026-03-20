'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface BottomSheetProps {
  /** BottomSheet 열림 상태 */
  open: boolean;
  /** BottomSheet 닫기 핸들러 */
  onClose: () => void;
  /** BottomSheet 제목 */
  title?: string;
  /** BottomSheet 설명 (부제목) */
  description?: string;
  /** BottomSheet 내용 */
  children: React.ReactNode;
}

/**
 * BottomSheet 컴포넌트
 *
 * 모바일 중심 UI로, 하단에서 슬라이드 업 되는 형태입니다.
 * backdrop 클릭/ESC 키로 닫을 수 있습니다.
 *
 * @example
 * ```tsx
 * <BottomSheet
 *   open={isOpen}
 *   onClose={() => setOpen(false)}
 *   title="포모도로 설정"
 * >
 *   <PomodoroSettingForm />
 * </BottomSheet>
 * ```
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: BottomSheetProps) {
  const titleId = useId();
  const descId = useId();
  const [mounted, setMounted] = useState(false);

  useScrollLock(open);
  const sheetRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
            aria-label="설정 닫기"
          />

          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-dark rounded-t-[20px] max-h-[85vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
          >
            <div className="sticky top-0 bg-dark pt-3 pb-2 flex justify-center rounded-t-[20px]">
              <div className="w-12 h-1 bg-grey-500 rounded-full" />
            </div>

            <div className="px-6 pb-4 flex items-center justify-between border-b border-grey-200">
              {title && (
                <h3 id={titleId} className="brand-h3 text-grey-900">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descId} className="body-sm text-grey-500 mt-1">
                  {description}
                </p>
              )}
              <button
                type="button"
                className="p-1 rounded-full hover:bg-grey-100 transition-colors"
                aria-label="설정 닫기"
                onClick={onClose}
              >
                <Icon
                  icon="material-symbols:close"
                  className="w-6 h-6 text-grey-700"
                />
              </button>
            </div>

            <div className="p-6">{children}</div>

            <div className="pb-safe h-2" />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

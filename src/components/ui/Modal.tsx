'use client';

import { useEffect, useId } from 'react';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface ModalProps {
  /** Modal 열림 상태 */
  open: boolean;
  /** Modal 닫기 핸들러 */
  onClose: () => void;
  /** Modal 제목 */
  title?: string;
  /** Modal 설명 (부제목) */
  description?: string;
  /** Footer 영역에 들어갈 컴포넌트 (버튼 등) */
  footer?: React.ReactNode;
  /** Modal 내용 */
  children: React.ReactNode;
  /** Modal 크기 */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

/**
 * Modal 컴포넌트
 *
 * 데스크탑에서는 중앙 정렬 dialog로 표시되며,
 * 모바일에서는 전체 화면으로 표시됩니다.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setOpen(false)}
 *   title="업무 추가"
 *   footer={
 *     <>
 *       <Button variant="secondary">취소</Button>
 *       <Button>저장</Button>
 *     </>
 *   }
 * >
 *   <TaskForm />
 * </Modal>
 * ```
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = 'md',
}: ModalProps) {
  const titleId = useId();
  const descId = useId();

  // Scroll lock
  useScrollLock(open);

  // Focus trap
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={dialogRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                relative w-full ${sizeClasses[size]}
                bg-white rounded-lg shadow-2xl
                flex flex-col
                max-h-[90vh]
              `}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              aria-describedby={description ? descId : undefined}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              {(title || description) && (
                <div className="px-6 pt-6 pb-4 border-b border-grey-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {title && (
                        <h2 id={titleId} className="brand-h3 text-grey-900">
                          {title}
                        </h2>
                      )}
                      {description && (
                        <p id={descId} className="body-sm text-grey-500 mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="ml-4 p-1 rounded-full hover:bg-grey-100 transition-colors flex-shrink-0"
                      aria-label="닫기"
                    >
                      <Icon
                        icon="material-symbols:close"
                        className="w-6 h-6 text-grey-700"
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-4 border-t border-grey-200 flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

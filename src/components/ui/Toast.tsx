// src/components/ui/Toast.tsx
'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  icon?: string | React.ReactNode;
  duration?: number;
  action?: ToastAction;
  onClose: () => void;
}

export default function Toast({
  show,
  message,
  type = 'success',
  icon,
  duration = 3000,
  action,
  onClose,
}: ToastProps) {
  // 자동 닫힘 (액션 없을 때만)
  useEffect(() => {
    if (show && !action) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, action, onClose]);

  // Type별 기본 아이콘
  const getDefaultIcon = () => {
    switch (type) {
      case 'success':
        return <Icon icon="icon-park:check-one" className="w-6 h-6" />;
      case 'error':
        return <Icon icon="icon-park:mark" className="w-6 h-6" />;
      case 'info':
        return <Icon icon="icon-park:frog" className="w-6 h-6" />;
      case 'warning':
        return <Icon icon="icon-park:message-emoji" className="w-6 h-6" />;
    }
  };

  const displayIcon = icon || getDefaultIcon();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="
            fixed z-50
            top-4 left-4 right-4 mx-auto
            lg:left-auto lg:right-4 lg:mx-0
            max-w-sm
          "
        >
          <div className="ui-component bg-grey-700 rounded-xl px-3 py-4 shadow-lg">
            {/* 아이콘 + 메시지 */}
            {!action ? (
              <div className="flex items-center gap-2">
                {typeof displayIcon === 'string' ? (
                  <span className="text-2xl flex-shrink-0">{displayIcon}</span>
                ) : (
                  <div className="flex-shrink-0">{displayIcon}</div>
                )}
                <span className="body-sm font-medium text-white leading-normal flex-1">
                  {message}
                </span>
              </div>
            ) : (
              /* 액션 유도: 메시지 + 버튼 */
              <div className="flex items-center justify-between gap-3">
                <span className="body-sm font-medium text-white leading-normal flex-1">
                  {message}
                </span>
                <button
                  onClick={action.onClick}
                  className="
                    flex-shrink-0
                    px-3 py-2
                     bg-white rounded-[5px]
                    body-xs font-medium text-grey-900
                     hover:bg-grey-100/80
                    transition-colors
                    whitespace-nowrap"
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

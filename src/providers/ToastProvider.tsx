'use client';
import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
} from 'react';
import Toast from '@/components/ui/Toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const success = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast]
  );

  const error = useCallback(
    (message: string) => showToast(message, 'error'),
    [showToast]
  );

  const info = useCallback(
    (message: string) => showToast(message, 'info'),
    [showToast]
  );

  const warning = useCallback(
    (message: string) => showToast(message, 'warning'),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ success, error, info, warning }}>
      {children}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

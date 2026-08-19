import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastItem, type ToastType } from './Toast';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showCopyToast: (message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts
    },
    []
  );

  const showCopyToast = useCallback(
    (message = 'Copied to clipboard') => {
      showToast('copied', 'Copied', message, 2500);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showCopyToast }}>
      {children}
      {/* Accessible ARIA Live Region for Screen Readers */}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </aside>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback stub if used outside provider
    return {
      showToast: () => {},
      showCopyToast: () => {},
    };
  }
  return context;
};

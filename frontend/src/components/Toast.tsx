// ═══════════════════════════════════════════════════════════════════════════════
//  Toast — Notification system for user feedback
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect, createContext, useContext, type ReactNode } from 'react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), 4000);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  return (
    <div className={`toast toast--${item.type}`} onClick={() => onRemove(item.id)}>
      <span className="toast__icon">
        {item.type === 'success' ? '\u2713' : item.type === 'error' ? '\u2717' : '\u25C8'}
      </span>
      <span className="toast__message">{item.message}</span>
    </div>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

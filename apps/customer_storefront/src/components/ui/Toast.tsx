'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ShoppingCart } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  messageBn?: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icons = {
    success: <Check size={18} className="text-success-default" />,
    error: <X size={18} className="text-danger-default" />,
    info: <ShoppingCart size={18} className="text-primary-default" />,
  };

  const bgColors = {
    success: 'bg-success-subtle border-success-default/20',
    error: 'bg-danger-subtle border-danger-default/20',
    info: 'bg-primary-subtle border-primary-default/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`pointer-events-auto mx-auto max-w-sm w-full ${bgColors[toast.type]} border rounded-xl p-4 shadow-level-2 flex items-center gap-3`}
    >
      <div className="flex-shrink-0">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-text-primary truncate">
          {toast.messageBn || toast.message}
        </p>
        {toast.messageBn && toast.message && (
          <p className="text-xs text-text-muted truncate">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} className="text-text-muted" />
      </button>
    </motion.div>
  );
}

// Hook for using toast
export function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

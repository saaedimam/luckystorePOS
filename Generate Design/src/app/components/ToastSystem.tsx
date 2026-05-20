import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastVariant = "success" | "warning" | "error" | "info";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  icon?: ReactNode;
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastProps, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

function Toast({ toast, onDismiss }: { toast: ToastProps; onDismiss: () => void }) {
  const variantStyles = {
    success: "border-emerald/20 bg-emerald/10 text-emerald",
    warning: "border-amber/20 bg-amber/10 text-amber",
    error: "border-rose/20 bg-rose/10 text-rose",
    info: "border-blue/20 bg-blue/10 text-blue",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-lg flex items-start gap-3 w-full bg-surface ${variantStyles[toast.variant]}`}
    >
      {toast.icon && <div className="mt-0.5 shrink-0">{toast.icon}</div>}
      <div className="flex-1 space-y-1">
        <h4 className="font-semibold text-sm leading-none text-foreground">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-text-secondary leading-relaxed opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-text-secondary"
      >
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

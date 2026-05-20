import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";

export type ToastTone = "success" | "destructive";

export interface ToastPayload {
  message: string;
  tone?: ToastTone;
}

interface SuccessToastProps {
  toast: ToastPayload | null;
  onDismiss: () => void;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DUR = "300ms";

export function SuccessToast({ toast, onDismiss }: SuccessToastProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      setMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      const auto = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(auto);
    } else if (mounted) {
      setVisible(false);
    }
  }, [toast, mounted]);

  useEffect(() => {
    if (!visible && mounted) {
      const t = setTimeout(() => {
        setMounted(false);
        onDismiss();
      }, 310);
      return () => clearTimeout(t);
    }
  }, [visible, mounted, onDismiss]);

  if (!mounted || !toast) return null;

  const isDestructive = toast.tone === "destructive";
  const accent = isDestructive ? "var(--accent-rose)" : "var(--accent-emerald)";
  const label = isDestructive ? "Deleted" : "Success";
  const borderColor = isDestructive
    ? "color-mix(in oklab, var(--accent-rose) 45%, rgba(255,255,255,0.10))"
    : "rgba(255,255,255,0.10)";

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] pointer-events-none"
      style={{
        transform: visible ? "translateY(0)" : "translateY(20px)",
        opacity: visible ? 1 : 0,
        transition: `transform ${DUR} ${EASE}, opacity ${DUR} ${EASE}`,
      }}
    >
      <div
        className="pointer-events-auto flex items-center gap-3 pl-3 pr-5 py-3 rounded-xl border"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: borderColor,
          boxShadow:
            "0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset",
          minWidth: 280,
        }}
      >
        <div
          className="size-8 rounded-full flex items-center justify-center relative shrink-0"
          style={{
            backgroundColor: `color-mix(in oklab, ${accent} 18%, transparent)`,
            color: accent,
          }}
        >
          {isDestructive ? <Trash2 size={14} strokeWidth={2.5} /> : <Check size={15} strokeWidth={3} />}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${accent}`,
              opacity: 0.5,
              animation: "toast-pulse 1.6s ease-out infinite",
            }}
          />
        </div>
        <div className="min-w-0">
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: accent,
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {label}
          </p>
          <p
            className="truncate"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.3,
            }}
          >
            {toast.message}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes toast-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(1.6); opacity: 0;    }
          100% { transform: scale(1.6); opacity: 0;    }
        }
      `}</style>
    </div>
  );
}

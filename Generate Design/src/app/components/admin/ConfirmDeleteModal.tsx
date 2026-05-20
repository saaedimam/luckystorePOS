import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  productName: string | null;
  isBangla?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DUR = "200ms";

export function ConfirmDeleteModal({
  open,
  productName,
  isBangla,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
    } else if (mounted) {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-6">
      <div
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{
          opacity: visible ? 1 : 0,
          transition: `opacity ${DUR} ease-out`,
        }}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full rounded-2xl border overflow-hidden"
        style={{
          maxWidth: 400,
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset",
          transform: visible ? "scale(1)" : "scale(0.96)",
          opacity: visible ? 1 : 0,
          transition: `transform ${DUR} ease-out, opacity ${DUR} ease-out`,
          willChange: "transform, opacity",
        }}
      >
        <div className="px-6 pt-6 pb-5 flex gap-4">
          <div
            className="size-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              backgroundColor: "color-mix(in oklab, var(--accent-rose) 16%, transparent)",
              color: "var(--accent-rose)",
            }}
          >
            <AlertTriangle size={18} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
                lineHeight: 1.25,
                fontFamily: isBangla ? "'Hind Siliguri', sans-serif" : undefined,
              }}
            >
              Delete {productName}?
            </h3>
            <p
              className="mt-2"
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              This action cannot be undone and will permanently remove {productName?.includes("Products") ? "these items" : "this SKU"}
              from the active ledger.
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t"
          style={{
            borderColor: "var(--border)",
            backgroundColor:
              "color-mix(in oklab, var(--surface-elevated) 50%, transparent)",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-5 rounded-lg border transition-colors duration-150"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
              backgroundColor: "transparent",
              borderColor: "var(--border)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 px-5 rounded-lg transition-all duration-150 active:scale-[0.97]"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#FFFFFF",
              backgroundColor: "var(--accent-rose)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 20px rgba(244,63,94,0.30)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.filter = "brightness(1.08)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

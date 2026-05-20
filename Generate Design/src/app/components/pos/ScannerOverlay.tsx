import { useEffect, useRef, useState } from "react";
import { X, ScanLine, Zap, Keyboard } from "lucide-react";
import type { Product } from "./data";
import { PRODUCTS } from "./data";

interface ScannerOverlayProps {
  open: boolean;
  onClose: () => void;
  onDetect: (p: Product) => void;
}

export function ScannerOverlay({ open, onClose, onDetect }: ScannerOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [lastSku, setLastSku] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Mount/enter transition
  useEffect(() => {
    if (open) {
      rafRef.current = requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open]);

  // Simulate a detection 1.6s after opening
  useEffect(() => {
    if (!open) return;
    setDetecting(false);
    setLastSku(null);
    const id = setTimeout(() => {
      const p = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
      setDetecting(true);
      setFlash(true);
      setLastSku(p.sku);
      setTimeout(() => setFlash(false), 320);
      setTimeout(() => {
        onDetect(p);
        setDetecting(false);
      }, 520);
    }, 1600);
    return () => clearTimeout(id);
  }, [open, onDetect]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        opacity: mounted ? 1 : 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scanner"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <ScanLine size={16} style={{ color: "var(--accent-emerald)" }} />
          <span className="text-caption" style={{ color: "var(--text-primary)" }}>
            Scanner · Active
          </span>
        </div>
        <button
          onClick={onClose}
          className="h-9 w-9 grid place-items-center rounded-md border transition-colors duration-300 hover:bg-white/5"
          style={{
            borderColor: "rgba(255,255,255,0.16)",
            color: "rgba(232,232,232,0.85)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          aria-label="Close scanner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Reticle */}
      <div
        className="relative transition-transform duration-300"
        style={{
          width: 240,
          height: 240,
          transform: mounted ? "scale(1)" : "scale(0.96)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          className={`absolute inset-0 rounded-md overflow-hidden ${flash ? "animate-scan-detect" : ""}`}
          style={{
            border: `2px solid ${detecting ? "var(--accent-emerald)" : "var(--accent-emerald)"}`,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.0), 0 0 60px -8px ${detecting ? "var(--accent-emerald)" : "rgba(16,185,129,0.35)"}`,
            backgroundColor: flash ? "rgba(16, 185, 129, 0.2)" : "transparent",
          }}
        >
          {/* Sweep line */}
          {!detecting && (
            <span
              aria-hidden
              className="absolute left-0 right-0 h-px animate-reticle-sweep"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, var(--accent-emerald) 50%, transparent 100%)",
                boxShadow: "0 0 12px var(--accent-emerald)",
              }}
            />
          )}
        </div>

        {/* Corner brackets */}
        {[
          { top: -2, left: -2, borderRight: 0, borderBottom: 0 },
          { top: -2, right: -2, borderLeft: 0, borderBottom: 0 },
          { bottom: -2, left: -2, borderRight: 0, borderTop: 0 },
          { bottom: -2, right: -2, borderLeft: 0, borderTop: 0 },
        ].map((s, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute"
            style={{
              width: 22,
              height: 22,
              borderWidth: 3,
              borderColor: "var(--accent-emerald)",
              borderStyle: "solid",
              ...s,
            }}
          />
        ))}
      </div>

      {/* Caption */}
      <div className="mt-10 flex flex-col items-center gap-3" style={{ minHeight: 80 }}>
        {detecting ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "var(--accent-emerald-soft)" }}
          >
            <Zap size={12} style={{ color: "var(--accent-emerald)" }} />
            <span className="text-caption num" style={{ color: "var(--accent-emerald)" }}>
              Detected · {lastSku}
            </span>
          </div>
        ) : (
          <span className="text-body" style={{ color: "rgba(232,232,232,0.7)" }}>
            Align barcode inside the reticle…
          </span>
        )}
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-md border transition-colors duration-300 hover:bg-white/5"
          style={{
            borderColor: "rgba(255,255,255,0.16)",
            color: "rgba(232,232,232,0.85)",
            fontSize: 12,
            fontWeight: 600,
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Keyboard size={12} />
          Manual entry
        </button>
      </div>
    </div>
  );
}

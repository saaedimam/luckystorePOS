import { useEffect, useState } from "react";
import { X, Printer, CheckCircle2, Mail, RotateCcw } from "lucide-react";
import type { CartItem } from "./Cart";
import { TENDER_META, type TenderType } from "./SplitPaymentDrawer";

type PrinterState = "default" | "connecting" | "printed";

interface ReceiptModalProps {
  open: boolean;
  items: CartItem[];
  tenders: { type: TenderType; amount: number }[];
  total: number;
  vat: number;
  discountAmt: number;
  subtotal: number;
  onClose: () => void;
}

function fmt(n: number) {
  return n.toFixed(2);
}

export function ReceiptModal({
  open,
  items,
  tenders,
  total,
  vat,
  discountAmt,
  subtotal,
  onClose,
}: ReceiptModalProps) {
  const [mounted, setMounted] = useState(false);
  const [printerState, setPrinterState] = useState<PrinterState>("default");

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
      setPrinterState("default");
    } else {
      setMounted(false);
    }
  }, [open]);

  function handlePrint() {
    if (printerState !== "default") {
      // Allow re-print after a successful print
      if (printerState === "printed") setPrinterState("default");
      return;
    }
    setPrinterState("connecting");
    setTimeout(() => setPrinterState("printed"), 1800);
  }

  if (!open) return null;

  const tendered = tenders.reduce((s, t) => s + t.amount, 0);
  const change = Math.max(0, tendered - total);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour12: false });
  const invoiceNo = "INV-2104";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          opacity: mounted ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[380px] rounded-lg border flex flex-col"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "scale(1)" : "scale(0.96)",
          transition: "opacity 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: "0 32px 80px -24px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 h-12 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            Receipt Preview · 80mm
          </span>
          <button
            onClick={onClose}
            className="h-7 w-7 grid place-items-center rounded transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Thermal receipt body */}
        <div
          className="px-6 py-6 font-mono"
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, 'JetBrains Mono', 'Menlo', monospace",
            color: "#0F1117",
            backgroundColor: "#FAFAF7",
            fontSize: 11,
            lineHeight: 1.55,
            letterSpacing: 0,
          }}
        >
          {/* Logo block */}
          <div className="text-center flex flex-col gap-1">
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.16em" }}>
              LUCKY STORE
            </div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>
              123 Mirpur Road · Dhaka 1209
            </div>
            <div style={{ fontSize: 9, opacity: 0.7 }}>
              VAT BIN: 003421100-0001
            </div>
          </div>

          <div className="my-3" style={{ borderTop: "1px dashed #0F1117", opacity: 0.4 }} />

          <div className="flex justify-between" style={{ fontSize: 10 }}>
            <span>Invoice</span>
            <span>{invoiceNo}</span>
          </div>
          <div className="flex justify-between" style={{ fontSize: 10 }}>
            <span>Date</span>
            <span>
              {dateStr} · {timeStr}
            </span>
          </div>
          <div className="flex justify-between" style={{ fontSize: 10 }}>
            <span>Cashier</span>
            <span>Tanvir · #04</span>
          </div>

          <div className="my-3" style={{ borderTop: "1px dashed #0F1117", opacity: 0.4 }} />

          {/* Items */}
          <div className="flex flex-col gap-1">
            {items.map((it) => {
              const line = it.product.price * it.qty;
              return (
                <div key={it.product.id} className="flex flex-col">
                  <div className="flex justify-between gap-2">
                    <span className="truncate" style={{ fontWeight: 700 }}>
                      {it.product.name}
                    </span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(line)}</span>
                  </div>
                  <div className="flex justify-between" style={{ opacity: 0.7, fontSize: 10 }}>
                    <span>
                      {it.qty} × {fmt(it.product.price)} · {it.product.sku}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="my-3" style={{ borderTop: "1px dashed #0F1117", opacity: 0.4 }} />

          {/* Totals */}
          <div className="flex flex-col" style={{ fontVariantNumeric: "tabular-nums" }}>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>−{fmt(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT (5%)</span>
              <span>{fmt(vat)}</span>
            </div>
            <div
              className="flex justify-between mt-2 pt-2"
              style={{
                borderTop: "1px solid #0F1117",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              <span>TOTAL ৳</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          <div className="my-3" style={{ borderTop: "1px dashed #0F1117", opacity: 0.4 }} />

          {/* Tender */}
          <div className="flex flex-col" style={{ fontVariantNumeric: "tabular-nums" }}>
            {tenders.map((t, i) => (
              <div key={i} className="flex justify-between">
                <span>{TENDER_META[t.type].label}</span>
                <span>{fmt(t.amount)}</span>
              </div>
            ))}
            {change > 0 && (
              <div className="flex justify-between" style={{ fontWeight: 700 }}>
                <span>Change</span>
                <span>{fmt(change)}</span>
              </div>
            )}
          </div>

          <div className="my-3" style={{ borderTop: "1px dashed #0F1117", opacity: 0.4 }} />

          {/* Barcode pseudo */}
          <div className="flex justify-center my-2">
            <div className="flex items-end gap-px" style={{ height: 32 }}>
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i % 3 === 0 ? 2 : 1,
                    height: "100%",
                    backgroundColor: "#0F1117",
                    opacity: (i * 7) % 4 === 0 ? 0.4 : 1,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="text-center" style={{ fontSize: 9, opacity: 0.7 }}>
            {invoiceNo}
          </div>

          <div className="text-center mt-3" style={{ fontSize: 9, opacity: 0.7 }}>
            ধন্যবাদ · Thank you for shopping
          </div>
        </div>

        {/* Footer actions */}
        <div
          className="border-t shrink-0 px-4 py-3 flex items-center gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}
          >
            <Mail size={12} />
            Email
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}
            onClick={onClose}
          >
            <RotateCcw size={12} />
            New sale
          </button>

          <button
            onClick={handlePrint}
            disabled={printerState === "connecting"}
            className="relative ml-auto inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md transition-[transform,box-shadow,filter,background-color] duration-300 active:scale-[0.97] disabled:cursor-wait"
            style={{
              backgroundColor:
                printerState === "printed" ? "var(--accent-emerald)" : "var(--accent-gold)",
              color: "#0B0D12",
              boxShadow:
                printerState === "printed"
                  ? "inset 0 1px 0 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(16,185,129,0.5), 0 12px 24px -12px rgba(16,185,129,0.7)"
                  : "inset 0 1px 0 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,168,67,0.4), 0 12px 24px -12px rgba(212,168,67,0.7)",
              fontSize: 13,
              fontWeight: 700,
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              minWidth: 160,
            }}
          >
            {printerState === "connecting" && (
              <>
                <span
                  className="animate-spin-slow inline-block rounded-full border-2 border-current border-r-transparent"
                  style={{ width: 13, height: 13, color: "var(--accent-blue)" }}
                />
                <span style={{ color: "var(--accent-blue)" }}>Connecting…</span>
              </>
            )}
            {printerState === "printed" && (
              <>
                <CheckCircle2 size={14} strokeWidth={2.5} />
                Printed
              </>
            )}
            {printerState === "default" && (
              <>
                <Printer size={14} strokeWidth={2.5} />
                Print receipt
              </>
            )}
          </button>
        </div>

        {/* Bluetooth status line */}
        <div
          className="px-4 pb-3 flex items-center gap-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor:
                printerState === "printed"
                  ? "var(--accent-emerald)"
                  : printerState === "connecting"
                    ? "var(--accent-blue)"
                    : "var(--text-tertiary)",
            }}
          />
          <span className="text-micro">
            EPSON TM-T20III · Bluetooth ·{" "}
            {printerState === "printed"
              ? "Ready"
              : printerState === "connecting"
                ? "Pairing"
                : "Standby"}
          </span>
        </div>
      </div>
    </div>
  );
}

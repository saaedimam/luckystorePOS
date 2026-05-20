import { useEffect, useMemo, useState } from "react";
import { X, Banknote, Smartphone, CreditCard, UserCheck, Plus, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";

export type TenderType = "cash" | "bkash" | "card" | "credit";

const TENDER_META: Record<TenderType, { label: string; icon: typeof Banknote; accent: string }> = {
  cash:   { label: "Cash",   icon: Banknote,   accent: "var(--accent-emerald)" },
  bkash:  { label: "bKash",  icon: Smartphone, accent: "var(--accent-blue)" },
  card:   { label: "Card",   icon: CreditCard, accent: "var(--accent-gold)" },
  credit: { label: "Credit", icon: UserCheck,  accent: "var(--accent-amber)" },
};

type Tender = { id: string; type: TenderType; amount: string };

interface SplitPaymentDrawerProps {
  open: boolean;
  total: number;
  initialTender: TenderType;
  onClose: () => void;
  onComplete: (tenders: { type: TenderType; amount: number }[]) => void;
}

function fmt(n: number) {
  return `৳${n.toFixed(2)}`;
}

let uid = 0;
const nextId = () => `t${++uid}`;

export function SplitPaymentDrawer({
  open,
  total,
  initialTender,
  onClose,
  onComplete,
}: SplitPaymentDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [tenders, setTenders] = useState<Tender[]>([]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
      setTenders([{ id: nextId(), type: initialTender, amount: total.toFixed(2) }]);
    } else {
      setMounted(false);
    }
  }, [open, initialTender, total]);

  const paid = useMemo(
    () => tenders.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
    [tenders],
  );
  const remaining = total - paid;
  const overpaid = remaining < 0;
  const fullyPaid = Math.abs(remaining) < 0.005;
  const underpaid = remaining > 0.005;

  function setTenderAmount(id: string, amount: string) {
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, amount } : t)));
  }
  function setTenderType(id: string, type: TenderType) {
    setTenders((prev) => prev.map((t) => (t.id === id ? { ...t, type } : t)));
  }
  function removeTender(id: string) {
    setTenders((prev) => prev.filter((t) => t.id !== id));
  }
  function addTender(type: TenderType) {
    const rem = Math.max(0, total - paid);
    setTenders((prev) => [...prev, { id: nextId(), type, amount: rem.toFixed(2) }]);
  }
  function fillRemaining(id: string) {
    setTenders((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const others = prev.filter((o) => o.id !== id).reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
        const rem = Math.max(0, total - others);
        return { ...t, amount: rem.toFixed(2) };
      }),
    );
  }

  // Determine statuses
  const statusColor = overpaid
    ? "var(--accent-amber)"
    : fullyPaid
      ? "var(--accent-emerald)"
      : "var(--accent-rose)";
  const statusBg = overpaid
    ? "var(--accent-amber-soft)"
    : fullyPaid
      ? "var(--accent-emerald-soft)"
      : "var(--accent-rose-soft)";
  const statusLabel = overpaid ? "Change due" : fullyPaid ? "Fully paid" : "Remaining";
  const statusValue = overpaid ? Math.abs(remaining) : remaining;

  // Suggestions for cash quick-fills
  const cashSuggestions = useMemo(() => {
    const t = Math.ceil(total / 50) * 50;
    return [total, t, t + 100, t + 500].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i).slice(0, 4);
  }, [total]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Split payment">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: mounted ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className="absolute top-0 right-0 h-full w-full sm:max-w-[480px] flex flex-col border-l"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          transform: mounted ? "translateX(0%)" : "translateX(100%)",
          transition: "transform 250ms cubic-bezier(0.32, 0.72, 0, 1)",
          boxShadow: "-24px 0 48px -16px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 h-16 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
              Tender · Sale #INV-2104
            </span>
            <span className="text-subheading" style={{ color: "var(--text-primary)" }}>
              Split Payment
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </header>

        {/* Total summary */}
        <div
          className="px-5 py-4 border-b grid grid-cols-2 gap-3 shrink-0"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
              Total due
            </span>
            <span className="num-financial" style={{ color: "var(--text-primary)", fontSize: 22 }}>
              {fmt(total)}
            </span>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: statusBg, color: statusColor, fontSize: 11, fontWeight: 600 }}
            >
              {fullyPaid && <CheckCircle2 size={11} strokeWidth={2.5} />}
              {statusLabel}
            </span>
            <span className="num-financial" style={{ color: statusColor, fontSize: 22 }}>
              {fmt(statusValue)}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4 shrink-0">
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: "var(--surface-elevated)" }}
          >
            <div
              className="h-full transition-[width,background-color] duration-300"
              style={{
                width: `${Math.min(100, (paid / total) * 100)}%`,
                backgroundColor: overpaid
                  ? "var(--accent-amber)"
                  : fullyPaid
                    ? "var(--accent-emerald)"
                    : "var(--accent-gold)",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>

        {/* Tenders list */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 py-4 flex flex-col gap-3">
          {tenders.map((t) => {
            const meta = TENDER_META[t.type];
            return (
              <div
                key={t.id}
                className="rounded-lg border p-3 flex flex-col gap-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="grid grid-cols-4 gap-1 flex-1">
                    {(Object.keys(TENDER_META) as TenderType[]).map((tt) => {
                      const m = TENDER_META[tt];
                      const active = t.type === tt;
                      return (
                        <button
                          key={tt}
                          onClick={() => setTenderType(t.id, tt)}
                          className="h-9 rounded-md border flex items-center justify-center gap-1 transition-[background-color,border-color,box-shadow] duration-300"
                          style={{
                            borderColor: active ? m.accent : "var(--border)",
                            backgroundColor: active
                              ? `color-mix(in oklab, ${m.accent} 12%, var(--surface))`
                              : "var(--surface)",
                            color: active ? "var(--text-primary)" : "var(--text-secondary)",
                            fontSize: 11,
                            fontWeight: 600,
                            boxShadow: active ? `0 0 0 1px ${m.accent}` : undefined,
                            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <m.icon size={12} style={{ color: active ? m.accent : "var(--text-tertiary)" }} />
                          <span className="hidden sm:inline">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {tenders.length > 1 && (
                    <button
                      onClick={() => removeTender(t.id)}
                      className="h-9 w-9 grid place-items-center rounded-md border transition-colors duration-300 hover:bg-[var(--surface)]"
                      style={{ borderColor: "var(--border)", color: "var(--text-tertiary)" }}
                      aria-label="Remove tender"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                <label
                  className="flex items-center gap-2 h-12 px-3 rounded-md border transition-colors duration-300"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface)",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span
                    className="num"
                    style={{ color: meta.accent, fontSize: 14, fontWeight: 700 }}
                  >
                    ৳
                  </span>
                  <input
                    value={t.amount}
                    onChange={(e) => setTenderAmount(t.id, e.target.value.replace(/[^\d.]/g, ""))}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="flex-1 bg-transparent outline-none border-0 num"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 18,
                      fontWeight: 700,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  />
                  <button
                    onClick={() => fillRemaining(t.id)}
                    className="text-micro px-2 py-1 rounded transition-colors duration-200 hover:bg-[var(--surface-elevated)]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Fill
                  </button>
                </label>

                {t.type === "cash" && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {cashSuggestions.map((v) => (
                      <button
                        key={v}
                        onClick={() => setTenderAmount(t.id, v.toFixed(2))}
                        className="h-8 rounded border text-micro num transition-colors duration-200 hover:bg-[var(--surface)]"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ৳{v.toFixed(0)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add tender */}
          <div
            className="rounded-lg border-dashed border-2 p-3 flex flex-col gap-2"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
              Add tender
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(TENDER_META) as TenderType[]).map((tt) => {
                const m = TENDER_META[tt];
                return (
                  <button
                    key={tt}
                    onClick={() => addTender(tt)}
                    className="h-10 rounded-md border flex flex-col items-center justify-center gap-0.5 transition-[background-color,border-color] duration-300"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface)",
                      transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <m.icon size={12} style={{ color: m.accent }} />
                    <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600 }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {overpaid && (
            <div
              className="rounded-md border p-3 flex items-start gap-2"
              style={{
                borderColor: "var(--accent-amber)",
                backgroundColor: "var(--accent-amber-soft)",
              }}
            >
              <span className="text-micro" style={{ color: "var(--accent-amber)" }}>
                Overpayment of <span className="num">{fmt(Math.abs(remaining))}</span>. Confirm change handed back to customer.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t shrink-0 px-5 py-4 flex flex-col gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
              Tendered · {tenders.length} method{tenders.length === 1 ? "" : "s"}
            </span>
            <span className="num text-body" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              {fmt(paid)}
            </span>
          </div>

          <button
            disabled={underpaid}
            onClick={() =>
              onComplete(tenders.map((t) => ({ type: t.type, amount: parseFloat(t.amount) || 0 })))
            }
            className="relative h-14 w-full rounded-lg flex items-center justify-between px-5 group transition-[transform,box-shadow,filter] duration-300 active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--accent-gold)",
              color: "#0B0D12",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,168,67,0.4), 0 16px 36px -16px rgba(212,168,67,0.8)",
            }}
          >
            <span className="flex flex-col items-start leading-none gap-1">
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
                {fullyPaid ? "Confirm & print" : overpaid ? "Confirm change" : "Awaiting tender"}
              </span>
              <span className="num" style={{ fontSize: 18, fontWeight: 800 }}>
                {fmt(total)}
              </span>
            </span>
            <span className="inline-flex items-center gap-2" style={{ fontWeight: 700, fontSize: 14 }}>
              Complete
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}

export { TENDER_META };

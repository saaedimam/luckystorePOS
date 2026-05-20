import { useState } from "react";
import { Minus, Plus, Trash2, Percent, ShoppingBag, CreditCard, Banknote, Smartphone, UserCheck, ArrowRight } from "lucide-react";
import type { Product } from "./data";
import { toPaisa, toTaka, fmtTaka } from "./math";

export type CartItem = { product: Product; qty: number };
export type PaymentMethod = "cash" | "bkash" | "card" | "credit";

interface CartProps {
  items: CartItem[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  discount: string;
  onDiscountChange: (v: string) => void;
  payment: PaymentMethod;
  onPaymentChange: (p: PaymentMethod) => void;
  onCheckout: () => void;
}

function fmt(n: number) {
  return fmtTaka(toPaisa(n));
}

const PAYMENTS: { id: PaymentMethod; label: string; icon: typeof Banknote; accent: string }[] = [
  { id: "cash",   label: "Cash",   icon: Banknote,   accent: "var(--accent-emerald)" },
  { id: "bkash",  label: "bKash",  icon: Smartphone, accent: "var(--accent-blue)" },
  { id: "card",   label: "Card",   icon: CreditCard, accent: "var(--accent-gold)" },
  { id: "credit", label: "Credit", icon: UserCheck,  accent: "var(--accent-amber)" },
];

function CartRow({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const lineTotal = item.product.price * item.qty;
  return (
    <div
      className="grid items-center gap-3 px-4 py-3 border-b transition-colors duration-300"
      style={{
        gridTemplateColumns: "44px 1fr auto",
        borderColor: "var(--border)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Thumb */}
      <div
        className="h-11 w-11 rounded-md shrink-0"
        style={{
          background: `linear-gradient(135deg, ${item.product.thumb} 0%, color-mix(in oklab, ${item.product.thumb} 50%, #000) 100%)`,
        }}
      />

      {/* Name + qty stepper */}
      <div className="min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-body truncate" style={{ color: "var(--text-primary)" }}>
            {item.product.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
            {item.product.sku}
          </span>
          <span className="text-micro" style={{ color: "var(--text-muted)" }}>·</span>
          <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
            {fmt(item.product.price)} ea
          </span>
        </div>
      </div>

      {/* Right column — line total + stepper */}
      <div className="flex flex-col items-end gap-1.5">
        <span className="num" style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>
          {fmt(lineTotal)}
        </span>
        <div
          className="inline-flex items-center rounded-md border overflow-hidden"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}
        >
          <button
            type="button"
            onClick={item.qty === 1 ? onRemove : onDec}
            className="h-7 w-7 grid place-items-center transition-colors duration-200 hover:bg-[var(--border)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Decrease"
          >
            {item.qty === 1 ? <Trash2 size={12} /> : <Minus size={12} />}
          </button>
          <span
            className="num text-center"
            style={{
              minWidth: 28,
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {item.qty}
          </span>
          <button
            type="button"
            onClick={onInc}
            className="h-7 w-7 grid place-items-center transition-colors duration-200 hover:bg-[var(--border)]"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Increase"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Cart({
  items,
  onInc,
  onDec,
  onRemove,
  discount,
  onDiscountChange,
  payment,
  onPaymentChange,
  onCheckout,
}: CartProps) {
  const [tenderedStr, setTenderedStr] = useState("");

  const subtotalPaisa = items.reduce((s, i) => s + toPaisa(i.product.price) * i.qty, 0);
  const discountPct = Math.max(0, Math.min(100, parseFloat(discount) || 0));
  const discountAmtPaisa = Math.round((subtotalPaisa * discountPct) / 100);
  const taxablePaisa = subtotalPaisa - discountAmtPaisa;
  const vatPaisa = Math.round(taxablePaisa * 0.05);
  const totalPaisa = taxablePaisa + vatPaisa;
  
  const tenderedPaisa = toPaisa(parseFloat(tenderedStr) || 0);
  const changePaisa = tenderedPaisa - totalPaisa;
  const isUnderpaid = payment === "cash" && tenderedStr !== "" && changePaisa < 0;
  const isCheckoutDisabled = items.length === 0 || (payment === "cash" && (tenderedStr === "" || isUnderpaid));
  
  const totalTaka = toTaka(totalPaisa);
  const subtotalTaka = toTaka(subtotalPaisa);
  const discountAmtTaka = toTaka(discountAmtPaisa);
  const vatTaka = toTaka(vatPaisa);
  
  const total = totalTaka;
  const subtotal = subtotalTaka;
  const discountAmt = discountAmtTaka;
  const vat = vatTaka;

  const itemCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <aside
      className="flex flex-col h-full min-h-0 rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} style={{ color: "var(--accent-gold)" }} />
          <span className="text-subheading" style={{ color: "var(--text-primary)" }}>
            Current Sale
          </span>
          <span
            className="num inline-flex items-center justify-center rounded-full px-2"
            style={{
              backgroundColor: "var(--surface-elevated)",
              color: "var(--text-secondary)",
              fontSize: 11,
              fontWeight: 700,
              height: 20,
              minWidth: 20,
            }}
          >
            {itemCount}
          </span>
        </div>
        <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
          #INV-2104
        </span>
      </div>

      {/* Items — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        {items.length === 0 ? (
          <div className="h-full grid place-items-center px-6 py-10" style={{ minHeight: 240 }}>
            <div className="flex flex-col items-center gap-2 text-center">
              <ShoppingBag size={20} style={{ color: "var(--text-tertiary)" }} />
              <span className="text-body" style={{ color: "var(--text-secondary)" }}>
                Cart is empty
              </span>
              <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                Tap a product or scan a barcode to add an item.
              </span>
            </div>
          </div>
        ) : (
          items.map((it) => (
            <CartRow
              key={it.product.id}
              item={it}
              onInc={() => onInc(it.product.id)}
              onDec={() => onDec(it.product.id)}
              onRemove={() => onRemove(it.product.id)}
            />
          ))
        )}
      </div>

      {/* Totals + discount */}
      <div
        className="border-t shrink-0 px-4 pt-4 pb-3 flex flex-col gap-3"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        {/* Discount inline */}
        <label
          className="flex items-center gap-2 h-10 px-3 rounded-md border transition-colors duration-300"
          style={{
            borderColor: discount ? "var(--accent-gold)" : "var(--border)",
            backgroundColor: "var(--surface-elevated)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Percent size={14} style={{ color: discount ? "var(--accent-gold)" : "var(--text-tertiary)" }} />
          <input
            value={discount}
            onChange={(e) => onDiscountChange(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Discount"
            inputMode="decimal"
            className="flex-1 bg-transparent outline-none border-0 num"
            style={{
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "none",
              letterSpacing: 0,
            }}
          />
          <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
            % off
          </span>
          {discount && (
            <span className="num text-micro" style={{ color: "var(--accent-gold)" }}>
              −{fmt(discountAmt)}
            </span>
          )}
        </label>

        {/* Lines */}
        <div className="flex flex-col gap-1.5">
          {[
            ["Subtotal", fmt(subtotal)],
            ["Discount", discountPct ? `−${fmt(discountAmt)} (${discountPct}%)` : "—"],
            ["VAT · 5%", fmt(vat)],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                {k}
              </span>
              <span className="num text-body" style={{ color: "var(--text-secondary)" }}>
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div
          className="flex items-baseline justify-between border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-caption" style={{ color: "var(--text-tertiary)" }}>
            Total Due
          </span>
          <span className="num-financial" style={{ color: "var(--text-primary)", fontSize: 24 }}>
            {fmt(total)}
          </span>
        </div>

        {/* Payment toggles */}
        <div className="grid grid-cols-4 gap-2 mt-1">
          {PAYMENTS.map((p) => {
            const active = p.id === payment;
            return (
              <button
                key={p.id}
                onClick={() => onPaymentChange(p.id)}
                className="relative flex flex-col items-center justify-center gap-1 h-14 rounded-md border transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                style={{
                  borderColor: active ? p.accent : "var(--border)",
                  backgroundColor: active
                    ? `color-mix(in oklab, ${p.accent} 12%, var(--surface-elevated))`
                    : "var(--surface-elevated)",
                  boxShadow: active ? `0 0 0 1px ${p.accent}, 0 6px 16px -10px ${p.accent}` : undefined,
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                aria-pressed={active}
              >
                <p.icon size={14} style={{ color: active ? p.accent : "var(--text-secondary)" }} />
                <span
                  style={{
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cash Tendered */}
        {items.length > 0 && payment === "cash" && (
          <div className="flex flex-col gap-2 mt-2">
            <label
              className="flex items-center gap-2 h-12 px-3 rounded-md border transition-colors duration-300"
              style={{
                borderColor: isUnderpaid ? "var(--accent-rose)" : "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <span className="text-micro" style={{ color: "var(--text-tertiary)", minWidth: "90px" }}>Cash Tendered</span>
              <span className="num" style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 700 }}>৳</span>
              <input
                value={tenderedStr}
                onChange={(e) => setTenderedStr(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder={totalTaka.toFixed(2)}
                className="flex-1 bg-transparent outline-none border-0 num text-right"
                style={{
                  color: "var(--text-primary)",
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              />
            </label>
            {tenderedStr !== "" && (
              <div className="flex items-center justify-between px-1">
                <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
                  {isUnderpaid ? "Underpaid" : "Change Due"}
                </span>
                <span className="num" style={{ color: isUnderpaid ? "var(--accent-rose)" : "var(--accent-emerald)", fontWeight: 700 }}>
                  {fmtTaka(Math.abs(changePaisa))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Checkout CTA */}
        <button
          disabled={isCheckoutDisabled}
          onClick={() => {
            onCheckout();
            setTenderedStr("");
          }}
          className="relative mt-1 h-14 w-full rounded-lg flex items-center justify-between px-5 group transition-[transform,filter,box-shadow] duration-300 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:filter-none"
          style={{
            backgroundColor: "var(--accent-gold)",
            color: "#0B0D12",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow:
              "inset 0 1px 0 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,168,67,0.4), 0 16px 36px -16px rgba(212,168,67,0.8), 0 0 24px -8px rgba(212,168,67,0.45)",
          }}
        >
          {/* Glow halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "radial-gradient(120% 80% at 50% 120%, rgba(212,168,67,0.65) 0%, transparent 60%)",
              filter: "blur(12px)",
              zIndex: -1,
            }}
          />
          <span className="flex flex-col items-start leading-none gap-1">
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
              Charge · {PAYMENTS.find((p) => p.id === payment)?.label}
            </span>
            <span className="num" style={{ fontSize: 18, fontWeight: 800 }}>
              {fmt(total)}
            </span>
          </span>
          <span className="inline-flex items-center gap-2" style={{ fontWeight: 700, fontSize: 14 }}>
            Checkout
            <ArrowRight size={16} strokeWidth={2.5} />
          </span>
        </button>
      </div>
    </aside>
  );
}

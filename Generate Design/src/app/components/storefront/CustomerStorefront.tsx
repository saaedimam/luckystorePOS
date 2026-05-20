import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Search,
  MapPin,
  X,
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  Store,
  ChevronRight,
  CreditCard,
  Banknote,
} from "lucide-react";
import { PRODUCTS, type Product } from "../pos/data";
import { fmtTaka, toPaisa } from "../pos/math";
import { usePOSStore, type PaymentMethod } from "../../store";
import { BkashPaymentModal } from "./BkashPaymentModal";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)" as const;
const TRANSITION_FAST = { duration: 0.25, ease: [0.16, 1, 0.3, 0.99] as const };
const TRANSITION_MED = { duration: 0.3, ease: [0.16, 1, 0.3, 0.99] as const };

const CONSUMER_CATEGORIES = ["All", "Grocery", "Beverage", "Personal"] as const;
type ConsumerCategory = (typeof CONSUMER_CATEGORIES)[number];

interface CartItem {
  product: Product;
  qty: number;
}

interface ToastItem {
  id: string;
  title: string;
  description?: string;
}

// ─── Lightweight in-component toast ────────────────────────────────
function useStorefrontToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = (t: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  };
  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((x) => x.id !== id));
  return { toasts, push, dismiss };
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={TRANSITION_FAST}
            className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl min-w-[320px] max-w-[420px]"
            style={{
              background: "color-mix(in oklab, var(--surface-elevated) 92%, transparent)",
              borderColor: "var(--border)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div
              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full shrink-0"
              style={{ background: "var(--accent-emerald-soft)" }}
            >
              <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                style={{
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {t.title}
              </div>
              {t.description && (
                <div
                  className="mt-0.5"
                  style={{ color: "var(--text-secondary)", fontSize: 12 }}
                >
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-tertiary)" }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Header ────────────────────────────────────────────────────────
function StorefrontHeader({
  cartCount,
  onOpenCart,
}: {
  cartCount: number;
  onOpenCart: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "color-mix(in oklab, var(--background) 70%, transparent)",
        borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent-gold) 0%, #B8902F 100%)",
              boxShadow: "0 4px 12px -2px var(--accent-gold-soft)",
            }}
          >
            <Store size={16} style={{ color: "#0B0D12" }} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span
              style={{
                color: "var(--text-primary)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Lucky Store
            </span>
            <span
              style={{
                color: "var(--text-tertiary)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Storefront
            </span>
          </div>
        </div>

        {/* Location Gate Pill */}
        <button
          className="hidden sm:flex items-center gap-2 h-9 px-3.5 rounded-full border transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            transitionDuration: "300ms",
            transitionTimingFunction: EASE,
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75"
              style={{ background: "var(--accent-emerald)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--accent-emerald)" }}
            />
          </span>
          <MapPin size={12} style={{ color: "var(--text-secondary)" }} />
          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Delivering to
          </span>
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Banani / Gulshan
          </span>
          <ChevronRight size={12} style={{ color: "var(--text-tertiary)" }} />
        </button>

        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-2 h-9 px-3.5 rounded-full border transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            transitionDuration: "300ms",
            transitionTimingFunction: EASE,
          }}
        >
          <ShoppingBag size={14} style={{ color: "var(--text-primary)" }} />
          <span
            style={{
              color: "var(--text-primary)",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            Cart
          </span>
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={TRANSITION_FAST}
                className="num inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full"
                style={{
                  background: "var(--accent-gold)",
                  color: "#0B0D12",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}

// ─── Product Card ──────────────────────────────────────────────────
function ConsumerProductCard({
  product,
  qty,
  onAdd,
  onInc,
  onDec,
}: {
  product: Product;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const inCart = qty > 0;
  const outOfStock = product.stock === 0;

  return (
    <motion.div
      layout
      transition={TRANSITION_MED}
      className="group relative rounded-2xl border overflow-hidden flex flex-col"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
        transitionTimingFunction: EASE,
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${product.thumb}22 0%, ${product.thumb}05 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-16 w-16 rounded-2xl"
            style={{
              background: product.thumb,
              boxShadow: `0 12px 32px -8px ${product.thumb}66`,
            }}
          />
        </div>
        {outOfStock && (
          <div
            className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md"
            style={{
              background: "var(--accent-rose-soft)",
              color: "var(--accent-rose)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Out of stock
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col p-3.5 gap-2">
        <div className="min-h-[44px]">
          <div
            className="truncate"
            style={{
              color: "var(--text-primary)",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </div>
          <div
            className="truncate"
            style={{
              color: "var(--text-tertiary)",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.4,
              marginTop: 2,
            }}
          >
            {product.nameBn}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div
            className="num"
            style={{
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ৳{product.price.toFixed(2)}
          </div>

          {/* Stepper / Add — fixed height to prevent layout shift */}
          <div className="h-8 relative" style={{ minWidth: 100 }}>
            <AnimatePresence mode="wait" initial={false}>
              {!inCart ? (
                <motion.button
                  key="add"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={TRANSITION_FAST}
                  disabled={outOfStock}
                  onClick={onAdd}
                  className="absolute inset-0 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    borderColor: "var(--border)",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    transitionTimingFunction: EASE,
                    transitionDuration: "300ms",
                  }}
                  onMouseEnter={(e) => {
                    if (outOfStock) return;
                    e.currentTarget.style.background = "var(--surface-elevated)";
                    e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  Add to Cart
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={TRANSITION_FAST}
                  className="absolute inset-0 flex items-stretch rounded-lg overflow-hidden"
                  style={{
                    background: "var(--accent-gold)",
                    boxShadow: "0 4px 14px -4px var(--accent-gold-soft)",
                  }}
                >
                  <button
                    onClick={onDec}
                    className="flex-1 flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ color: "#0B0D12" }}
                  >
                    <Minus size={13} strokeWidth={2.5} />
                  </button>
                  <div
                    className="num flex items-center justify-center px-1 min-w-[24px]"
                    style={{
                      color: "#0B0D12",
                      fontSize: 12,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {qty}
                  </div>
                  <button
                    onClick={onInc}
                    className="flex-1 flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ color: "#0B0D12" }}
                  >
                    <Plus size={13} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Slide-over Cart ───────────────────────────────────────────────
function CartDrawer({
  open,
  onClose,
  items,
  onInc,
  onDec,
  onRemove,
  onPlaceOrder,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  onPlaceOrder: (whatsapp: string, address: string, paymentMethod: PaymentMethod, bkashTrxId?: string) => void;
}) {
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [bkashModalOpen, setBkashModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const subtotalPaisa = items.reduce(
    (acc, it) => acc + toPaisa(it.product.price) * it.qty,
    0
  );
  const deliveryPaisa = items.length > 0 ? 6000 : 0;
  const totalPaisa = subtotalPaisa + deliveryPaisa;

  // Bangladeshi WhatsApp: 01XXXXXXXXX (11 digits starting with 01) or +8801XXXXXXXXX
  const phoneClean = whatsapp.replace(/\s|-/g, "");
  const phoneValid = /^(?:\+?880)?01[3-9]\d{8}$/.test(phoneClean);
  const addressValid = address.trim().length >= 12;
  const canSubmit = items.length > 0 && phoneValid && addressValid;

  const handleSubmit = () => {
    setSubmitted(true);
    if (!canSubmit) return;

    if (paymentMethod === "bKash") {
      // Open bKash payment modal
      setBkashModalOpen(true);
    } else {
      // COD: place order immediately
      onPlaceOrder(phoneClean, address.trim(), "COD");
      setWhatsapp("");
      setAddress("");
      setPaymentMethod("COD");
      setSubmitted(false);
    }
  };

  const handleBkashSuccess = (accountNumber: string, trxId: string) => {
    setBkashModalOpen(false);
    onPlaceOrder(phoneClean, address.trim(), "bKash", trxId);
    setWhatsapp("");
    setAddress("");
    setPaymentMethod("COD");
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_FAST}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 0.99] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[440px] flex flex-col border-l"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 h-16 border-b shrink-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} style={{ color: "var(--text-primary)" }} />
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Your Cart
                </span>
                <span
                  className="num"
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {items.reduce((a, i) => a + i.qty, 0)} items
                </span>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 flex items-center justify-center rounded-full border transition-colors"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ background: "var(--surface-elevated)" }}
                  >
                    <ShoppingBag size={18} style={{ color: "var(--text-tertiary)" }} />
                  </div>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Your cart is empty
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: -10 }}
                        transition={TRANSITION_FAST}
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{
                          background: "var(--surface-elevated)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <div
                          className="h-12 w-12 rounded-lg shrink-0"
                          style={{
                            background: item.product.thumb,
                            boxShadow: `0 4px 12px -2px ${item.product.thumb}55`,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className="truncate"
                            style={{
                              color: "var(--text-primary)",
                              fontSize: 12.5,
                              fontWeight: 600,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {item.product.name}
                          </div>
                          <div
                            className="num mt-0.5"
                            style={{
                              color: "var(--text-tertiary)",
                              fontSize: 11,
                              fontWeight: 500,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            ৳{item.product.price.toFixed(2)} × {item.qty}
                          </div>
                        </div>

                        <div
                          className="flex items-stretch rounded-md overflow-hidden h-7"
                          style={{ border: "1px solid var(--border)" }}
                        >
                          <button
                            onClick={() => onDec(item.product.id)}
                            className="w-7 flex items-center justify-center"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <Minus size={11} />
                          </button>
                          <div
                            className="num w-7 flex items-center justify-center"
                            style={{
                              color: "var(--text-primary)",
                              fontSize: 11,
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {item.qty}
                          </div>
                          <button
                            onClick={() => onInc(item.product.id)}
                            className="w-7 flex items-center justify-center"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemove(item.product.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-md transition-colors"
                          style={{ color: "var(--text-tertiary)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--accent-rose)";
                            e.currentTarget.style.background = "var(--accent-rose-soft)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-tertiary)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer: breakdown + checkout */}
            {items.length > 0 && (
              <div
                className="shrink-0 border-t px-6 py-4 flex flex-col gap-4"
                style={{ borderColor: "var(--border)" }}
              >
                {/* Breakdown */}
                <div className="flex flex-col gap-1.5">
                  <Row label="Subtotal" value={fmtTaka(subtotalPaisa)} />
                  <Row label="Delivery Fee" value={fmtTaka(deliveryPaisa)} />
                  <div className="h-px my-1" style={{ background: "var(--border)" }} />
                  <Row label="Total Due" value={fmtTaka(totalPaisa)} emphasize />
                </div>

                {/* Guest Checkout form */}
                <div className="flex flex-col gap-2.5">
                  <div
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Guest Checkout
                  </div>
                  <Field
                    label="WhatsApp Number"
                    placeholder="01XXXXXXXXX"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    error={submitted && !phoneValid ? "Enter a valid BD number" : undefined}
                    inputMode="tel"
                  />
                  <Field
                    label="Complete Delivery Address"
                    placeholder="House, road, area, landmark…"
                    value={address}
                    onChange={setAddress}
                    error={
                      submitted && !addressValid
                        ? "Please add a complete address"
                        : undefined
                    }
                    textarea
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="flex flex-col gap-2">
                  <div
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Payment Method
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(["COD", "bKash"] as PaymentMethod[]).map((method) => {
                      const active = method === paymentMethod;
                      return (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className="h-12 rounded-lg border transition-all flex flex-col items-center justify-center gap-1"
                          style={{
                            background: active ? "var(--surface-elevated)" : "transparent",
                            borderColor: active
                              ? method === "bKash"
                                ? "#E2136E"
                                : "var(--accent-gold)"
                              : "var(--border)",
                            borderWidth: active ? 2 : 1,
                            transitionTimingFunction: EASE,
                            transitionDuration: "300ms",
                          }}
                        >
                          {method === "COD" ? (
                            <Banknote
                              size={16}
                              style={{
                                color: active ? "var(--accent-gold)" : "var(--text-secondary)",
                              }}
                            />
                          ) : (
                            <CreditCard
                              size={16}
                              style={{ color: active ? "#E2136E" : "var(--text-secondary)" }}
                            />
                          )}
                          <span
                            style={{
                              color: active ? "var(--text-primary)" : "var(--text-secondary)",
                              fontSize: 11,
                              fontWeight: active ? 700 : 600,
                              letterSpacing: "-0.01em",
                            }}
                          >
                            {method === "COD" ? "Cash on Delivery" : "bKash"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={items.length === 0}
                  className="h-11 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      paymentMethod === "bKash" ? "#E2136E" : "var(--accent-gold)",
                    color: paymentMethod === "bKash" ? "white" : "#0B0D12",
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    boxShadow:
                      paymentMethod === "bKash"
                        ? "0 8px 24px -8px rgba(226, 19, 110, 0.3)"
                        : "0 8px 24px -8px var(--accent-gold-soft)",
                    transitionTimingFunction: EASE,
                    transitionDuration: "300ms",
                  }}
                >
                  Place Order
                  {paymentMethod === "COD" && (
                    <span style={{ opacity: 0.7, fontWeight: 600 }}>· Cash on Delivery</span>
                  )}
                </button>
              </div>
            )}
          </motion.aside>

          {/* bKash Payment Modal */}
          <BkashPaymentModal
            open={bkashModalOpen}
            onClose={() => setBkashModalOpen(false)}
            onSuccess={handleBkashSuccess}
            amount={fmtTaka(totalPaisa)}
          />
        </>
      )}
    </AnimatePresence>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        style={{
          color: emphasize ? "var(--text-primary)" : "var(--text-secondary)",
          fontSize: emphasize ? 13 : 12,
          fontWeight: emphasize ? 700 : 500,
          letterSpacing: emphasize ? "-0.01em" : undefined,
        }}
      >
        {label}
      </span>
      <span
        className="num"
        style={{
          color: "var(--text-primary)",
          fontSize: emphasize ? 16 : 12.5,
          fontWeight: emphasize ? 700 : 600,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  inputMode,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: "tel" | "text" | "email";
  textarea?: boolean;
}) {
  const baseStyle = {
    background: "var(--input-background)",
    border: `1px solid ${error ? "var(--accent-rose)" : "var(--border)"}`,
    color: "var(--text-primary)",
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    outline: "none",
    transitionTimingFunction: EASE,
    transitionDuration: "300ms",
  } as const;

  return (
    <label className="flex flex-col gap-1.5">
      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="resize-none rounded-lg px-3 py-2.5 transition-colors focus:border-[var(--accent-blue)]"
          style={baseStyle}
        />
      ) : (
        <input
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-lg px-3 transition-colors focus:border-[var(--accent-blue)]"
          style={baseStyle}
        />
      )}
      {error && (
        <span
          style={{
            color: "var(--accent-rose)",
            fontSize: 10.5,
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </label>
  );
}

// ─── Main Storefront ───────────────────────────────────────────────
export function CustomerStorefront({
  onOrderPlaced,
}: {
  onOrderPlaced?: (orderId: string) => void;
} = {}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ConsumerCategory>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { toasts, push, dismiss } = useStorefrontToast();
  const addOnlineOrder = usePOSStore((s) => s.addOnlineOrder);

  const cartMap = useMemo(() => {
    const m = new Map<string, number>();
    cart.forEach((c) => m.set(c.product.id, c.qty));
    return m;
  }, [cart]);

  const cartCount = cart.reduce((a, i) => a + i.qty, 0);

  const products = useMemo(() => {
    return PRODUCTS.filter((p) => {
      // Consumer storefront only carries 3 categories
      const allowedCats: Product["category"][] = ["Grocery", "Beverage", "Personal"];
      if (!allowedCats.includes(p.category)) return false;
      if (category !== "All" && p.category !== category) return false;
      if (
        query &&
        !p.name.toLowerCase().includes(query.toLowerCase()) &&
        !p.nameBn.includes(query)
      )
        return false;
      return true;
    });
  }, [query, category]);

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.product.id === p.id);
      if (existing) {
        return prev.map((x) =>
          x.product.id === p.id ? { ...x, qty: x.qty + 1 } : x
        );
      }
      return [...prev, { product: p, qty: 1 }];
    });
  };
  const inc = (id: string) =>
    setCart((prev) =>
      prev.map((x) => (x.product.id === id ? { ...x, qty: x.qty + 1 } : x))
    );
  const dec = (id: string) =>
    setCart((prev) =>
      prev
        .map((x) => (x.product.id === id ? { ...x, qty: x.qty - 1 } : x))
        .filter((x) => x.qty > 0)
    );
  const remove = (id: string) =>
    setCart((prev) => prev.filter((x) => x.product.id !== id));

  const placeOrder = (phone: string, address: string, paymentMethod: PaymentMethod, bkashTrxId?: string) => {
    const items = cart.map((c) => ({
      id: c.product.id,
      name: c.product.name,
      qty: c.qty,
      price: toPaisa(c.product.price),
    }));
    const orderId = addOnlineOrder({
      customerName: "Guest Customer",
      customerWhatsApp: phone,
      deliveryZone: address.length > 36 ? address.slice(0, 36) + "…" : address,
      items,
      deliveryFee: 6000,
      paymentMethod,
      paymentStatus: paymentMethod === "bKash" ? "PAID" : "UNPAID",
      bkashTrxId,
    });
    setCart([]);
    setCartOpen(false);
    push({
      title: paymentMethod === "bKash" ? "Payment successful!" : "Order sent to store!",
      description:
        paymentMethod === "bKash"
          ? `${orderId} · Paid via bKash · We'll WhatsApp you shortly.`
          : `${orderId} · Cash on delivery · We'll WhatsApp you shortly.`,
    });
    // Hand off to order tracking view after the toast is visible
    setTimeout(() => onOrderPlaced?.(orderId), 1400);
  };

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      <StorefrontHeader
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Hero + Search */}
      <section className="mx-auto max-w-[1280px] px-6 pt-10 pb-6">
        <div className="flex flex-col gap-1.5 mb-6">
          <span
            style={{
              color: "var(--accent-gold)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Fresh · Fast · Local
          </span>
          <h1
            style={{
              color: "var(--text-primary)",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.08,
            }}
          >
            Your neighborhood store,
            <br />
            <span style={{ color: "var(--text-tertiary)" }}>
              delivered in 30 minutes.
            </span>
          </h1>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 h-12 px-4 rounded-xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            transitionTimingFunction: EASE,
            transitionDuration: "300ms",
          }}
        >
          <Search size={15} style={{ color: "var(--text-tertiary)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands, or categories…"
            className="flex-1 bg-transparent outline-none"
            style={{
              color: "var(--text-primary)",
              fontSize: 13.5,
              fontWeight: 500,
              letterSpacing: "-0.01em",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="h-6 w-6 flex items-center justify-center rounded-full"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--surface-elevated)",
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 -mx-1 px-1">
          {CONSUMER_CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="shrink-0 h-9 px-4 rounded-full border transition-all"
                style={{
                  background: active ? "var(--text-primary)" : "var(--surface)",
                  borderColor: active ? "var(--text-primary)" : "var(--border)",
                  color: active ? "var(--background)" : "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  transitionTimingFunction: EASE,
                  transitionDuration: "300ms",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-[1280px] px-6 pb-32">
        {products.length === 0 ? (
          <div
            className="h-64 rounded-2xl border flex flex-col items-center justify-center gap-2"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              No products match your search
            </div>
            <div
              style={{
                color: "var(--text-tertiary)",
                fontSize: 12,
              }}
            >
              Try a different category or term
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ConsumerProductCard
                key={p.id}
                product={p}
                qty={cartMap.get(p.id) ?? 0}
                onAdd={() => addToCart(p)}
                onInc={() => inc(p.id)}
                onDec={() => dec(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onInc={inc}
        onDec={dec}
        onRemove={remove}
        onPlaceOrder={placeOrder}
      />

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

export default CustomerStorefront;

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)" as const;
const TRANSITION_FAST = { duration: 0.25, ease: [0.16, 1, 0.3, 0.99] as const };
const TRANSITION_MED = { duration: 0.3, ease: [0.16, 1, 0.3, 0.99] as const };

// bKash brand color adapted for dark mode
const BKASH_PINK = "#E2136E";
const BKASH_PINK_SOFT = "rgba(226, 19, 110, 0.15)";

interface BkashPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (accountNumber: string, trxId: string) => void;
  amount: string;
}

export function BkashPaymentModal({
  open,
  onClose,
  onSuccess,
  amount,
}: BkashPaymentModalProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Bangladeshi bKash: 01XXXXXXXXX (11 digits starting with 01)
  const accountClean = accountNumber.replace(/\s|-/g, "");
  const accountValid = /^01[3-9]\d{8}$/.test(accountClean);

  // Transaction ID format: 8-10 alphanumeric characters
  const trxIdClean = trxId.trim().toUpperCase();
  const trxIdValid = /^[A-Z0-9]{8,10}$/.test(trxIdClean);

  const canSubmit = accountValid && trxIdValid;

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;

    setIsProcessing(true);

    // Simulate payment verification (300ms delay)
    await new Promise((resolve) => setTimeout(resolve, 300));

    setIsProcessing(false);
    onSuccess(accountClean, trxIdClean);

    // Reset state
    setAccountNumber("");
    setTrxId("");
    setSubmitted(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_FAST}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={TRANSITION_MED}
              className="pointer-events-auto w-full max-w-[440px] rounded-2xl border overflow-hidden"
              style={{
                background: `color-mix(in oklab, var(--surface) 92%, transparent)`,
                borderColor: `color-mix(in oklab, ${BKASH_PINK} 30%, var(--border))`,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: `0 20px 60px -12px ${BKASH_PINK_SOFT}, 0 0 0 1px color-mix(in oklab, ${BKASH_PINK} 10%, transparent) inset`,
              }}
            >
              {/* Header */}
              <div
                className="relative px-6 py-5 border-b"
                style={{
                  background: `linear-gradient(135deg,
                    color-mix(in oklab, ${BKASH_PINK} 12%, var(--surface-elevated)) 0%,
                    color-mix(in oklab, ${BKASH_PINK} 6%, var(--surface-elevated)) 100%)`,
                  borderColor: `color-mix(in oklab, ${BKASH_PINK} 20%, var(--border))`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                    style={{
                      background: BKASH_PINK,
                      boxShadow: `0 4px 16px -4px ${BKASH_PINK_SOFT}`,
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="white"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" />
                      <path d="M7 10H9V17H7V10ZM11 7H13V17H11V7ZM15 13H17V17H15V13Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 15,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      bKash Payment
                    </div>
                    <div
                      className="num"
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: 600,
                        marginTop: 2,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      Amount: {amount}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="h-8 w-8 flex items-center justify-center rounded-full transition-all"
                    style={{
                      color: "var(--text-secondary)",
                      background: "var(--surface-elevated)",
                      transitionTimingFunction: EASE,
                      transitionDuration: "300ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-elevated)";
                      e.currentTarget.style.color = "var(--text-secondary)";
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-6 space-y-5">
                {/* Instructions */}
                <div
                  className="rounded-xl p-4 border"
                  style={{
                    background: `color-mix(in oklab, ${BKASH_PINK} 8%, var(--surface-elevated))`,
                    borderColor: `color-mix(in oklab, ${BKASH_PINK} 20%, var(--border))`,
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      size={16}
                      style={{ color: BKASH_PINK, marginTop: 1, flexShrink: 0 }}
                    />
                    <div>
                      <div
                        style={{
                          color: "var(--text-primary)",
                          fontSize: 12,
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Payment Instructions
                      </div>
                      <ol
                        className="space-y-1.5"
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 11.5,
                          fontWeight: 500,
                          lineHeight: 1.5,
                          paddingLeft: 16,
                        }}
                      >
                        <li>Open your bKash app and complete payment</li>
                        <li>
                          Send <strong style={{ color: "var(--text-primary)" }}>{amount}</strong> to
                          merchant number
                        </li>
                        <li>Copy the Transaction ID (TrxID) from your confirmation</li>
                        <li>Enter your bKash account number and TrxID below</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Account Number Field */}
                <Field
                  label="Your bKash Account Number"
                  placeholder="01XXXXXXXXX"
                  value={accountNumber}
                  onChange={setAccountNumber}
                  error={
                    submitted && !accountValid ? "Enter a valid bKash account number" : undefined
                  }
                  inputMode="tel"
                  icon={
                    accountValid ? (
                      <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                    ) : undefined
                  }
                />

                {/* Transaction ID Field */}
                <Field
                  label="Transaction ID (TrxID)"
                  placeholder="e.g., BKX7H3M2P9"
                  value={trxId}
                  onChange={setTrxId}
                  error={
                    submitted && !trxIdValid
                      ? "Enter a valid 8-10 character Transaction ID"
                      : undefined
                  }
                  icon={
                    trxIdValid ? (
                      <CheckCircle2 size={14} style={{ color: "var(--accent-emerald)" }} />
                    ) : undefined
                  }
                />

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isProcessing}
                  className="w-full h-12 rounded-xl flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
                  style={{
                    background: BKASH_PINK,
                    color: "white",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "-0.01em",
                    opacity: isProcessing ? 0.6 : 1,
                    boxShadow: isProcessing ? "none" : `0 8px 24px -8px ${BKASH_PINK_SOFT}`,
                    transitionTimingFunction: EASE,
                    transitionDuration: "300ms",
                  }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Verifying Payment...
                    </>
                  ) : (
                    "Confirm Payment"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  inputMode,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: "tel" | "text";
  icon?: React.ReactNode;
}) {
  const baseStyle = {
    background: "var(--input-background)",
    border: `1px solid ${error ? "var(--accent-rose)" : "var(--border)"}`,
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    outline: "none",
    transitionTimingFunction: EASE,
    transitionDuration: "300ms",
  } as const;

  return (
    <label className="flex flex-col gap-2">
      <span
        style={{
          color: "var(--text-secondary)",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <div className="relative">
        <input
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 rounded-lg px-3.5 pr-10 transition-colors focus:border-[var(--accent-blue)]"
          style={baseStyle}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={TRANSITION_FAST}
          style={{
            color: "var(--accent-rose)",
            fontSize: 11,
            fontWeight: 500,
          }}
        >
          {error}
        </motion.span>
      )}
    </label>
  );
}

export default BkashPaymentModal;

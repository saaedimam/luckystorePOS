import { useMemo } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Circle,
  ChefHat,
  Truck,
  Package,
  MessageCircle,
  Store,
  Clock,
} from "lucide-react";
import { usePOSStore, type OrderStatus } from "../../store";
import { fmtTaka } from "../pos/math";
import { format } from "date-fns";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)" as const;
const TRANSITION_FAST = { duration: 0.25, ease: [0.16, 1, 0.3, 0.99] as const };

interface TimelineStep {
  id: OrderStatus;
  label: string;
  icon: typeof Package;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { id: "Pending", label: "Order Placed", icon: Package },
  { id: "Preparing", label: "Preparing", icon: ChefHat },
  { id: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { id: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: OrderStatus): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.id === status);
  return idx === -1 ? 0 : idx;
}

function TimelineNode({
  step,
  isActive,
  isPast,
  isLast,
}: {
  step: TimelineStep;
  isActive: boolean;
  isPast: boolean;
  isLast: boolean;
}) {
  const Icon = step.icon;
  const completed = isPast && !isActive;

  return (
    <div className="relative flex gap-4">
      {/* Icon + Connector */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={false}
          animate={{
            scale: isActive ? [1, 1.08, 1] : 1,
            backgroundColor: completed
              ? "var(--accent-emerald)"
              : isActive
              ? "var(--accent-gold)"
              : "var(--surface-elevated)",
          }}
          transition={
            isActive
              ? { duration: 1.2, repeat: Infinity, ease: [0.16, 1, 0.3, 0.99] }
              : { duration: 0.3, ease: [0.16, 1, 0.3, 0.99] }
          }
          className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 shrink-0"
          style={{
            borderColor: completed
              ? "var(--accent-emerald)"
              : isActive
              ? "var(--accent-gold)"
              : "var(--border)",
            boxShadow: isActive
              ? "0 0 0 4px var(--accent-gold-soft), 0 8px 20px -4px var(--accent-gold-soft)"
              : completed
              ? "0 4px 12px -2px var(--accent-emerald-soft)"
              : undefined,
          }}
        >
          <Icon
            size={16}
            strokeWidth={2.5}
            style={{
              color: completed
                ? "#0B0D12"
                : isActive
                ? "#0B0D12"
                : "var(--text-tertiary)",
            }}
          />
          {isActive && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "var(--accent-gold)" }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.div>

        {/* Vertical connector */}
        {!isLast && (
          <div
            className="absolute top-10 w-0.5 h-full"
            style={{
              left: "50%",
              transform: "translateX(-50%)",
              background:
                completed || isActive ? "var(--accent-emerald)" : "var(--border)",
              transition: `background 300ms ${EASE}`,
            }}
          />
        )}
      </div>

      {/* Label */}
      <div className="flex-1 pb-12 pt-1.5">
        <div
          style={{
            color: isActive || completed ? "var(--text-primary)" : "var(--text-secondary)",
            fontSize: 14,
            fontWeight: isActive ? 700 : 600,
            letterSpacing: "-0.01em",
            transition: `all 300ms ${EASE}`,
          }}
        >
          {step.label}
        </div>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITION_FAST}
            className="flex items-center gap-1.5 mt-1"
            style={{ color: "var(--accent-gold)", fontSize: 11, fontWeight: 600 }}
          >
            <Clock size={11} />
            Processing now
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function OrderStatusTracking({ orderId }: { orderId: string }) {
  const order = usePOSStore((s) => s.onlineOrders.find((o) => o.id === orderId));

  const whatsappMessages = useMemo(() => {
    if (!order) return [];
    const msgs: { time: string; text: string }[] = [];
    const baseTime = order.createdAt.getTime();

    msgs.push({
      time: format(order.createdAt, "h:mm a"),
      text: "Order Confirmation Sent",
    });

    if (
      order.whatsappState === "sent_accepted" ||
      order.whatsappState === "sent_ready" ||
      order.whatsappState === "sent_delivered"
    ) {
      msgs.push({
        time: format(new Date(baseTime + 60000 * 5), "h:mm a"),
        text: "Order Accepted - Preparing Now",
      });
    }

    if (order.whatsappState === "sent_ready" || order.whatsappState === "sent_delivered") {
      msgs.push({
        time: format(new Date(baseTime + 60000 * 15), "h:mm a"),
        text: "Order Ready - Out for Delivery",
      });
    }

    if (order.whatsappState === "sent_delivered") {
      msgs.push({
        time: format(new Date(baseTime + 60000 * 30), "h:mm a"),
        text: "Order Delivered - Thank you!",
      });
    }

    return msgs;
  }, [order]);

  if (!order) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "var(--background)" }}
      >
        <div
          className="text-center"
          style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}
        >
          Order not found
        </div>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const subtotalPaisa = order.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const totalPaisa = subtotalPaisa + order.deliveryFee;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "color-mix(in oklab, var(--background) 70%, transparent)",
          borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto max-w-[720px] px-6 h-16 flex items-center justify-between gap-6">
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
                Order Tracking
              </span>
            </div>
          </div>

          <div
            className="px-3 py-1.5 rounded-md"
            style={{
              background: "var(--surface-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="num"
              style={{
                color: "var(--text-primary)",
                fontSize: 12,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {order.id}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[720px] px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* Order Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={TRANSITION_FAST}
            className="rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="mb-4"
              style={{
                color: "var(--text-tertiary)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Order Summary
            </div>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="num"
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: 12,
                        fontWeight: 600,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {item.qty}×
                    </span>
                    <span
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {item.name}
                    </span>
                  </div>
                  <span
                    className="num"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: 12,
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtTaka(item.price * item.qty)}
                  </span>
                </div>
              ))}

              <div className="h-px my-2" style={{ background: "var(--border)" }} />

              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                  Delivery Fee
                </span>
                <span
                  className="num"
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    fontWeight: 600,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtTaka(order.deliveryFee)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Total
                </span>
                <span
                  className="num"
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 16,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {fmtTaka(totalPaisa)}
                </span>
              </div>
            </div>

            {/* Payment info */}
            <div
              className="mt-4 pt-4 border-t flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                Payment Method
              </span>
              <div className="flex items-center gap-2">
                {order.paymentMethod === "bKash" && (
                  <div
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: "#E2136E",
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}
                  >
                    bKash
                  </div>
                )}
                <span
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {order.paymentMethod === "bKash" ? "PAID" : "Cash on Delivery"}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Timeline Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_FAST, delay: 0.1 }}
            className="rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="mb-5"
              style={{
                color: "var(--text-tertiary)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Delivery Status
            </div>

            <div className="pl-1">
              {TIMELINE_STEPS.map((step, idx) => (
                <TimelineNode
                  key={step.id}
                  step={step}
                  isActive={idx === currentStepIndex}
                  isPast={idx <= currentStepIndex}
                  isLast={idx === TIMELINE_STEPS.length - 1}
                />
              ))}
            </div>
          </motion.div>

          {/* WhatsApp Notifications Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_FAST, delay: 0.2 }}
            className="rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: "#25D366",
                  boxShadow: "0 4px 12px -2px rgba(37, 211, 102, 0.3)",
                }}
              >
                <MessageCircle size={14} style={{ color: "white" }} strokeWidth={2.5} />
              </div>
              <div>
                <div
                  style={{
                    color: "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Live WhatsApp Updates
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 500,
                    marginTop: 1,
                  }}
                >
                  Enabled for {order.customerWhatsApp}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {whatsappMessages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...TRANSITION_FAST, delay: 0.3 + idx * 0.05 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg"
                  style={{ background: "var(--surface-elevated)" }}
                >
                  <Circle
                    size={6}
                    fill="var(--accent-emerald)"
                    style={{ color: "var(--accent-emerald)", marginTop: 4 }}
                  />
                  <div className="flex-1">
                    <div
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      {msg.text}
                    </div>
                    <div
                      className="num"
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: 10,
                        fontWeight: 500,
                        marginTop: 2,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {msg.time}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Delivery Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION_FAST, delay: 0.25 }}
            className="rounded-2xl border p-6"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <div
              className="mb-3"
              style={{
                color: "var(--text-tertiary)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Delivery Address
            </div>
            <div
              style={{
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {order.deliveryZone}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default OrderStatusTracking;

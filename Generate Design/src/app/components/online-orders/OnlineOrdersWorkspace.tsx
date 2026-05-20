import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Bike,
  PackageSearch,
  Ban,
  ChefHat,
  Sparkles,
} from "lucide-react";
import { usePOSStore, type OnlineOrder } from "../../store";

function formatPrice(paisa: number) {
  return (paisa / 100).toFixed(2);
}

function timeElapsed(date: Date, now: Date) {
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  return `${diffHrs}h ${diffMins % 60}m ago`;
}

function isOverdue(date: Date, now: Date) {
  return now.getTime() - date.getTime() > 10 * 60000;
}

const STATUS_TONE: Record<
  OnlineOrder["status"],
  { color: string; bg: string }
> = {
  Pending: { color: "var(--accent-rose)", bg: "var(--accent-rose-soft)" },
  Preparing: { color: "var(--accent-amber)", bg: "var(--accent-amber-soft)" },
  "Out for Delivery": {
    color: "var(--accent-blue)",
    bg: "var(--accent-blue-soft)",
  },
  Rejected: { color: "var(--text-tertiary)", bg: "var(--surface-elevated)" },
};

export function OnlineOrdersWorkspace() {
  const orders = usePOSStore((s) => s.onlineOrders);
  const acceptOrder = usePOSStore((s) => s.acceptOrder);
  const markOrderReady = usePOSStore((s) => s.markOrderReady);
  const rejectOrder = usePOSStore((s) => s.rejectOrder);
  const lastCreatedOrderId = usePOSStore((s) => s.lastCreatedOrderId);
  const clearLastCreatedOrderId = usePOSStore((s) => s.clearLastCreatedOrderId);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      ),
    [orders]
  );

  const [activeOrderId, setActiveOrderId] = useState<string | null>(
    sortedOrders[0]?.id ?? null
  );
  const [now, setNow] = useState(new Date());

  // Auto-focus on a newly created order from the storefront
  useEffect(() => {
    if (lastCreatedOrderId) {
      setActiveOrderId(lastCreatedOrderId);
      clearLastCreatedOrderId();
    }
  }, [lastCreatedOrderId, clearLastCreatedOrderId]);

  // Ensure an active order is selected if available
  useEffect(() => {
    if (!activeOrderId && sortedOrders.length > 0) {
      setActiveOrderId(sortedOrders[0].id);
    }
  }, [activeOrderId, sortedOrders]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const activeOrder = orders.find((o) => o.id === activeOrderId);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {/* LEFT PANE: 35% */}
      <div
        className="w-[35%] flex flex-col border-r border-border"
        style={{ backgroundColor: "var(--surface)" }}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-heading text-primary">Incoming Queue</h2>
            <p className="text-caption mt-1 text-secondary">
              <span className="num">{pendingCount}</span> Pending ·{" "}
              <span className="num">{orders.length}</span> Total
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          <AnimatePresence initial={false}>
            {sortedOrders.map((order) => {
              const active = activeOrderId === order.id;
              const overdue =
                order.status === "Pending" && isOverdue(order.createdAt, now);
              const isFreshWeb =
                order.source === "web" &&
                now.getTime() - order.createdAt.getTime() < 8000;
              const tone = STATUS_TONE[order.status];

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setActiveOrderId(order.id)}
                  className="cursor-pointer border rounded-xl p-4 transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: active
                      ? "var(--surface-elevated)"
                      : "transparent",
                    borderColor: active
                      ? "var(--border-hover)"
                      : "var(--border)",
                    boxShadow: active
                      ? "0 4px 12px rgba(0,0,0,0.18)"
                      : "none",
                    transitionDuration: "300ms",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  {isFreshWeb && (
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.6, ease: "easeInOut" }}
                      className="absolute inset-y-0 left-0 w-1/3 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, var(--accent-gold-soft) 50%, transparent 100%)",
                      }}
                    />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-subheading num">{order.id}</span>
                      {order.source === "web" && (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 h-4 rounded"
                          style={{
                            background: "var(--accent-gold-soft)",
                            color: "var(--accent-gold)",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}
                        >
                          <Sparkles size={8} />
                          WEB
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-caption px-2 py-0.5 rounded flex items-center gap-1 ${
                        overdue ? "animate-pulse" : ""
                      }`}
                      style={{
                        backgroundColor: overdue
                          ? "var(--accent-rose-soft)"
                          : "var(--surface)",
                        color: overdue
                          ? "var(--accent-rose)"
                          : "var(--text-secondary)",
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      {timeElapsed(order.createdAt, now)}
                    </span>
                  </div>
                  <div className="text-body mb-1">{order.customerName}</div>
                  <div
                    className="text-caption text-secondary mb-3 truncate"
                    style={{ fontSize: 11 }}
                  >
                    {order.deliveryZone}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="text-micro px-2 py-1 rounded border"
                      style={{
                        borderColor: tone.bg,
                        color: tone.color,
                        backgroundColor: tone.bg,
                      }}
                    >
                      {order.status}
                    </span>
                    <span
                      className="num"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: 12,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ৳
                      {formatPrice(
                        order.items.reduce(
                          (a, i) => a + i.price * i.qty,
                          0
                        ) + order.deliveryFee
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT PANE: 65% */}
      <div
        className="w-[65%] flex flex-col relative"
        style={{ backgroundColor: "var(--background)" }}
      >
        <AnimatePresence mode="wait">
          {activeOrder ? (
            <motion.div
              key={activeOrder.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col h-full w-full"
            >
              {/* HEADER */}
              <div
                className="px-8 py-6 border-b border-border flex justify-between items-start shrink-0"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <div>
                  <h1 className="text-hero num">{activeOrder.id}</h1>
                  <div className="flex items-center gap-4 mt-2 text-secondary text-body">
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4" />
                      <span className="num">
                        {activeOrder.customerWhatsApp}
                      </span>
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Bike className="w-4 h-4" />
                      {activeOrder.deliveryZone}
                    </span>
                  </div>
                </div>

                {/* WHATSAPP TELEMETRY */}
                <div
                  className="px-4 py-3 rounded-lg border border-border flex flex-col gap-2 min-w-[220px]"
                  style={{ backgroundColor: "var(--background)" }}
                >
                  <div className="text-caption text-secondary">
                    WhatsApp State Machine
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: "var(--accent-emerald)" }}
                    />
                    <span style={{ color: "var(--text-primary)" }}>
                      {activeOrder.whatsappState === "sent_received"
                        ? "Order Received: Sent"
                        : activeOrder.whatsappState === "sent_accepted"
                        ? "Order Accepted: Sent"
                        : activeOrder.whatsappState === "sent_ready"
                        ? "Rider Dispatched: Sent"
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ITEMS LEDGER */}
              <div className="flex-1 overflow-y-auto p-8">
                <div
                  className="rounded-xl border border-border overflow-hidden"
                  style={{ backgroundColor: "var(--surface)" }}
                >
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className="border-b border-border"
                        style={{ backgroundColor: "var(--background)" }}
                      >
                        <th className="px-6 py-4 text-caption text-secondary font-medium w-16">
                          Qty
                        </th>
                        <th className="px-6 py-4 text-caption text-secondary font-medium">
                          Item
                        </th>
                        <th className="px-6 py-4 text-caption text-secondary font-medium text-right">
                          Price
                        </th>
                        <th className="px-6 py-4 text-caption text-secondary font-medium text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeOrder.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={
                            idx !== activeOrder.items.length - 1
                              ? "border-b border-border"
                              : ""
                          }
                        >
                          <td className="px-6 py-4 text-body num font-semibold">
                            {item.qty}x
                          </td>
                          <td className="px-6 py-4 text-body text-primary">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 text-body text-secondary text-right num">
                            ৳{formatPrice(item.price)}
                          </td>
                          <td className="px-6 py-4 text-body text-primary text-right num font-semibold">
                            ৳{formatPrice(item.price * item.qty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="border-t border-border px-6 py-5 flex flex-col items-end gap-1.5 bg-background/50">
                    <div className="flex items-center gap-6 text-secondary">
                      <span className="text-caption">Subtotal</span>
                      <span
                        className="num"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        ৳
                        {formatPrice(
                          activeOrder.items.reduce(
                            (acc, item) => acc + item.price * item.qty,
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-secondary">
                      <span className="text-caption">Delivery Fee</span>
                      <span
                        className="num"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        ৳{formatPrice(activeOrder.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 mt-1">
                      <span className="text-caption text-secondary">Total Due</span>
                      <span className="num-financial">
                        ৳
                        {formatPrice(
                          activeOrder.items.reduce(
                            (acc, item) => acc + item.price * item.qty,
                            0
                          ) + activeOrder.deliveryFee
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION ENGINE */}
              <div
                className="shrink-0 border-t border-border p-6 flex items-center justify-end gap-4"
                style={{ backgroundColor: "var(--surface)" }}
              >
                {activeOrder.status === "Pending" && (
                  <>
                    <button
                      onClick={() => rejectOrder(activeOrder.id)}
                      className="px-6 py-3 rounded-lg flex items-center gap-2 transition-opacity hover:opacity-80"
                      style={{
                        color: "var(--accent-rose)",
                        backgroundColor: "var(--accent-rose-soft)",
                      }}
                    >
                      <Ban className="w-5 h-5" />
                      Reject & Refund
                    </button>
                    <button
                      onClick={() => acceptOrder(activeOrder.id)}
                      className="px-8 py-3 rounded-lg flex items-center gap-2 text-white transition-opacity hover:opacity-90 shadow-lg shadow-emerald-500/20"
                      style={{ backgroundColor: "var(--accent-emerald)" }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Accept & Reserve Stock
                    </button>
                  </>
                )}

                {activeOrder.status === "Preparing" && (
                  <button
                    onClick={() => markOrderReady(activeOrder.id)}
                    className="px-8 py-3 rounded-lg flex items-center gap-2 text-black transition-opacity hover:opacity-90 shadow-lg shadow-amber-500/20"
                    style={{ backgroundColor: "var(--accent-gold)" }}
                  >
                    <ChefHat className="w-5 h-5" />
                    Mark Ready for Rider
                  </button>
                )}

                {activeOrder.status === "Out for Delivery" && (
                  <div className="px-6 py-3 rounded-lg flex items-center gap-2 text-secondary">
                    <PackageSearch className="w-5 h-5" />
                    Waiting for rider completion
                  </div>
                )}

                {activeOrder.status === "Rejected" && (
                  <div
                    className="px-6 py-3 rounded-lg flex items-center gap-2"
                    style={{ color: "var(--accent-rose)" }}
                  >
                    <Ban className="w-5 h-5" />
                    Order rejected & refunded
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary flex-col gap-4">
              <PackageSearch className="w-12 h-12 opacity-20" />
              <p className="text-body">Select an order from the queue</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

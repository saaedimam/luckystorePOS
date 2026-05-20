import { useState } from "react";
import { Showcase } from "./components/Showcase";
import { POSWorkspace } from "./components/pos/POSWorkspace";
import { SystemShowcase } from "./components/SystemShowcase";
import { OnlineOrdersWorkspace } from "./components/online-orders/OnlineOrdersWorkspace";
import { CustomerStorefront } from "./components/storefront/CustomerStorefront";
import { OrderStatusTracking } from "./components/storefront/OrderStatusTracking";
import { ToastProvider } from "./components/ToastSystem";
import { usePOSStore } from "./store";
import { Store, LayoutDashboard } from "lucide-react";

type AdminView = "pos" | "tokens" | "admin" | "online-orders";
type Mode = "admin" | "storefront" | "storefront-tracking";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function App() {
  const [mode, setMode] = useState<Mode>("admin");
  const [view, setView] = useState<AdminView>("online-orders");
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const pendingOrdersCount = usePOSStore((state) => state.pendingOrdersCount);

  return (
    <ToastProvider>
    <div className="dark relative size-full bg-background text-foreground min-h-screen">
      {mode === "storefront" ? (
        <CustomerStorefront
          onOrderPlaced={(orderId) => {
            setTrackingOrderId(orderId);
            setMode("storefront-tracking");
          }}
        />
      ) : mode === "storefront-tracking" && trackingOrderId ? (
        <OrderStatusTracking orderId={trackingOrderId} />
      ) : (
        <>
          {view === "pos" && <POSWorkspace />}
          {view === "online-orders" && <OnlineOrdersWorkspace />}
          {view === "tokens" && <Showcase />}
          {view === "admin" && <SystemShowcase />}
        </>
      )}

      {/* Top-right Admin POS / Public Storefront toggle */}
      <div
        className="fixed top-4 right-4 z-[60] inline-flex items-center gap-1 p-1 rounded-full border shadow-lg backdrop-blur-xl"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "color-mix(in oklab, var(--surface) 80%, transparent)",
        }}
      >
        {([
          { id: "admin" as Mode, label: "Admin POS", Icon: LayoutDashboard },
          { id: "storefront" as Mode, label: "Public Storefront", Icon: Store },
        ]).map(({ id, label, Icon }) => {
          const active = mode === id || (id === "storefront" && mode === "storefront-tracking");
          return (
            <button
              key={id}
              onClick={() => {
                if (id === "admin") {
                  setView("online-orders");
                  setMode("admin");
                } else {
                  setMode("storefront");
                }
              }}
              className="relative h-8 px-3.5 rounded-full flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: active ? "var(--surface-elevated)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                boxShadow: active ? "inset 0 0 0 1px var(--border)" : undefined,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: "0.02em",
                transitionDuration: "300ms",
                transitionTimingFunction: EASE,
              }}
            >
              <Icon size={12} strokeWidth={2.25} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Admin sub-view switcher (only visible in admin mode) */}
      {mode === "admin" && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-1 p-1.5 rounded-full border shadow-lg backdrop-blur-xl"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "color-mix(in oklab, var(--surface) 80%, transparent)",
          }}
        >
          {(["pos", "online-orders", "admin", "tokens"] as AdminView[]).map((v) => {
            const active = v === view;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className="relative h-8 px-4 rounded-full transition-all duration-300 flex items-center gap-2"
                style={{
                  backgroundColor: active ? "var(--surface-elevated)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: active ? "inset 0 0 0 1px var(--border)" : undefined,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  transitionTimingFunction: EASE,
                }}
              >
                {v === "pos"
                  ? "Checkout"
                  : v === "online-orders"
                  ? "Online Orders"
                  : v === "admin"
                  ? "Architecture"
                  : "Tokens"}
                {v === "online-orders" && pendingOrdersCount > 0 && (
                  <span
                    className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ml-1"
                    style={{ backgroundColor: "var(--accent-rose)" }}
                  >
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                      style={{ backgroundColor: "var(--accent-rose)" }}
                    ></span>
                    <span className="relative text-[10px] font-bold text-white num leading-none">
                      {pendingOrdersCount}
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
    </ToastProvider>
  );
}

import { usePOSStore } from "../store";
import { formatCurrency } from "../types";
import { OfflineBanner } from "./OfflineBanner";
import { ToastProvider, useToast } from "./ToastSystem";
import { Wifi, WifiOff, AlertTriangle, Printer, Database, CheckCircle2, Zap } from "lucide-react";

export function SystemShowcase() {
  const { isOnline, offlineQueueCount, toggleOnline, incrementOfflineQueue } = usePOSStore();
  
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <OfflineBanner />
        
        <main className="flex-1 p-8 max-w-4xl mx-auto w-full pt-16">
          <div className="space-y-8">
            <header className="space-y-2">
              <h1 className="text-hero">System Architecture</h1>
              <p className="text-subheading text-text-secondary">
                Resilient, offline-first frontend architecture stress test.
              </p>
            </header>

            <section className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-heading flex items-center gap-2">
                    <Zap className="size-5 text-blue" />
                    Network State
                  </h2>
                  <p className="text-body text-text-secondary mt-1">
                    Toggle connection to simulate network loss
                  </p>
                </div>
                <button
                  onClick={toggleOnline}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isOnline 
                      ? "bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/20" 
                      : "bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  {isOnline ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
                  <span className="font-semibold text-sm">
                    {isOnline ? "Force Offline" : "Restore Connection"}
                  </span>
                </button>
              </div>

              <div>
                <h3 className="text-subheading mb-4">State Inspection</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-surface-elevated border border-border">
                    <div className="text-caption text-text-tertiary mb-1">Status</div>
                    <div className="text-heading font-mono flex items-center gap-2">
                      <div className={`size-2.5 rounded-full ${isOnline ? "bg-emerald" : "bg-rose"}`} />
                      {isOnline ? "CONNECTED" : "DISCONNECTED"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-surface-elevated border border-border">
                    <div className="text-caption text-text-tertiary mb-1">Local Queue</div>
                    <div className="text-heading font-mono num">{offlineQueueCount} pending</div>
                  </div>
                </div>
              </div>
            </section>

            <StressTestSection />

            <section className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-6">
              <div className="border-b border-border pb-4">
                <h2 className="text-heading flex items-center gap-2">
                  <Database className="size-5 text-gold" />
                  Type Validation
                </h2>
                <p className="text-body text-text-secondary mt-1">
                  Currency is handled as integer paisa/cents internally.
                </p>
              </div>
              
              <div className="p-4 rounded-lg bg-surface-elevated border border-border overflow-x-auto">
                <pre className="text-micro font-mono text-text-secondary">
                  {`// Mock Product Data
const product: Product = {
  id: "P-1001",
  name: "Espresso",
  sku: "COF-ESP-01",
  price: 25000, // 250.00 BDT
  stock: 45
};

console.log(formatCurrency(product.price));
// Output: ${formatCurrency(25000)}`}
                </pre>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

function StressTestSection() {
  const { addToast } = useToast();
  const { isOnline, incrementOfflineQueue } = usePOSStore();

  const handleSimulateSale = () => {
    if (isOnline) {
      addToast({
        title: "Sale Processed",
        description: "Transaction #TX-982 synced successfully.",
        variant: "success",
        icon: <CheckCircle2 className="size-4" />
      });
    } else {
      incrementOfflineQueue();
      addToast({
        title: "Sale Queued Locally",
        description: "Network unavailable. Transaction saved to local indexedDB.",
        variant: "warning",
        icon: <Database className="size-4" />
      });
    }
  };

  const handleSimulateDrop = () => {
    addToast({
      title: "Network Dropped",
      description: "Connection to main server lost. Switching to offline mode.",
      variant: "error",
      icon: <WifiOff className="size-4" />
    });
  };

  const handleSimulatePrinter = () => {
    addToast({
      title: "Printer Disconnected",
      description: "EPSON TM-T88VI not responding on USB port.",
      variant: "warning",
      icon: <Printer className="size-4" />
    });
  };

  const handleSimulateAPI = () => {
    addToast({
      title: "API Error: 503",
      description: "Inventory sync failed. Upstream service unavailable.",
      variant: "error",
      icon: <AlertTriangle className="size-4" />
    });
  };

  return (
    <section className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-heading">System Stress Test</h2>
        <p className="text-body text-text-secondary mt-1">
          Trigger system events to test the Error Boundary and Toast Notification primitive.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={handleSimulateSale}
          className="p-4 rounded-lg border border-border bg-surface-elevated hover:border-emerald/50 hover:bg-emerald/5 text-left transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="font-semibold text-sm mb-1 text-foreground flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald" />
            Simulate Successful Sale
          </div>
          <div className="text-xs text-text-secondary">Process a test transaction</div>
        </button>

        <button
          onClick={handleSimulateDrop}
          className="p-4 rounded-lg border border-border bg-surface-elevated hover:border-rose/50 hover:bg-rose/5 text-left transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="font-semibold text-sm mb-1 text-foreground flex items-center gap-2">
            <WifiOff className="size-4 text-rose" />
            Simulate Network Drop
          </div>
          <div className="text-xs text-text-secondary">Force a connection failure event</div>
        </button>

        <button
          onClick={handleSimulatePrinter}
          className="p-4 rounded-lg border border-border bg-surface-elevated hover:border-amber/50 hover:bg-amber/5 text-left transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="font-semibold text-sm mb-1 text-foreground flex items-center gap-2">
            <Printer className="size-4 text-amber" />
            Simulate Printer Disconnect
          </div>
          <div className="text-xs text-text-secondary">Trigger peripheral failure</div>
        </button>

        <button
          onClick={handleSimulateAPI}
          className="p-4 rounded-lg border border-border bg-surface-elevated hover:border-rose/50 hover:bg-rose/5 text-left transition-all duration-300"
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div className="font-semibold text-sm mb-1 text-foreground flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose" />
            Simulate API Error
          </div>
          <div className="text-xs text-text-secondary">Trigger unhandled API exception</div>
        </button>
      </div>
    </section>
  );
}

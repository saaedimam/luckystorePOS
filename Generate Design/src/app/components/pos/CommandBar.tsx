import { Search, Bell, Smartphone, Printer, ScanLine, Command, Moon, Sun } from "lucide-react";
import { StatusDot } from "../StatusDot";
import { usePOSStore } from "../../store";

interface CommandBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  isDark: boolean;
  onToggleDark: () => void;
  now: string;
  cashier: string;
  onScan: () => void;
}

function HardwarePill({
  icon,
  label,
  status,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  status: "online" | "syncing" | "offline";
  accent: string;
}) {
  return (
    <div
      className="hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-md border transition-colors duration-300"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span style={{ color: accent }}>{icon}</span>
      <span className="text-micro" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <StatusDot status={status} showLabel={false} size={8} />
    </div>
  );
}

export function CommandBar({
  query,
  onQueryChange,
  isDark,
  onToggleDark,
  now,
  cashier,
  onScan,
}: CommandBarProps) {
  const { isOnline, toggleOnline } = usePOSStore();

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-xl"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "color-mix(in oklab, var(--background) 72%, transparent)",
      }}
    >
      <div className="h-16 px-6 flex items-center gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="h-8 w-8 rounded-md grid place-items-center"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-gold) 0%, color-mix(in oklab, var(--accent-gold) 60%, #000) 100%)",
              boxShadow:
                "0 0 0 1px rgba(212,168,67,0.35), 0 8px 24px -12px rgba(212,168,67,0.6)",
            }}
          >
            <span style={{ color: "#0B0D12", fontWeight: 800, fontSize: 14 }}>L</span>
          </div>
          <div className="hidden md:flex flex-col leading-none gap-1">
            <span className="text-body" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
              POS · Checkout
            </span>
            <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>
              Shift open · {cashier}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <label
            className="relative flex items-center gap-2 h-10 px-3 rounded-md border transition-colors duration-300"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            htmlFor="pos-search"
          >
            <Search size={16} style={{ color: "var(--text-tertiary)" }} />
            <input
              id="pos-search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search products, SKU, or scan a barcode…"
              className="flex-1 bg-transparent outline-none border-0 text-body"
              style={{
                color: "var(--text-primary)",
                textTransform: "none",
                letterSpacing: 0,
                fontSize: 14,
                fontWeight: 500,
              }}
            />
            <span
              className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border num"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-elevated)",
                color: "var(--text-tertiary)",
                fontSize: 11,
              }}
            >
              <Command size={10} />K
            </span>
          </label>
        </div>

        {/* Network + hardware cluster */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Scan trigger */}
          <button
            onClick={onScan}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-md border transition-[background-color,border-color,transform] duration-300 hover:-translate-y-px"
            style={{
              borderColor: "var(--accent-emerald)",
              backgroundColor: "var(--accent-emerald-soft)",
              color: "var(--accent-emerald)",
              fontSize: 12,
              fontWeight: 700,
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <ScanLine size={14} />
            <span className="hidden md:inline">Scan</span>
          </button>
          <button
            onClick={toggleOnline}
            className="hidden md:inline-flex items-center gap-2 h-9 px-3 rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{ 
              borderColor: isOnline ? "var(--border)" : "var(--accent-amber-soft)", 
              backgroundColor: isOnline ? "var(--surface)" : "color-mix(in oklab, var(--accent-amber) 10%, transparent)",
            }}
          >
            <StatusDot status={isOnline ? "online" : "offline"} showLabel={false} />
            <span className="text-micro transition-colors" style={{ color: isOnline ? "var(--text-secondary)" : "var(--accent-amber)" }}>
              {isOnline ? "Network · Live" : "Offline"}
            </span>
            <span className="text-micro" style={{ color: "var(--text-tertiary)" }}>·</span>
            <span className="text-micro num" style={{ color: "var(--text-tertiary)" }}>
              {now}
            </span>
          </button>

          <HardwarePill
            icon={<Smartphone size={14} />}
            label="bKash"
            status="online"
            accent="var(--accent-blue)"
          />
          <HardwarePill
            icon={<Printer size={14} />}
            label="Printer"
            status="online"
            accent="var(--accent-emerald)"
          />
          <HardwarePill
            icon={<ScanLine size={14} />}
            label="Scanner"
            status="syncing"
            accent="var(--accent-amber)"
          />

          <button
            onClick={onToggleDark}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text-secondary)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-md border transition-colors duration-300 hover:bg-[var(--surface-elevated)]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text-secondary)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-label="Notifications"
          >
            <Bell size={14} />
            <span
              className="absolute -top-1 -right-1 num grid place-items-center rounded-full"
              style={{
                backgroundColor: "var(--accent-rose)",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                height: 16,
                minWidth: 16,
                padding: "0 4px",
              }}
            >
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

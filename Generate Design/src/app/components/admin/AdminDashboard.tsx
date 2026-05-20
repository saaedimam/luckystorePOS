import { useState, type ElementType } from "react";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
  ArrowDown
} from "lucide-react";
import { MetricCard } from "../MetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { cn } from "../ui/utils";
import { InventoryGrid } from "./InventoryGrid";
import { SettingsView } from "./SettingsView";

type AdminView = "dashboard" | "sales" | "inventory" | "settings";

// Dummy data
const TRANSACTIONS = [
  { id: "TRX-1092", time: "10:42 AM", amount: "৳ 4,500", items: 3, status: "completed", customer: "Walk-in" },
  { id: "TRX-1091", time: "10:35 AM", amount: "৳ 12,200", items: 8, status: "completed", customer: "Jane Doe" },
  { id: "TRX-1090", time: "10:15 AM", amount: "৳ 850", items: 1, status: "refunded", customer: "Walk-in" },
  { id: "TRX-1089", time: "09:55 AM", amount: "৳ 3,400", items: 2, status: "completed", customer: "John Smith" },
  { id: "TRX-1088", time: "09:30 AM", amount: "৳ 1,200", items: 1, status: "completed", customer: "Walk-in" },
];

export function AdminDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7d" | "14d" | "30d">("7d");
  const [adminView, setAdminView] = useState<AdminView>("dashboard");

  const navItems: { icon: ElementType; label: string; view: AdminView }[] = [
    { icon: LayoutDashboard, label: "Dashboard",  view: "dashboard" },
    { icon: Receipt,         label: "Sales",      view: "sales" },
    { icon: Package,         label: "Inventory",  view: "inventory" },
    { icon: Settings,        label: "Settings",   view: "settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside 
        className={cn(
          "relative flex flex-col border-r border-white/10 bg-surface transition-all duration-300 ease-out-expo",
          sidebarExpanded ? "w-[240px]" : "w-[64px]"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b" style={{ borderColor: "var(--border)" }}>
          {sidebarExpanded && (
            <div className="flex items-center gap-2 font-bold tracking-tight">
              <div className="size-6 rounded bg-accent-gold" style={{ backgroundColor: "var(--accent-gold)" }} />
              <span>Lucky Store</span>
            </div>
          )}
          {!sidebarExpanded && (
            <div className="mx-auto size-6 rounded bg-accent-gold" style={{ backgroundColor: "var(--accent-gold)" }} />
          )}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = adminView === item.view;
            return (
              <button
                key={item.label}
                onClick={() => setAdminView(item.view)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 transition-colors duration-200",
                  !sidebarExpanded && "justify-center px-0"
                )}
                style={{
                  backgroundColor: active ? "var(--surface-elevated)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "var(--surface-elevated)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
              >
                <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                {sidebarExpanded && (
                  <span style={{ fontSize: 14, fontWeight: active ? 600 : 500 }}>
                    {item.label}
                  </span>
                )}
                {/* Active accent bar */}
                {active && sidebarExpanded && (
                  <div
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ backgroundColor: "var(--accent-gold)" }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="flex w-full items-center justify-center rounded-md p-2 text-text-secondary hover:bg-surface-elevated hover:text-foreground transition-colors"
          >
            {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Inventory view bypasses the shared header ──────────────────── */}
        {adminView === "inventory" && <InventoryGrid />}

        {/* ── Shared top header (dashboard + other views) ────────────────── */}
        {adminView !== "inventory" && (
        <>
        <header className="flex h-16 shrink-0 items-center justify-between px-8 border-b bg-surface/50 backdrop-blur-md sticky top-0 z-10" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-heading">
            {adminView === "dashboard" ? "Command Center"
             : adminView === "sales"   ? "Sales Overview"
             : "Settings"}
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
              <input 
                type="text" 
                placeholder="Search orders, items..." 
                className="h-9 w-64 rounded-md border bg-input-background pl-9 pr-4 text-sm outline-none focus:ring-1 focus:ring-ring transition-all"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--input-background)" }}
              />
            </div>
            <div className="size-9 rounded-full bg-surface-elevated border flex items-center justify-center" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-bold">JD</span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          {(adminView === "dashboard" || adminView === "sales") && (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
              {/* Top: Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <MetricCard
              label="Today's Revenue"
              value="৳ 45,200"
              delta="+14.2%"
              trend="up"
              sparkline={[2, 4, 3, 5, 8, 6, 9]}
              accent="emerald"
            />
            <MetricCard
              label="Total Orders"
              value="142"
              delta="-2.1%"
              trend="down"
              sparkline={[9, 7, 8, 6, 5, 4, 3]}
              accent="rose"
            />
            <MetricCard
              label="Avg Order Value"
              value="৳ 318"
              delta="+5.4%"
              trend="up"
              sparkline={[3, 3, 4, 3, 5, 4, 5]}
              accent="gold"
            />
            <MetricCard
              label="Sync Status"
              value="Online"
              delta="Last synced: 2m ago"
              trend="neutral"
              accent="blue"
              sparkline={[1, 1, 1, 1, 1, 1, 1]}
            />
          </div>

          {/* Middle: Revenue Analytics */}
          <section className="rounded-xl border bg-surface p-6 flex flex-col gap-6" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-subheading">Revenue Analytics</h2>
              <div className="flex rounded-lg border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-elevated)" }}>
                {(["7d", "14d", "30d"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={cn(
                      "px-3 py-1 rounded-md text-caption transition-colors duration-200",
                      chartPeriod === period 
                        ? "bg-surface text-primary shadow-sm" 
                        : "text-text-secondary hover:text-foreground"
                    )}
                    style={chartPeriod === period ? { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" } : {}}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Glassmorphic Chart Skeleton */}
            <div className="relative h-[300px] w-full rounded-lg overflow-hidden flex items-end">
              {/* Cartesian Grid Background */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                  backgroundSize: "40px 40px",
                  backgroundPosition: "left bottom"
                }}
              />
              
              {/* Mock Bars */}
              <div className="relative z-10 w-full h-full flex items-end justify-between px-2 pb-0 gap-1.5 pt-8">
                {Array.from({ length: chartPeriod === "7d" ? 7 : chartPeriod === "14d" ? 14 : 30 }).map((_, i) => {
                  const isGold = i % 3 === 0;
                  const height = 20 + Math.random() * 70;
                  return (
                    <div 
                      key={i} 
                      className="w-full rounded-t-sm relative group transition-all duration-500 overflow-hidden"
                      style={{ 
                        height: `${height}%`,
                        backgroundColor: isGold ? "var(--accent-gold-soft)" : "var(--surface-elevated)",
                        borderTop: "1px solid",
                        borderTopColor: isGold ? "var(--accent-gold)" : "var(--border)"
                      }}
                    >
                      <div 
                        className="absolute bottom-0 w-full transition-all duration-500 opacity-20 group-hover:opacity-50"
                        style={{ 
                          height: "100%",
                          background: isGold ? "linear-gradient(to top, var(--accent-gold), transparent)" : "linear-gradient(to top, var(--text-primary), transparent)"
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Bottom: Recent Transactions */}
          <section className="rounded-xl border bg-surface overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
            <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-subheading">Recent Transactions</h2>
              <button className="flex items-center gap-2 text-text-secondary hover:text-foreground transition-colors">
                <Filter size={16} />
                <span className="text-body">Filter</span>
              </button>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-border" style={{ borderColor: "var(--border)" }}>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-1">Transaction ID <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-1">Time <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-1">Customer <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-1">Items <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group">
                    <div className="flex items-center gap-1">Status <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="text-micro text-text-tertiary uppercase font-bold tracking-wider cursor-pointer hover:text-foreground transition-colors group text-right">
                    <div className="flex items-center justify-end gap-1">Amount <ArrowDown className="opacity-0 group-hover:opacity-50 w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSACTIONS.map((trx) => (
                  <TableRow key={trx.id} className="border-b-border cursor-pointer group hover:bg-surface-elevated transition-colors" style={{ borderColor: "var(--border)" }}>
                    <TableCell className="font-mono text-xs text-text-primary">{trx.id}</TableCell>
                    <TableCell className="text-text-secondary num">{trx.time}</TableCell>
                    <TableCell className="text-text-primary">{trx.customer}</TableCell>
                    <TableCell className="num text-text-primary">{trx.items}</TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border" 
                           style={{ 
                             borderColor: "var(--border)",
                             backgroundColor: trx.status === "completed" ? "var(--accent-emerald-soft)" : "var(--accent-amber-soft)",
                             color: trx.status === "completed" ? "var(--accent-emerald)" : "var(--accent-amber)"
                           }}>
                        <div className={cn("size-1.5 rounded-full", trx.status === "completed" ? "bg-accent-emerald" : "bg-accent-amber")} 
                             style={{ backgroundColor: trx.status === "completed" ? "var(--accent-emerald)" : "var(--accent-amber)" }} />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{trx.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right num font-medium">{trx.amount}</TableCell>
                    <TableCell>
                      <button className="p-1 rounded-md text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface-elevated hover:text-foreground">
                        <MoreHorizontal size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
        )}
        
        {adminView === "settings" && <SettingsView />}
        </div>
        </>
        )}
      </main>
    </div>
  );
}

import React from 'react';
import {
  Search,
  Terminal,
  Activity,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Sliders,
  Wifi,
  WifiOff,
  Lock,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import { PageContainer } from '../../layouts/PageContainer';
import { Sparkline } from '../../components/ui/Sparkline';
import { format, parseISO, subDays } from 'date-fns';
import clsx from 'clsx';
import { LowStockItem, DayGroup } from '../../hooks/useDashboardMetrics';

export interface UserType {
  name: string | null;
  role: string | null;
}

export interface StatsType {
  store_name?: string;
  user?: UserType | null;
}

export interface PaymentBreakdown {
  cash: number;
  bkash: number;
  credit: number;
}

export interface GroupedFeedItem {
  id: string;
  type: string;
  title: string;
  timeLabel: string;
  amount?: number;
  cashier?: string;
  category?: string;
  description?: string | null;
  sku?: string | null;
  itemName?: string;
  currentQty?: number;
  minQty?: number;
  daysUntilStockout?: number;
  avgDailySales?: number;
  itemId?: string;
}

export interface MetricsType {
  availableBalance: number;
  totalRevenue: number;
  totalExpensesAllTime: number;
  netPosition: number;
  paymentBreakdown: PaymentBreakdown;
  totalCash: number;
  totalBkash: number;
  totalCredit: number;
  mohammedCapital: number;
  sayeedCapital: number;
  criticalProcurementItems: LowStockItem[];
  groupedFeed: DayGroup[];
  todayCashTotal: number;
  salesTrend?: 'up' | 'down' | null;
  sparklineData: number[];
}

export interface ManagerPartnerViewProps {
  stats: StatsType | undefined;
  userRole: string;
  user: UserType | null;
  density: 'compact' | 'comfortable';
  setDensity: React.Dispatch<React.SetStateAction<'compact' | 'comfortable'>>;
  isOnline: boolean;
  showCmdK: boolean;
  setShowCmdK: (show: boolean) => void;
  cmdSearch: string;
  setCmdSearch: (s: string) => void;
  cmdSearchInputRef: React.RefObject<HTMLInputElement | null>;
  refetchAll: () => void;
  metrics: MetricsType;
  dismissedProjections: string[];
  setDismissedProjections: React.Dispatch<React.SetStateAction<string[]>>;
  filteredFeed: DayGroup[];
  handleQuickRestock: (itemId: string, sku: string, itemName: string) => Promise<void>;
  pendingRestocks: Record<string, boolean>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const ManagerPartnerView: React.FC<ManagerPartnerViewProps> = ({
  stats,
  userRole,
  user,
  density,
  setDensity,
  isOnline,
  showCmdK,
  setShowCmdK,
  cmdSearch,
  setCmdSearch,
  cmdSearchInputRef,
  refetchAll,
  metrics,
  dismissedProjections,
  setDismissedProjections,
  filteredFeed,
  handleQuickRestock,
  pendingRestocks,
  searchTerm,
  setSearchTerm,
  searchInputRef,
}) => {
  const isCompact = density === 'compact';
  const outerPaddingClass = isCompact ? 'max-w-4xl px-6 pt-6 pb-28' : 'max-w-5xl px-8 pt-10 pb-40';
  const pySectionClass = isCompact ? 'py-4' : 'py-7';
  const listSpacingClass = isCompact ? 'space-y-2' : 'space-y-4.5';
  const textPriceClass = isCompact ? 'text-lg font-bold font-mono' : 'text-2xl font-bold font-mono';

  const totalPayment = metrics.paymentBreakdown.cash + metrics.paymentBreakdown.bkash + metrics.paymentBreakdown.credit;
  const cashPct = totalPayment > 0 ? Math.round((metrics.paymentBreakdown.cash / totalPayment) * 100) : 0;
  const bkashPct = totalPayment > 0 ? Math.round((metrics.paymentBreakdown.bkash / totalPayment) * 100) : 0;
  const creditPct = totalPayment > 0 ? Math.max(0, 100 - cashPct - bkashPct) : 0;

  const fmt = (n: number) => n.toLocaleString('en-BD', { maximumFractionDigits: 0 });

  return (
    <PageContainer
      className={clsx(
        'mx-auto bg-background-default text-text-primary selection:bg-primary-subtle transition-all duration-300',
        outerPaddingClass
      )}
    >
      {/* 1. Header (Premium, Invisible Borders) */}
      <header className="flex justify-between items-end pb-6 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.08em] text-text-muted uppercase">
              {stats?.store_name || 'MAIN BRANCH'}
            </span>
            <span className={clsx(
              'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border flex items-center gap-1',
              userRole === 'partner' && 'bg-primary-subtle text-primary border-primary/20',
              userRole === 'manager' && 'bg-info-subtle text-info border-info/20',
              userRole === 'cashier' && 'bg-success-subtle text-success border-success/20',
              userRole === 'viewer' && 'bg-background-subtle text-text-muted border-border-default'
            )}>
              <Shield size={10} />
              {userRole}
            </span>
          </div>
          <h1 className={clsx('font-bold tracking-tight text-text-primary mt-1', isCompact ? 'text-2xl' : 'text-3.5xl')}>
            Welcome, {user?.name || stats?.user?.name || 'Mohammed'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Realtime Operational Activity & Ledger Control
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {/* persistent UI density slider toggle (Ghost Mode) */}
          <button
            onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-surface-default hover:bg-background-subtle border border-border-default rounded-md px-3 py-2 transition-all active:scale-95 shadow-sm"
            title="Toggle spacing layout density"
          >
            <Sliders size={13} className="text-text-muted" />
            <span className="hidden sm:inline text-text-muted font-normal">Density:</span>
            <span className="capitalize text-primary-default font-extrabold">{density}</span>
          </button>

          {/* Sync status widget */}
          <div
            className={clsx(
              'flex items-center gap-1 text-[10px] font-bold border rounded-md px-2.5 py-2 select-none shadow-sm',
              isOnline
                ? 'bg-success-subtle/30 text-success border-success/20'
                : 'bg-warning-subtle/30 text-warning border-warning/20'
            )}
            title={isOnline ? 'Active Connection to Cloud' : 'Offline Mode: Queueing in Outbox'}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden md:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <button
            onClick={() => setShowCmdK(true)}
            className="flex items-center gap-2 text-xs font-medium text-text-secondary bg-surface-default hover:bg-background-subtle border border-border-default rounded-md px-3 py-2 transition-all active:scale-95 shadow-sm"
          >
            <Terminal size={13} className="text-text-muted" />
            <span className="hidden sm:inline">Cmds</span>
            <kbd className="hidden sm:inline-block bg-background-subtle text-text-muted px-1.5 py-0.5 rounded border border-border-default font-mono text-[9px]">
              ⌘K
            </kbd>
          </button>
          <button
            onClick={refetchAll}
            className="p-2 border border-border-default rounded-md bg-surface-default text-text-secondary hover:bg-background-subtle transition-all active:scale-95"
            aria-label="Refetch page data"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* 2. Compressed Mini-Aggregates Summary Row (No Cards, Ultra Clean) */}
      <section className={clsx('border-b border-border-default grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6', pySectionClass)}>
        <div>
          <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase flex items-center gap-1">
            Available Balance
            {userRole === 'cashier' && <Lock size={10} className="text-text-muted" />}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={clsx(textPriceClass, 'tracking-tight text-text-primary tabular-nums')}>
              {userRole === 'cashier' ? '৳••••••' : `৳${fmt(metrics.availableBalance)}`}
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-text-muted mt-0.5">Capital + Revenue - Expenses</p>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase">
            Net Revenue (14d)
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className={clsx(textPriceClass, 'tracking-tight text-success tabular-nums')}>
              ৳{fmt(metrics.totalRevenue)}
            </span>
            <Sparkline
              data={metrics.sparklineData}
              width={70}
              height={18}
              strokeWidth={1.5}
            />
          </div>
          <p className="text-[9px] sm:text-[10px] text-text-muted mt-0.5">
            {metrics.salesTrend ? `${metrics.salesTrend === 'up' ? '↑' : '↓'} vs last week` : 'Stable trend'}
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase flex items-center gap-1">
            All-Time Expenses
            {userRole === 'cashier' && <Lock size={10} className="text-text-muted" />}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={clsx(textPriceClass, 'tracking-tight text-danger tabular-nums')}>
              {userRole === 'cashier' ? '৳••••••' : `৳${fmt(metrics.totalExpensesAllTime)}`}
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-text-muted mt-0.5">Stock & Operational Costs</p>
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase flex items-center gap-1">
            Net Capital
            {userRole === 'cashier' && <Lock size={10} className="text-text-muted" />}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={clsx(textPriceClass, 'tracking-tight text-text-primary tabular-nums')}>
              {userRole === 'cashier' ? '৳••••••' : `৳${fmt(metrics.netPosition)}`}
            </span>
            {userRole !== 'cashier' && (
              <span
                className={clsx(
                  'text-[9px] font-extrabold uppercase tracking-[0.02em]',
                  metrics.netPosition >= 0 ? 'text-success' : 'text-danger'
                )}
              >
                {metrics.netPosition >= 0 ? 'Profit' : 'Loss'}
              </span>
            )}
          </div>
          <p className="text-[9px] sm:text-[10px] text-text-muted mt-0.5">Revenue - All Expenses</p>
        </div>
      </section>

      {/* 3. Segmented Revenue Bar & Capital Inset (Hides for Cashier, Masked for Manager) */}
      {userRole !== 'cashier' && (
        <section className={clsx('border-b border-border-default', pySectionClass)}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase">
                Payment Channel Split
              </span>
              <div className="flex h-5 w-full bg-background-subtle rounded overflow-hidden mt-2 border border-border-default shadow-inner">
                {/* Cash Segment */}
                <div
                  className="bg-success-default h-full transition-all duration-300 relative group"
                  style={{ width: `${cashPct}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all select-none font-sans">
                    Cash ({cashPct}%)
                  </span>
                </div>

                {/* bKash Segment */}
                <div
                  className="bg-pink-500 h-full transition-all duration-300 relative group"
                  style={{ width: `${bkashPct}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all select-none font-sans">
                    bKash ({bkashPct}%)
                  </span>
                </div>

                {/* Credit Segment */}
                <div
                  className="bg-warning-default h-full transition-all duration-300 relative group"
                  style={{ width: `${creditPct}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 transition-all select-none font-sans">
                    Credit ({creditPct}%)
                  </span>
                </div>
              </div>

              {/* Legends row */}
              <div className="flex items-center gap-4 mt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-success-default rounded-sm"></span>
                  <span className="text-[10px] text-text-secondary font-medium font-mono">
                    Cash: ৳{fmt(metrics.totalCash)} ({cashPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-pink-500 rounded-sm"></span>
                  <span className="text-[10px] text-text-secondary font-medium font-mono">
                    bKash: ৳{fmt(metrics.totalBkash)} ({bkashPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-warning-default rounded-sm"></span>
                  <span className="text-[10px] text-text-secondary font-medium font-mono">
                    Credit: ৳{fmt(metrics.totalCredit)} ({creditPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Inset Capital Share Breakdown */}
            <div className="border border-border-default bg-surface-subtle p-3.5 rounded-md min-w-[240px] shadow-sm font-sans">
              <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase font-mono">
                Active Partner Capital Inset
              </span>
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-secondary">Mohammed (60%):</span>
                  <span className="font-mono text-text-primary">
                    {userRole === 'manager' ? '৳••••••' : `৳${fmt(metrics.mohammedCapital)}`}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-secondary">Sayeed (40%):</span>
                  <span className="font-mono text-text-primary">
                    {userRole === 'manager' ? '৳••••••' : `৳${fmt(metrics.sayeedCapital)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Filterable Unified Temporal Ledger Feed (No spatial tabs) */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-7">
        {/* Left Side: Operations Search & Sticky Filter Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-default border border-border-default p-4 rounded-md shadow-sm space-y-4">
            <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase block font-mono">
              Filter Operations Feed
            </span>

            {/* Realtime Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search transactions or SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background-subtle border border-border-default rounded px-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary-default focus:ring-1 focus:ring-primary-default font-medium transition-all font-sans"
              />
            </div>

            {/* Feed Status Summary details */}
            <div className="text-xs space-y-2 border-t border-border-default pt-4 font-sans">
              <div className="flex justify-between font-semibold">
                <span className="text-text-secondary">Total Feed Rows:</span>
                <span className="text-text-primary font-mono">
                  {filteredFeed.flatMap(g => g.items).length} items
                </span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-text-secondary font-mono">Critical Stock Alerts:</span>
                <span className="text-danger font-mono font-bold">
                  {metrics.criticalProcurementItems.length} SKU issues
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Ledger Feed List */}
        <div className="lg:col-span-2 space-y-6">
          {filteredFeed.map((group) => (
            <section key={group.dateStr} id={`date-${group.dateStr}`} className="space-y-2.5">
              {/* Sticky day summary header */}
              <div className="sticky top-0 bg-background-default/90 backdrop-blur-sm z-10 py-1.5 border-b border-border-default flex items-center justify-between font-mono">
                <h2 className="text-[10px] font-extrabold tracking-wider uppercase text-text-muted">
                  {group.displayDate}
                </h2>
                <div className="flex items-center gap-3 text-[10px] font-bold text-text-secondary">
                  <span>Rev: ৳{fmt(group.dayRevenue)}</span>
                  {userRole !== 'cashier' && <span>Exp: ৳{fmt(group.dayExpenses)}</span>}
                  {userRole !== 'cashier' && (
                    <span className={group.dayNet >= 0 ? 'text-success' : 'text-danger'}>
                      Net: ৳{fmt(group.dayNet)}
                    </span>
                  )}
                </div>
              </div>

              {/* Feed Items mapping */}
              <div className={listSpacingClass}>
                {group.items.map((item) => {
                  const flatItem = item as unknown as GroupedFeedItem;
                  const isStockoutAlert = flatItem.type === 'stockout_projection';
                  const isDismissed = dismissedProjections.includes(flatItem.id);

                  if (isDismissed) return null;

                  return (
                    <div
                      key={flatItem.id}
                      className={clsx(
                        'border bg-surface-default hover:bg-background-subtle rounded transition-all flex items-start gap-4 relative group select-none shadow-sm',
                        isStockoutAlert
                          ? 'border-warning-default/40 bg-warning-subtle/[0.04] hover:bg-warning-subtle/[0.08]'
                          : 'border-border-default',
                        isCompact ? 'p-3' : 'p-4.5'
                      )}
                    >
                      {/* Left: Indicator Icon & Vertical Connection Line */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div
                          className={clsx(
                            'rounded-full flex items-center justify-center',
                            isCompact ? 'w-5 h-5' : 'w-7 h-7',
                            flatItem.type === 'sale' && 'bg-success-subtle text-success',
                            flatItem.type === 'expense' && 'bg-danger-subtle text-danger',
                            flatItem.type === 'stock_alert' && 'bg-warning-subtle text-warning-default',
                            flatItem.type === 'sync' && 'bg-background-subtle text-text-muted',
                            isStockoutAlert && 'bg-warning-subtle text-warning-default'
                          )}
                        >
                          {flatItem.type === 'sale' && <ShoppingBag size={isCompact ? 11 : 14} />}
                          {flatItem.type === 'expense' && <Activity size={isCompact ? 11 : 14} />}
                          {flatItem.type === 'stock_alert' && <Terminal size={isCompact ? 11 : 14} />}
                          {flatItem.type === 'sync' && <Activity size={isCompact ? 11 : 14} />}
                          {isStockoutAlert && <Sparkles size={isCompact ? 11 : 14} />}
                        </div>
                      </div>

                      {/* Middle: Content details */}
                      {isStockoutAlert ? (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="bg-warning-default text-white font-extrabold uppercase text-[8px] px-1 py-0.5 rounded tracking-wider font-mono">
                              AI Prediction
                            </span>
                            <span className="text-[10px] font-bold text-text-muted font-mono">
                              SKU: {flatItem.sku}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-text-primary mt-1 font-sans">
                            Critical Stockout Risk in{' '}
                            <span className="text-danger font-extrabold font-mono text-sm underline decoration-wavy decoration-danger/40">
                              {(flatItem.daysUntilStockout || 0).toFixed(1)} days
                            </span>
                          </h4>
                          <p className="text-xs text-text-secondary mt-1 font-medium font-sans">
                            Product{' '}
                            <span className="text-text-primary font-bold">{flatItem.itemName}</span> is
                            selling at a speed of{' '}
                            <span className="font-bold text-text-primary font-mono">{(flatItem.avgDailySales || 0).toFixed(2)}/day</span>.
                          </p>

                          {/* Quick AI Restock buttons */}
                          <div className="flex items-center gap-2 mt-3.5">
                            <button
                              onClick={() =>
                                handleQuickRestock(
                                  flatItem.itemId || '',
                                  flatItem.sku || '',
                                  flatItem.itemName || 'Custom Product'
                                )
                              }
                              disabled={pendingRestocks[flatItem.itemId || '']}
                              className="text-[10px] font-bold bg-primary text-primary-on hover:bg-primary-hover border border-transparent rounded px-3 py-1.5 transition-all shadow-sm active:scale-95 cursor-pointer font-sans"
                            >
                              {pendingRestocks[flatItem.itemId || ''] ? 'Restocking...' : 'Order Restock Now'}
                            </button>
                            <button
                              onClick={() => {
                                setDismissedProjections((prev) => [...prev, flatItem.id]);
                              }}
                              className="text-[10px] font-bold text-text-secondary hover:text-text-primary bg-background-subtle hover:bg-border-default border border-border-default rounded px-3 py-1.5 transition-all active:scale-95 cursor-pointer font-sans"
                            >
                              Dismiss Alert
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0 font-sans">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                              {flatItem.title}
                            </h4>
                            <span className="text-[10px] font-bold text-text-muted font-mono whitespace-nowrap">
                              {flatItem.timeLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold text-text-muted uppercase font-mono tracking-wider">
                              {flatItem.type}
                            </span>
                            <span className="text-text-muted font-normal">•</span>
                            <span className="text-[10px] text-text-secondary font-medium truncate">
                              Cashier: {flatItem.cashier}
                            </span>
                          </div>

                          {/* Sub-text details per type */}
                          <div className="mt-1">
                            {flatItem.type === 'expense' && (
                              <p className="text-xs text-text-secondary font-mono leading-relaxed truncate">
                                Category:{' '}
                                <span className="text-text-primary font-bold capitalize">
                                  {flatItem.category}
                                </span>{' '}
                                | {flatItem.description || 'No description'}
                              </p>
                            )}
                            {flatItem.type === 'stock_alert' && (
                              <p className="text-xs text-text-secondary mt-0.5">
                                SKU: <span className="font-mono text-text-primary">{flatItem.sku || 'N/A'}</span>
                              </p>
                            )}
                            {flatItem.type === 'sync' && (
                              <p className="text-xs text-text-muted mt-0.5 leading-relaxed font-sans">
                                {flatItem.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Right aligned action & amount block */}
                      <div className="shrink-0 flex items-center gap-3 font-sans">
                        {flatItem.type === 'sale' && flatItem.amount !== undefined && (
                          <span className="font-bold font-mono text-success-dark text-right tabular-nums text-sm">
                            +৳{fmt(flatItem.amount)}
                          </span>
                        )}

                        {flatItem.type === 'expense' && flatItem.amount !== undefined && (
                          <span className="font-bold font-mono text-danger text-right tabular-nums text-sm">
                            -৳{fmt(flatItem.amount)}
                          </span>
                        )}

                        {flatItem.type === 'stock_alert' && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold font-mono text-danger tabular-nums text-xs">
                              {flatItem.currentQty} left (min: {flatItem.minQty})
                            </span>
                            <button
                              onClick={() =>
                                handleQuickRestock(
                                  flatItem.itemId || '',
                                  flatItem.sku || '',
                                  flatItem.itemName || 'Custom Product'
                                )
                              }
                              disabled={pendingRestocks[flatItem.itemId || '']}
                              className={clsx(
                                'text-[9px] font-bold px-2 py-1 rounded transition-all border outline-none active:scale-95 font-sans cursor-pointer',
                                pendingRestocks[flatItem.itemId || '']
                                  ? 'bg-background-subtle text-text-muted border-border-default cursor-not-allowed'
                                  : 'bg-primary text-primary-on hover:bg-primary-hover border-transparent shadow-sm'
                              )}
                            >
                              {pendingRestocks[flatItem.itemId || ''] ? 'Restocking...' : 'Order'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {filteredFeed.length === 0 && (
            <div className="text-center text-text-muted py-12 font-sans">
              No matching activity found in your operations feed.
            </div>
          )}
        </div>
      </main>

      {/* 5. Sticky Glassmorphic Timeline Scrubber (Bottom Navigation) */}
      {metrics.groupedFeed.length > 1 && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-default/85 backdrop-blur-md border border-border-default rounded-full px-4 py-2.5 shadow-lg z-40 flex items-center gap-2 max-w-lg transition-all duration-300 hover:scale-[1.02]">
          <span className="text-[9px] font-extrabold tracking-wider uppercase text-text-muted border-r border-border-default pr-2.5 mr-1 flex items-center gap-1 font-mono">
            <Clock size={11} className="text-primary-default" /> Timeline
          </span>

          <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap max-w-md no-scrollbar">
            {metrics.groupedFeed.map((group) => {
              const label =
                group.dateStr === format(new Date(), 'yyyy-MM-dd')
                  ? 'Today'
                  : group.dateStr === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                  ? 'Yesterday'
                  : format(parseISO(group.dateStr), 'dd MMM');

              return (
                <button
                  key={group.dateStr}
                  onClick={() => {
                    const el = document.getElementById(`date-${group.dateStr}`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[9px] font-bold text-text-secondary hover:text-primary-default hover:bg-background-subtle rounded-full px-2.5 py-1 transition-all cursor-pointer font-sans"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 6. Vercel-Style Command Palette (CmdK Modal Popup) */}
      {showCmdK && (
        <div
          className="fixed inset-0 bg-surface-overlay backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans"
          onClick={() => setShowCmdK(false)}
        >
          <div
            className="w-full max-w-md bg-surface-default/95 backdrop-blur-lg border border-border-default rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[380px] scale-in-animation z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Input field */}
            <div className="relative border-b border-border-default p-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input
                ref={cmdSearchInputRef}
                type="text"
                placeholder="Type a command or search action..."
                value={cmdSearch}
                onChange={(e) => setCmdSearch(e.target.value)}
                className="w-full bg-transparent pl-8 pr-4 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-medium font-sans"
              />
            </div>

            {/* List of actions */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <span className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase tracking-wider block font-mono">
                General Operations
              </span>

              {/* Action: Focus feed filter */}
              <button
                onClick={() => {
                  setShowCmdK(false);
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 100);
                }}
                className="w-full text-left text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-md px-3 py-2 flex items-center justify-between cursor-pointer font-sans"
              >
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-text-muted" />
                  <span>1. Focus Feed Search</span>
                </div>
                <ChevronRight size={12} className="text-text-muted" />
              </button>

              {/* Action: Toggle layout density */}
              <button
                onClick={() => {
                  setShowCmdK(false);
                  setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'));
                }}
                className="w-full text-left text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-md px-3 py-2 flex items-center justify-between cursor-pointer font-sans"
              >
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-text-muted" />
                  <span>2. Toggle Layout Density ({density === 'compact' ? 'Comfortable' : 'Compact'})</span>
                </div>
                <ChevronRight size={12} className="text-text-muted" />
              </button>

              {/* Action: Jump to active dates */}
              <span className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase tracking-wider block mt-3 font-mono">
                Timeline Jump
              </span>
              {metrics.groupedFeed.slice(0, 3).map((group, idx) => {
                const dateLabel =
                  group.dateStr === format(new Date(), 'yyyy-MM-dd')
                    ? 'Today'
                    : group.dateStr === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                    ? 'Yesterday'
                    : format(parseISO(group.dateStr), 'dd MMMM yyyy');

                return (
                  <button
                    key={group.dateStr}
                    onClick={() => {
                      setShowCmdK(false);
                      setTimeout(() => {
                        const el = document.getElementById(`date-${group.dateStr}`);
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className="w-full text-left text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-md px-3 py-2 flex items-center justify-between cursor-pointer font-sans"
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-text-muted" />
                      <span>
                        Jump to: {dateLabel}
                      </span>
                    </div>
                    <kbd className="text-[10px] text-text-muted font-mono bg-background-subtle px-1 border border-border-default rounded">
                      G {idx + 1}
                    </kbd>
                  </button>
                );
              })}

              {/* Action: Trigger Restock Orders */}
              {metrics.criticalProcurementItems.length > 0 && (
                <>
                  <span className="text-[10px] font-bold text-text-muted px-2 py-1 uppercase tracking-wider block mt-3 font-mono">
                    Restock Procurement Actions
                  </span>
                  {metrics.criticalProcurementItems.slice(0, 3).map((item) => {
                    const isPending = !!pendingRestocks[item.item_id];
                    return (
                      <button
                        key={item.item_id}
                        onClick={() => {
                          setShowCmdK(false);
                          handleQuickRestock(
                            item.item_id,
                            item.sku || '',
                            item.item_name
                          );
                        }}
                        disabled={isPending}
                        className="w-full text-left text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-background-subtle rounded-md px-3 py-2 flex items-center justify-between cursor-pointer font-sans"
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag size={14} className="text-text-muted" />
                          <span>
                            Restock: {item.item_name} ({item.current_qty} left)
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-primary-default bg-primary-subtle px-1.5 py-0.5 rounded uppercase">
                          {isPending ? 'Restocking' : 'Order Now'}
                        </span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer tips */}
            <div className="border-t border-border-default p-2 bg-background-subtle text-[10px] text-text-muted flex justify-between items-center px-3 font-mono">
              <span>Press <kbd className="font-mono bg-surface-default px-1 border rounded shadow-sm">ESC</kbd> to close</span>
              <span>Vercel-Inspired Console UI</span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default ManagerPartnerView;

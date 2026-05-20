import React from 'react';
import {
  Search,
  Terminal,
  Activity,
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
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { Badge } from '../../components/ui/Badge';
import { PageContainer } from '../../layouts/PageContainer';

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
  salesVsExpenses: unknown[];
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
            <Badge 
              variant={userRole === 'partner' ? 'warning' : userRole === 'manager' ? 'info' : userRole === 'cashier' ? 'success' : 'neutral'}
              className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1"
            >
              <Shield size={10} />
              {userRole}
            </Badge>
          </div>
          <h1 className={clsx('font-black tracking-tight text-text-primary mt-1', isCompact ? 'text-heading' : 'text-hero')}>
            Welcome, {user?.name || stats?.user?.name || 'Mohammed'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Realtime Operational Activity & Ledger Control
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setDensity((d) => (d === 'compact' ? 'comfortable' : 'compact'))}
          >
            <Sliders size={13} className="mr-2 text-text-muted" />
            <span className="capitalize text-primary font-black">{density}</span>
          </Button>

          <Badge
            variant={isOnline ? 'success' : 'warning'}
            className="flex items-center gap-1.5 px-3 py-2 shadow-sm rounded-md"
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span className="hidden md:inline">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </Badge>

          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setShowCmdK(true)}
          >
            <Terminal size={13} className="mr-2 text-text-muted" />
            <kbd className="hidden sm:inline-block bg-background-subtle text-text-muted px-1.5 py-0.5 rounded border border-border-default font-mono text-[9px]">⌘K</kbd>
          </Button>
          
          <Button
            variant="tertiary"
            size="sm"
            onClick={refetchAll}
          >
            <RefreshCw size={13} />
          </Button>
        </div>
      </header>

      {/* 2. Premium Metrics Cards */}
      <section className={clsx('grid grid-cols-2 md:grid-cols-4 gap-6', pySectionClass)}>
        {[
          { label: 'Available Balance', value: metrics.availableBalance, sub: 'Capital + Revenue - Expenses', color: 'text-text-primary', locked: userRole === 'cashier' },
          { label: 'Net Revenue (14d)', value: metrics.totalRevenue, sub: metrics.salesTrend ? `${metrics.salesTrend === 'up' ? '↑' : '↓'} vs last week` : 'Stable trend', color: 'text-success', trend: metrics.sparklineData },
          { label: 'All-Time Expenses', value: metrics.totalExpensesAllTime, sub: 'Stock & Operational Costs', color: 'text-danger', locked: userRole === 'cashier' },
          { label: 'Net Profit/Loss', value: metrics.netPosition, sub: 'Revenue - All Expenses', color: metrics.netPosition >= 0 ? 'text-success' : 'text-danger', locked: userRole === 'cashier' }
        ].map((item, idx) => (
          <Card key={idx} className="group hover:border-primary/30 transition-all border-border-default/50">
            <span className="text-[10px] font-bold tracking-[0.08em] text-text-muted uppercase flex items-center gap-1.5 mb-2">
              {item.label}
              {item.locked && <Lock size={10} className="text-text-muted" />}
            </span>
            <div className="flex items-center justify-between">
              <span className={clsx(textPriceClass, 'tracking-tight tabular-nums', item.color)}>
                {item.locked ? '৳••••••' : `৳${fmt(item.value)}`}
              </span>
              {item.trend && !item.locked && (
                <Sparkline
                  data={item.trend}
                  width={60}
                  height={20}
                  strokeWidth={2}
                />
              )}
            </div>
            <p className="text-[10px] text-text-secondary mt-1.5 font-medium group-hover:text-text-primary transition-colors">
              {item.sub}
            </p>
          </Card>
        ))}
      </section>

      {/* 3. Analytics Visualizer */}
      {userRole !== 'cashier' && (
        <DashboardAnalytics 
          salesVsExpenses={metrics.salesVsExpenses}
          paymentBreakdown={metrics.paymentBreakdown}
          totalRevenue={metrics.totalRevenue}
          lowStockCount={metrics.criticalProcurementItems.length}
          isCompact={isCompact}
        />
      )}

      {/* 4. Filterable Unified Temporal Ledger Feed */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-5 space-y-4 bg-surface-default/60">
            <span className="text-[10px] font-bold tracking-[0.04em] text-text-muted uppercase block font-mono">
              Filter Operations Feed
            </span>
            <Input
              ref={searchInputRef}
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs"
            />
            <div className="text-xs space-y-3 border-t border-border-default pt-4">
              <div className="flex justify-between font-semibold">
                <span className="text-text-secondary">Feed Row Count:</span>
                <span className="text-text-primary font-mono">{filteredFeed.flatMap(g => g.items).length}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-text-secondary">Critical SKU Alerts:</span>
                <Badge variant="danger" className="font-mono">{metrics.criticalProcurementItems.length}</Badge>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {filteredFeed.map((group) => (
            <section key={group.dateStr} id={`date-${group.dateStr}`} className="space-y-4">
              <div className="sticky top-0 bg-background-default/80 backdrop-blur-md z-10 py-2 border-b border-border-default flex items-center justify-between">
                <h2 className="text-[10px] font-black tracking-widest uppercase text-text-muted">{group.displayDate}</h2>
                <div className="flex items-center gap-4 text-[10px] font-bold text-text-secondary font-mono">
                  <span>Rev: ৳{fmt(group.dayRevenue)}</span>
                  {userRole !== 'cashier' && <span>Exp: ৳{fmt(group.dayExpenses)}</span>}
                </div>
              </div>

              <div className={listSpacingClass}>
                {group.items.map((item) => {
                  const flatItem = item as unknown as GroupedFeedItem;
                  const isStockoutAlert = flatItem.type === 'stockout_projection';
                  const isDismissed = dismissedProjections.includes(flatItem.id);
                  if (isDismissed) return null;

                  return (
                    <Card
                      key={flatItem.id}
                      padding="sm"
                      className={clsx(
                        'flex items-start gap-4 relative group hover:border-primary/40',
                        isStockoutAlert && 'border-warning/40 bg-warning/5'
                      )}
                    >
                      <div className="shrink-0">
                        <div className={clsx(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          flatItem.type === 'sale' && 'bg-success-subtle text-success',
                          flatItem.type === 'expense' && 'bg-danger-subtle text-danger',
                          flatItem.type === 'stock_alert' && 'bg-warning-subtle text-warning-dark',
                          isStockoutAlert && 'bg-warning-subtle text-warning-dark'
                        )}>
                          {flatItem.type === 'sale' && <ShoppingBag size={16} />}
                          {flatItem.type === 'expense' && <Activity size={16} />}
                          {isStockoutAlert ? <Sparkles size={16} /> : <Terminal size={16} />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-text-primary truncate">{flatItem.title}</h4>
                          <span className="text-[10px] font-bold text-text-muted font-mono">{flatItem.timeLabel}</span>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-1">{flatItem.description || `Cashier: ${flatItem.cashier}`}</p>
                      </div>

                      <div className="text-right">
                        {flatItem.amount !== undefined && (
                          <span className={clsx('text-sm font-black font-mono tabular-nums', flatItem.type === 'sale' ? 'text-success' : 'text-danger')}>
                            {flatItem.type === 'sale' ? '+' : '-'}৳{fmt(flatItem.amount)}
                          </span>
                        )}
                        {flatItem.type === 'stock_alert' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickRestock(flatItem.itemId || '', flatItem.sku || '', flatItem.itemName || '')}
                            disabled={pendingRestocks[flatItem.itemId || '']}
                          >
                            Order
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* 5. Timeline Scrubber */}
      {metrics.groupedFeed.length > 1 && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-md border border-border-default rounded-full px-6 py-2 shadow-xl z-40 flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-text-muted border-r border-border-default pr-4 flex items-center gap-2 font-mono">
            <Clock size={12} className="text-primary" /> Timeline
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {metrics.groupedFeed.map((group) => (
              <button
                key={group.dateStr}
                onClick={() => document.getElementById(`date-${group.dateStr}`)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[10px] font-bold text-text-secondary hover:text-primary px-3 py-1 transition-all whitespace-nowrap"
              >
                {group.dateStr === format(new Date(), 'yyyy-MM-dd') ? 'Today' : format(parseISO(group.dateStr), 'dd MMM')}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* 6. CmdK Modal */}
      {showCmdK && (
        <div className="fixed inset-0 bg-surface-overlay backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setShowCmdK(false)}>
          <Card className="w-full max-w-md bg-surface/95 backdrop-blur-lg border-primary/20 shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="relative border-b border-border-default p-4 bg-background-subtle">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <Input
                ref={cmdSearchInputRef}
                autoFocus
                placeholder="Type a command..."
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                className="pl-10 border-none bg-transparent shadow-none focus:ring-0 text-base font-bold"
              />
            </div>
            <div className="p-2 max-h-[300px] overflow-y-auto">
              <div className="text-[10px] font-black text-text-muted px-4 py-2 uppercase tracking-widest">Navigation</div>
              <button onClick={() => setShowCmdK(false)} className="w-full text-left p-3 hover:bg-background-subtle rounded-xl flex items-center gap-3 transition-colors">
                <Activity size={16} className="text-text-muted" />
                <span className="text-sm font-bold">1. View Analytics</span>
              </button>
              <button onClick={() => { setShowCmdK(false); setDensity(d => d === 'compact' ? 'comfortable' : 'compact'); }} className="w-full text-left p-3 hover:bg-background-subtle rounded-xl flex items-center gap-3 transition-colors">
                <Sliders size={16} className="text-text-muted" />
                <span className="text-sm font-bold">2. Toggle Density</span>
              </button>
            </div>
            <div className="bg-background-subtle p-3 text-[9px] text-text-muted font-mono flex justify-between border-t border-border-default">
              <span>ESC to close</span>
              <span>LUCKYSTORE v2.1</span>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
};

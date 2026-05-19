import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
} from 'lucide-react';
import { SkeletonCard, SkeletonBlock } from '../../components/PageState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { useRealtimeSubscription } from '../../hooks/useRealtime';
import { useNotify } from '../../components/NotificationContext';
import { MetricCard } from '../../components/data-display/MetricCard';
import { format, subDays, parseISO } from 'date-fns';
import clsx from 'clsx';

// New upgrades
import { useDashboardData } from '../../hooks/useDashboardData';
import { Sparkline } from '../../components/ui/Sparkline';
import { StitchSyncInventory } from '../../lib/stitch-integration';
import { ProcurementService } from '../inventory/procurement';

export function DashboardPage() {
  const { t } = useTranslation();
  const { storeId } = useAuth();
  const { notify } = useNotify();
  const queryClient = useQueryClient();

  const [pendingRestocks, setPendingRestocks] = useState<Record<string, boolean>>({});
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Hook Consolidation
  const {
    isLoading,
    isError,
    statsQuery,
    lowStockQuery,
    remindersQuery,
    dailySalesQuery,
    expensesQuery,
    refetchAll,
  } = useDashboardData(storeId);

  const stats = statsQuery.data;
  const lowStock = lowStockQuery.data;
  const reminders = remindersQuery.data;
  const dailySales = dailySalesQuery.data || [];
  const expenses = expensesQuery.data || [];

  // Realtime: show toast when a new sale is inserted on another device
  useRealtimeSubscription({
    table: 'sales',
    event: 'INSERT',
    filter: storeId ? `store_id=eq.${storeId}` : undefined,
    invalidateKeys: [
      ['dashboard-stats', storeId],
      ['low-stock', storeId],
    ],
    onEvent: () => {
      notify('New sale recorded on another device', 'success');
      refetchAll();
    },
  });

  // Target-Based Quick Restock Handler with Mutation Locking
  const handleQuickRestock = async (
    itemId: string,
    itemSku: string,
    itemName: string,
    currentQty: number,
    minQty: number
  ) => {
    if (!storeId || pendingRestocks[itemId]) return;

    // Option B: Target-Based Procurement (qty required to reach min/threshold point)
    const targetMin = minQty || 5;
    const restockQty = Math.max(targetMin - currentQty, 10); // Restock at least 10 units to make it operationally meaningful

    setPendingRestocks((prev) => ({ ...prev, [itemId]: true }));

    try {
      // 1. Transactional RPC Update
      const result = await ProcurementService.processProcurementScan(
        storeId,
        itemSku || itemId,
        restockQty
      );

      if (result.success) {
        notify(`Successfully restocked ${restockQty}x ${itemName}`, 'success');

        // 2. Optimistic local cache update on React Query
        queryClient.setQueryData(['low-stock', storeId], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((item: any) => {
            if (item.item_id === itemId) {
              return { ...item, current_qty: Number(item.current_qty) + restockQty };
            }
            return item;
          });
        });

        // Trigger refetches to ensure clean ledger sync
        refetchAll();

        // 3. Best-effort async non-blocking side-effect integration (Stitch Sync)
        StitchSyncInventory(storeId, [itemId]);
      } else {
        notify(result.message || 'Failed to restock item', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Error executing quick restock', 'error');
    } finally {
      setPendingRestocks((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Calculate totals from daily_sales (all-time)
  const totalRevenue = dailySales.reduce(
    (sum: number, s: any) => sum + Number(s.cash_amount || 0) + Number(s.bkash_amount || 0),
    0
  );
  const totalCredit = dailySales.reduce((sum: number, s: any) => sum + Number(s.credit_amount || 0), 0);
  const totalCash = dailySales.reduce((sum: number, s: any) => sum + Number(s.cash_amount || 0), 0);
  const totalBkash = dailySales.reduce((sum: number, s: any) => sum + Number(s.bkash_amount || 0), 0);
  const totalExpensesAllTime = dailySales.reduce((sum: number, s: any) => sum + Number(s.daily_expense || 0), 0);
  const totalStockAllTime = dailySales.reduce((sum: number, s: any) => sum + Number(s.stock_purchase || 0), 0);
  const netPosition = totalRevenue - totalExpensesAllTime;

  // Partner capital investment (fixed)
  const mohammedCapital = 553000;
  const sayeedCapital = 965490;
  const partnerCapital = mohammedCapital + sayeedCapital;
  const availableBalance = partnerCapital + totalRevenue - totalExpensesAllTime;

  // Expense breakdown by category from expenses table
  const expenseCategories: Record<string, number> = expenses.reduce((acc: Record<string, number>, e: any) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);
  const expenseTotalFromItems: number = Object.values(expenseCategories).reduce(
    (sum, v) => sum + (v as number),
    0
  );

  // Map category names to display labels and colors
  const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
    'Stock Purchase': { label: 'Stock Purchase', color: 'text-primary', bg: 'bg-primary/15' },
    'Capital Expenditure': { label: t('dashboard.capital'), color: 'text-warning-dark', bg: 'bg-warning/15' },
    'Staff salary': { label: 'Staff Salary', color: 'text-info', bg: 'bg-info/15' },
    'Utility Expenses': { label: 'Utilities', color: 'text-success', bg: 'bg-success/15' },
    'All Other Expenses': { label: 'Other', color: 'text-text-muted', bg: 'bg-surface-secondary' },
    'Partners Take': { label: 'Partners Take', color: 'text-danger', bg: 'bg-danger/15' },
    'Transport & Conveyance': { label: 'Transport', color: 'text-secondary', bg: 'bg-secondary/15' },
  };

  // Last 7 days vs previous 7 days for trend
  const last7 = dailySales.filter((s: any) => s.sale_date >= format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const prev7 = dailySales.filter((s: any) => {
    const d = s.sale_date;
    return (
      d >= format(subDays(new Date(), 14), 'yyyy-MM-dd') && d < format(subDays(new Date(), 7), 'yyyy-MM-dd')
    );
  });
  const last7Sales = last7.reduce((sum: number, s: any) => sum + Number(s.total_sales || 0), 0);
  const prev7Sales = prev7.reduce((sum: number, s: any) => sum + Number(s.total_sales || 0), 0);
  const salesTrend: 'up' | 'down' | null =
    last7Sales > prev7Sales ? 'up' : last7Sales < prev7Sales ? 'down' : null;

  // Extract 7-day revenue trend for Sparkline mapping (chronological)
  const sparklineData = dailySales
    .slice(0, 7)
    .reverse()
    .map((s: any) => Number(s.cash_amount || 0) + Number(s.bkash_amount || 0));

  const fmt = (n: number) => n.toLocaleString('en-BD', { maximumFractionDigits: 0 });

  // Sales vs Expenses comparison from daily_sales
  const salesVsExpenses = dailySales
    .slice(0, 14)
    .reverse()
    .map((s: any) => ({
      date: s.sale_date,
      label: format(parseISO(s.sale_date), 'dd MMM'),
      sales: Number(s.cash_amount || 0) + Number(s.bkash_amount || 0),
      expenses: Number(s.daily_expense || 0),
      stockPurchases: Number(s.stock_purchase || 0),
    }));

  const paymentBreakdown = dailySales.reduce(
    (acc: { cash: number; bkash: number; credit: number }, s: any) => ({
      cash: acc.cash + Number(s.cash_amount || 0),
      bkash: acc.bkash + Number(s.bkash_amount || 0),
      credit: acc.credit + Number(s.credit_amount || 0),
    }),
    { cash: 0, bkash: 0, credit: 0 }
  );

  // Derived state banner: pull "Critical Procurement Needs" directly from lowStock state
  const criticalProcurementItems =
    lowStock?.filter((item: any) => Number(item.current_qty) <= Number(item.min_qty || 5)) || [];

  if (isLoading) {
    return (
      <PageContainer className="dashboard-container">
        <PageHeader title="Loading Dashboard..." description="Gathering your latest statistics." />
        <div className="dashboard-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <section className="mt-12">
          <SkeletonBlock className="w-[160px] h-[22px] mb-6" />
          <div className="card skeleton-block h-[200px] opacity-30" />
        </section>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="dashboard-container">
        <ErrorState message="Failed to load dashboard data." onRetry={refetchAll} />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="dashboard-container">
      <PageHeader
        title={`Welcome ${stats?.user?.name || 'Mohammed'}`}
        description="Here's what's happening today."
      />

      {/* Derived Critical Procurement Alerts Banner */}
      {!bannerDismissed && criticalProcurementItems.length > 0 && (
        <div className="mb-6 bg-danger/10 border border-danger-dark/15 text-text-primary rounded-md p-4 flex justify-between items-start shadow-level-1">
          <div className="flex gap-3">
            <AlertTriangle className="text-danger shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-sm text-text-primary">Critical Procurement Alerts</h4>
              <p className="text-xs text-text-secondary mt-1">
                {criticalProcurementItems.length} items are critically low or below reorder thresholds. Google Stitch control tower integration is active.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {criticalProcurementItems.slice(0, 4).map((item: any) => (
                  <span
                    key={item.item_id}
                    className="text-xs bg-danger-subtle border border-danger/20 text-danger-dark font-mono px-2 py-0.5 rounded-full"
                  >
                    {item.item_name} ({item.current_qty}/{item.min_qty || 5})
                  </span>
                ))}
                {criticalProcurementItems.length > 4 && (
                  <span className="text-xs text-text-muted self-center font-medium">
                    + {criticalProcurementItems.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-text-muted hover:text-text-primary text-xs font-semibold px-2 py-1 rounded hover:bg-surface-secondary transition-colors shrink-0"
            aria-label="Dismiss procurement alert banner"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        <MetricCard
          title={t('dashboard.todaySales')}
          value={`৳${stats?.total_sales || '0.00'}`}
          icon={<TrendingUp size={20} />}
          color="success"
          trend={salesTrend ?? undefined}
          badge={salesTrend ? `${salesTrend === 'up' ? '↑' : '↓'} vs last week` : undefined}
          chart={
            <div className="mt-1">
              <Sparkline
                data={sparklineData}
                width={80}
                height={28}
                strokeColor="var(--color-success-default)"
                fillColor="var(--color-success-subtle)"
              />
            </div>
          }
        />
        <MetricCard
          title={t('dashboard.toReceive')}
          value={`৳${fmt(totalCredit)}`}
          icon={<ArrowUpRight size={20} />}
          color="success"
          badge={`৳${stats?.to_receive ? Number(stats.to_receive).toLocaleString('en-BD', { maximumFractionDigits: 0 }) : '0'} outstanding`}
        />
        <MetricCard
          title={t('dashboard.toGive')}
          value={`৳${stats?.to_give || '0.00'}`}
          icon={<ArrowDownRight size={20} />}
          color="danger"
        />
        <MetricCard
          title={t('dashboard.totalRevenue')}
          value={`৳${fmt(totalRevenue)}`}
          icon={<DollarSign size={20} />}
          color="success"
          badge={`${dailySales.length} ${t('common.days')}`}
          chart={
            <div className="mt-1">
              <Sparkline
                data={sparklineData}
                width={80}
                height={28}
                strokeColor="var(--color-success-default)"
                fillColor="var(--color-success-subtle)"
              />
            </div>
          }
        />
        <MetricCard
          title={t('dashboard.totalExpenses')}
          value={`৳${fmt(totalExpensesAllTime)}`}
          icon={<AlertTriangle size={20} />}
          color="danger"
          badge={`${dailySales.length} ${t('common.days')}`}
        />
        <MetricCard
          title={t('dashboard.netPosition')}
          value={`৳${fmt(Math.abs(netPosition))}`}
          icon={<Scale size={20} />}
          color={netPosition >= 0 ? 'success' : 'danger'}
          badge={netPosition >= 0 ? 'Profit' : 'Loss'}
        />
      </div>

      {/* Financial Overview - KPI Summary */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Revenue Breakdown */}
          <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-5">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
              {t('dashboard.revenueBreakdown')}
            </h3>
            <div className="text-2xl font-bold font-mono text-success mb-3">৳{fmt(totalRevenue)}</div>
            <div className="space-y-2">
              {[
                { label: 'Cash', value: totalCash, total: totalRevenue, color: 'bg-success' },
                { label: 'bKash', value: totalBkash, total: totalRevenue, color: 'bg-info' },
                { label: 'Credit', value: totalCredit, total: totalRevenue, color: 'bg-warning' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-mono font-medium text-text-primary">৳{fmt(item.value)}</span>
                  </div>
                  <div className="h-1.5 bg-surface-secondary rounded-full mt-1 overflow-hidden">
                    <div
                      className={item.color}
                      style={{
                        width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%`,
                        borderRadius: 'inherit',
                        minHeight: item.value > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-5">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
              {t('dashboard.expenseBreakdown')}
            </h3>
            <div className="text-2xl font-bold font-mono text-danger mb-3">
              ৳{fmt(expenseTotalFromItems)}
            </div>
            <div className="space-y-2">
              {(Object.entries(expenseCategories as Record<string, number>) as [string, number][])
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([cat, amount]) => {
                  const config = categoryConfig[cat] || {
                    label: cat,
                    color: 'text-text-muted',
                    bg: 'bg-surface-secondary',
                  };
                  const pct = expenseTotalFromItems > 0 ? (amount / expenseTotalFromItems) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm">
                        <span className={config.color}>{config.label}</span>
                        <span className="font-mono text-text-primary">
                          ৳{fmt(amount)} <span className="text-text-muted">({pct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-secondary rounded-full mt-1 overflow-hidden">
                        <div
                          className={config.bg}
                          style={{ width: `${pct}%`, borderRadius: 'inherit', minHeight: amount > 0 ? 4 : 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-5">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">
              {t('dashboard.investmentSummary')}
            </h3>
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="text-text-secondary">Mohammed</span>
                <span className="font-mono font-medium text-primary">৳{fmt(mohammedCapital)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="text-text-secondary">Sayeed Imam</span>
                <span className="font-mono font-medium text-primary">৳{fmt(sayeedCapital)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="font-semibold text-text-primary">Total Capital</span>
                <span className="font-mono font-bold text-lg text-primary">৳{fmt(partnerCapital)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="text-text-secondary">{t('dashboard.stockInvestment')}</span>
                <span className="font-mono font-medium text-info">৳{fmt(totalStockAllTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-default">
                <span className="text-text-secondary">Total Revenue</span>
                <span className="font-mono font-medium text-success">৳{fmt(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span
                  className={clsx('font-semibold', netPosition >= 0 ? 'text-success-dark' : 'text-danger')}
                >
                  {netPosition >= 0 ? t('dashboard.netProfit') : t('dashboard.netLoss')}
                </span>
                <span
                  className={clsx(
                    'font-mono font-bold text-lg',
                    netPosition >= 0 ? 'text-success-dark' : 'text-danger'
                  )}
                >
                  ৳{fmt(Math.abs(netPosition))}
                </span>
              </div>
              <div className="text-xs text-text-muted mt-1">
                {t('dashboard.revenueCovers')} {((totalRevenue / totalExpensesAllTime) * 100).toFixed(1)}
                % of total expenses
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sales vs Expenses Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Sales vs Expenses (Last 14 Days)
            </h2>
            <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-6">
              {salesVsExpenses.length > 0 && (
                <>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-success" />
                      <span className="text-sm text-text-muted">Sales</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-danger" />
                      <span className="text-sm text-text-muted">Expenses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-info" />
                      <span className="text-sm text-text-muted">Stock Purchases</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-1" style={{ height: '200px' }}>
                    {salesVsExpenses.map((day: any, idx: number) => {
                      const maxVal = Math.max(
                        ...salesVsExpenses.map((d: any) => Math.max(d.sales, d.expenses, d.stockPurchases)),
                        1
                      );
                      const salesHeight = maxVal > 0 ? (day.sales / maxVal) * 100 : 0;
                      const expenseHeight = maxVal > 0 ? (day.expenses / maxVal) * 100 : 0;
                      const stockHeight = maxVal > 0 ? (day.stockPurchases / maxVal) * 100 : 0;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '100%' }}>
                            <div
                              style={{
                                width: '28%',
                                height: `${salesHeight}%`,
                                backgroundColor: 'var(--color-success-default)',
                                borderRadius: '2px 2px 0 0',
                                minHeight: day.sales > 0 ? 4 : 0,
                                transition: 'height 0.3s ease',
                              }}
                              title={`Sales: ৳${day.sales.toLocaleString()}`}
                            />
                            <div
                              style={{
                                width: '28%',
                                height: `${expenseHeight}%`,
                                backgroundColor: 'var(--color-danger-default)',
                                borderRadius: '2px 2px 0 0',
                                minHeight: day.expenses > 0 ? 4 : 0,
                                transition: 'height 0.3s ease',
                              }}
                              title={`Expenses: ৳${day.expenses.toLocaleString()}`}
                            />
                            <div
                              style={{
                                width: '28%',
                                height: `${stockHeight}%`,
                                backgroundColor: 'var(--color-info-default)',
                                borderRadius: '2px 2px 0 0',
                                minHeight: day.stockPurchases > 0 ? 4 : 0,
                                transition: 'height 0.3s ease',
                              }}
                              title={`Stock: ৳${day.stockPurchases.toLocaleString()}`}
                            />
                          </div>
                          <span className="text-xs text-text-muted whitespace-nowrap" style={{ fontSize: '10px' }}>
                            {day.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {salesVsExpenses.length === 0 && (
                <div className="text-center text-text-muted py-8">
                  No daily sales data available.{' '}
                  <a href="/admin/daily-sales" className="text-primary-default hover:underline">
                    Add daily sales
                  </a>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Low Stock Alerts</h2>
            <div className="bg-surface rounded-md border border-border-default shadow-level-1">
              {lowStock && lowStock.length > 0 ? (
                <ul className="divide-y divide-border-default">
                  {lowStock.map((item: any) => {
                    const isPending = !!pendingRestocks[item.item_id];
                    const minQty = item.min_qty || 5;
                    const curQty = Number(item.current_qty);
                    return (
                      <li key={item.item_id} className="flex justify-between items-center px-4 py-3">
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-text-primary truncate">{item.item_name}</span>
                          {item.sku && <span className="text-xs text-text-muted">{item.sku}</span>}
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <span
                            className={clsx(
                              'text-sm font-semibold',
                              curQty <= minQty ? 'text-danger' : 'text-text-secondary'
                            )}
                          >
                            {curQty} left
                          </span>
                          <button
                            onClick={() =>
                              handleQuickRestock(
                                item.item_id,
                                item.sku || '',
                                item.item_name,
                                curQty,
                                minQty
                              )
                            }
                            disabled={isPending}
                            className={clsx(
                              'text-xs font-semibold px-3 py-1.5 rounded transition-all border outline-none',
                              isPending
                                ? 'bg-background-subtle text-text-muted border-border-default cursor-not-allowed'
                                : 'bg-primary text-primary-on hover:bg-primary-hover border-transparent shadow-sm active:scale-95'
                            )}
                          >
                            {isPending ? 'Restocking...' : 'Quick Restock'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon={<AlertTriangle size={48} />}
                  title="Stock is healthy"
                  description="No items are currently running low."
                />
              )}
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Total Balance</h2>
            <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-8 text-center">
              <div className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                {t('dashboard.currentAvailableBalance')}
              </div>
              <div className="text-4xl font-bold text-success font-mono">৳{fmt(availableBalance)}</div>
              <div className="text-sm text-text-muted mt-2">Capital + Revenue − Expenses</div>
            </div>
          </section>

          {/* Payment Breakdown */}
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {t('dashboard.revenueBreakdown')}
            </h2>
            <div className="bg-surface rounded-md border border-border-default shadow-level-1 p-6">
              {totalRevenue > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-sm text-text-muted">Cash</div>
                      <div className="text-lg font-bold text-success">৳{fmt(totalCash)}</div>
                      <div className="text-xs text-text-muted">
                        {((totalCash / totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-sm text-text-muted">Bkash</div>
                      <div className="text-lg font-bold text-info">৳{fmt(totalBkash)}</div>
                      <div className="text-xs text-text-muted">
                        {((totalBkash / totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-sm text-text-muted">Credit Due</div>
                      <div className="text-lg font-bold text-warning">৳{fmt(totalCredit)}</div>
                      <div className="text-xs text-text-muted">
                        {((totalCredit / (totalRevenue + totalCredit)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden flex">
                    <div className="bg-success" style={{ width: `${(totalCash / totalRevenue) * 100}%` }} />
                    <div className="bg-info" style={{ width: `${(totalBkash / totalRevenue) * 100}%` }} />
                  </div>
                  <div className="text-center text-sm text-text-muted mt-2">
                    Realized Revenue: ৳{fmt(totalRevenue)} | Total Sales: ৳{fmt(totalRevenue + totalCredit)}
                  </div>
                </>
              ) : (
                <div className="text-center text-text-muted py-4">No sales data available</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Upcoming Reminders</h2>
            <div className="bg-surface rounded-md border border-border-default shadow-level-1">
              {reminders && reminders.length > 0 ? (
                <ul className="divide-y divide-border-default">
                  {reminders
                    .slice(0, 5)
                    .map(
                      (reminder: {
                        id: string;
                        title: string;
                        reminderDate: string;
                        description: string | null;
                      }) => (
                        <li key={reminder.id} className="flex flex-col gap-1 px-4 py-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-text-primary">
                              {reminder.title}
                            </span>
                            <span className="text-xs text-text-muted">
                              {new Date(reminder.reminderDate).toLocaleDateString()}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-text-muted">{reminder.description}</p>
                          )}
                        </li>
                      )
                    )}
                </ul>
              ) : (
                <EmptyState
                  icon={<Bell size={48} />}
                  title="No upcoming reminders"
                  description="You are all caught up."
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

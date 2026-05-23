"use no memo";
import { useState, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useSalesHistory, useSaleDetails, useVoidSale } from '../../hooks/useSales';
import {  useAuth  } from '../../hooks/useAuth';
import { PageContainer } from '../../layouts/PageContainer';
import { SkeletonBlock } from '../../components/PageState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/layout/PageHeader';
import { MetricCard } from '../../components/data-display/MetricCard';
import { TableFilters } from '../../components/data-display/TableFilters';
import { XCircle, ChevronRight, Receipt, CreditCard, X, Download, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';

import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';
import { useNotify } from '../../components/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';

const ROW_HEIGHT = 56;
const VISIBLE_ROWS = 15;

type DateRange = 'today' | 'week' | 'month' | 'custom';

function getDateRange(range: DateRange, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const now = new Date();
  switch (range) {
    case 'today':
      return { startDate: startOfDay(now).toISOString(), endDate: endOfDay(now).toISOString() };
    case 'week':
      return { startDate: startOfWeek(now, { weekStartsOn: 6 }).toISOString(), endDate: endOfWeek(now, { weekStartsOn: 6 }).toISOString() };
    case 'month':
      return { startDate: startOfMonth(now).toISOString(), endDate: endOfMonth(now).toISOString() };
    case 'custom':
      return {
        startDate: customStart ? startOfDay(new Date(customStart)).toISOString() : startOfDay(now).toISOString(),
        endDate: customEnd ? endOfDay(new Date(customEnd)).toISOString() : endOfDay(now).toISOString(),
      };
  }
}

function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function exportSalesToCSV(sales: { sale_number: string, created_at: string, cashier_name: string, subtotal: number, discount_amount: number, total_amount: number, status: string }[]) {
  if (!sales.length) return;
  const headers = ['Receipt #', 'Date & Time', 'Cashier', 'Subtotal', 'Discount', 'Total', 'Status'];
  const rows = sales.map((s: { sale_number: string, created_at: string, cashier_name: string, subtotal: number, discount_amount: number, total_amount: number, status: string }) => [
    s.sale_number,
    format(new Date(s.created_at), 'dd/MM/yyyy HH:mm'),
    s.cashier_name,
    s.subtotal ?? '',
    s.discount_amount ?? '',
    s.total_amount,
    s.status,
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sales-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function SalesHistoryPage() {
  const { storeId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch]);

  const { startDate, endDate } = getDateRange(dateRange, customStart, customEnd);

  const { data: sales, isLoading, error, refetch } = useSalesHistory(
    storeId, 
    searchTerm || undefined, 
    startDate, 
    endDate
  );

  const totalPages = Math.ceil((sales?.length ?? 0) / pageSize);
  const paginatedSales = sales?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];

  const salesScrollRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const salesVirtualizer = useVirtualizer({
    count: paginatedSales.length,
    getScrollElement: () => salesScrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  if (error) {
    return (
      <PageContainer className="sales-history-container">
        <PageHeader 
          title="Sales History" 
          subtitle="Search and review store transactions." 
        />
        <div className="card">
          <ErrorState message="Failed to load sales history." onRetry={() => refetch()} />
        </div>
      </PageContainer>
    );
  }

  const completedSales = (sales ?? []).filter((s: { status: string }) => s.status === 'completed');
  const voidedSales = (sales ?? []).filter((s: { status: string }) => s.status === 'voided');

  const totalRevenue = completedSales.reduce((sum: number, s: { total_amount: number }) => sum + Number(s.total_amount || 0), 0);
  const avgTicket = completedSales.length ? totalRevenue / completedSales.length : 0;
  const voidCount = voidedSales.length;

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  return (
    <PageContainer className="sales-history-container">
      <PageHeader 
        title="Sales History" 
        subtitle="Search and review store transactions." 
      />

      {/* Summary Cards */}
      <div className="metric-grid">
        <MetricCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<DollarSign size={18} className="text-success" />} color="success" variant="light" />
        <MetricCard title="Average Ticket" value={formatCurrency(avgTicket)} icon={<TrendingUp size={18} className="text-primary-default" />} color="primary" variant="light" />
        <MetricCard title="Voided" value={voidCount} icon={<AlertTriangle size={18} className={voidCount > 0 ? 'text-danger' : 'text-text-muted'} />} color={voidCount > 0 ? 'danger' : 'neutral'} variant="light" />
      </div>

      {/* Filters Row */}
      <div className="card page-section">
        <div className="card-body">
          <TableFilters
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by Receipt #..."
            filters={[]}
          >
            {/* Date Range Picker */}
            <div className="flex gap-1 bg-surface-secondary p-1 rounded-md">
              {(['today', 'week', 'month', 'custom'] as DateRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => handleDateRangeChange(range)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors ${
                    dateRange === range 
                      ? 'bg-primary-default text-white font-bold' 
                      : 'text-text-muted font-medium hover:bg-surface-hover'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'Custom'}
                </button>
              ))}
            </div>
  
            {/* Custom Date Inputs */}
            {dateRange === 'custom' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => { setCustomStart(e.target.value); setCurrentPage(1); }}
                  className="input px-3 py-2 text-sm"
                />
                <span className="text-text-muted">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => { setCustomEnd(e.target.value); setCurrentPage(1); }}
                  className="input px-3 py-2 text-sm"
                />
              </div>
            )}
  
            {/* Export Button */}
            <button
              onClick={() => exportSalesToCSV(sales ?? [])}
              disabled={!sales?.length}
              className={`button-outline flex items-center gap-2 text-sm ${!sales?.length && 'opacity-50 cursor-not-allowed'}`}
            >
              <Download size={16} />
              Export CSV
            </button>
          </TableFilters>
        </div>
      </div>
  
      {/* Results count */}
      <div className="flex justify-between items-center mb-4 text-sm text-text-muted">
        <span>
          {sales?.length ?? 0} transaction{sales?.length === 1 ? '' : 's'} found
        </span>
      </div>

      {/* Sales Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '18%' }}>Receipt #</th>
              <th style={{ width: '24%' }}>Date & Time</th>
              <th style={{ width: '18%' }}>Cashier</th>
              <th style={{ width: '16%' }}>Amount</th>
              <th style={{ width: '14%' }}>Status</th>
              <th className="text-right" style={{ width: '10%' }}>Actions</th>
            </tr>
          </thead>
        </table>

        {isLoading ? (
          <div className="p-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 py-3">
                <SkeletonBlock className="w-[120px] h-5" />
                <SkeletonBlock className="w-[150px] h-5" />
                <SkeletonBlock className="w-[100px] h-5" />
                <SkeletonBlock className="w-[80px] h-5" />
                <SkeletonBlock className="w-[60px] h-5" />
              </div>
            ))}
          </div>
        ) : paginatedSales.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title="No sales yet"
            description="Transactions will appear here once sales are recorded."
          />
        ) : (
          <div
            ref={salesScrollRef}
            style={{ height: `${Math.min(paginatedSales.length, VISIBLE_ROWS) * ROW_HEIGHT + 4}px`, overflow: 'auto' }}
          >
            <div style={{ height: `${salesVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {salesVirtualizer.getVirtualItems().map((virtualRow) => {
                const s = paginatedSales[virtualRow.index];
                return (
                  <div
                    key={s.id}
                    className="flex items-center border-b border-border-default cursor-pointer hover:bg-surface-secondary transition-colors"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      position: 'absolute',
                      width: '100%',
                    }}
                    onClick={() => setSelectedSaleId(s.id)}
                  >
                    <div className="font-bold text-text-primary px-4" style={{ width: '18%' }}>{s.sale_number}</div>
                    <div className="text-sm text-text-muted px-4" style={{ width: '24%' }}>
                      {format(new Date(s.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                    <div className="text-text-primary px-4" style={{ width: '18%' }}>{s.cashier_name}</div>
                    <div className="font-bold text-text-primary px-4" style={{ width: '16%' }}>৳{s.total_amount}</div>
                    <div className="px-4" style={{ width: '14%' }}>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${s.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="text-right px-4" style={{ width: '10%' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedSaleId(s.id); }}
                        className="text-primary-default font-semibold flex items-center gap-1 ml-auto hover:text-primary-hover"
                      >
                        Details <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <SaleDetailsDrawer
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </PageContainer>
  );
}

function SaleDetailsDrawer({ saleId, onClose }: { saleId: string | null, onClose: () => void }) {
  const [voidReason, setVoidReason] = useState('');
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const { data, isLoading } = useSaleDetails(saleId);
  const { notify } = useNotify();

  const voidMutation = useVoidSale();

  const handleVoid = () => {
    voidMutation.mutate({ saleId: saleId!, reason: voidReason, idempotencyKey }, {
      onSuccess: (res: unknown) => {
        const result = res as { is_duplicate?: boolean } | null;
        if (result?.is_duplicate) {
          notify('This sale was already voided.', 'error');
        } else {
          notify('Sale voided successfully. Stock has been restored.', 'success');
        }
        onClose();
      },
      onError: (err: unknown) => {
        notify(err instanceof Error ? err.message : 'Failed to void sale. Please try again.', 'error');
      }
    });
  };

  if (!saleId) return null;

  const { sale, items, payments } = data || {};

  return (
    <div
      className="fixed inset-0 bg-black/40 flex justify-end z-[1000] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] bg-surface flex flex-col h-full shadow-lg p-6 overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-text-primary">Sale Details</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={24} /></button>
        </header>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            <SkeletonBlock className="w-full h-8" />
            <SkeletonBlock className="w-full h-8" />
            <SkeletonBlock className="w-full h-8" />
            <SkeletonBlock className="w-3/4 h-8" />
          </div>
        ) : !sale ? (
          <ErrorState message="Failed to load sale details." />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 bg-surface-secondary p-4 rounded-md">
              <div>
                <label className="text-xs text-text-muted block">Receipt #</label>
                <span className="font-bold text-text-primary">{sale.sale_number}</span>
              </div>
              <div className="text-right">
                <label className="text-xs text-text-muted block">Status</label>
                <span className={`font-bold uppercase ${sale.status === 'completed' ? 'text-success' : 'text-danger'}`}>
                  {sale.status}
                </span>
              </div>
              <div>
                <label className="text-xs text-text-muted block">Date</label>
                <span className="text-text-primary">{format(new Date(sale.created_at), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <div className="text-right">
                <label className="text-xs text-text-muted block">Cashier</label>
                <span className="text-text-primary">{sale.cashier_name}</span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-text-primary">
                <Receipt size={16} /> Items
              </h3>
              <table className="w-full border-collapse">
                <thead className="border-b border-border-default text-xs text-text-muted">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(items || []).map((item: { item_name: string, sku: string, qty: number, line_total: number }, idx: number) => (
                    <tr key={idx} className="border-b border-border-light text-sm">
                      <td className="py-2">
                        <div className="text-text-primary">{item.item_name}</div>
                        <div className="text-xs text-text-muted">{item.sku}</div>
                      </td>
                      <td className="text-center text-text-primary">{item.qty}</td>
                      <td className="text-right font-semibold text-text-primary">৳{item.line_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-2 border-t-2 border-border-default pt-4 text-text-primary">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>৳{sale.subtotal}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Discount</span>
                  <span>-৳{sale.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>৳{sale.total_amount}</span>
              </div>
            </div>

            {/* Payments */}
            <div>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2 text-text-primary">
                <CreditCard size={16} /> Payments
              </h3>
              {(payments || []).map((p: { method_name: string, reference?: string, amount: number }, idx: number) => (
                <div key={idx} className="flex justify-between text-sm py-1 text-text-primary">
                  <span>{p.method_name} {p.reference && <span className="text-xs text-text-muted">({p.reference})</span>}</span>
                  <span className="font-semibold">৳{p.amount}</span>
                </div>
              ))}
            </div>

            {/* Void Section (Manager only) */}
            {sale.status === 'completed' && (
              <div className="mt-auto border-t border-border-default pt-6">
                {!showVoidConfirm ? (
                  <button
                    onClick={() => setShowVoidConfirm(true)}
                    className="w-full text-danger border border-danger p-3 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-danger-subtle transition-colors"
                  >
                    <XCircle size={18} /> Void Sale
                  </button>
                ) : (
                  <div className="flex flex-col gap-4 bg-danger-subtle p-4 rounded-md">
                    <h4 className="text-danger font-bold">Confirm Void</h4>
                    <p className="text-xs text-text-primary">This will restore stock and reverse session totals. This action cannot be undone.</p>
                    <input
                      type="text"
                      placeholder="Reason for voiding (required)..."
                      value={voidReason}
                      onChange={e => setVoidReason(e.target.value)}
                      className="input border-danger focus:border-danger focus:ring-danger"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setShowVoidConfirm(false)} className="button-outline">Cancel</button>
                      <button
                        disabled={!voidReason || voidMutation.isPending}
                        onClick={handleVoid}
                        className={`bg-danger text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center ${(!voidReason || voidMutation.isPending) && 'opacity-50 cursor-not-allowed'}`}
                      >
                        {voidMutation.isPending ? 'Voiding...' : 'Confirm Void'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
  
            {/* Void Info */}
            {sale.status === 'voided' && (
              <div className="bg-danger-subtle p-4 rounded-md border-l-4 border-danger">
                <h4 className="text-danger font-bold flex items-center gap-1">
                  <XCircle size={16} /> Voided Transaction
                </h4>
                <div className="text-sm mt-1 text-text-primary">
                  <strong>Reason:</strong> {sale.void_reason}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  By {sale.voided_by_name} on {sale.voided_at ? format(new Date(sale.voided_at), 'MMM d, HH:mm') : 'Unknown'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
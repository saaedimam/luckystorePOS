import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import {  useAuth  } from '../../hooks/useAuth';
import { SkeletonBlock } from '../../components/PageState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotify } from '../../components/NotificationContext';
import { useDebounce } from '../../hooks/useDebounce';
import { PageHeader } from '../../layouts/PageHeader';
import { PageContainer } from '../../layouts/PageContainer';
import { Drawer } from '../../components/ui/Drawer';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { MetricCard } from '../../components/data-display/MetricCard';
import { TableFilters } from '../../components/data-display/TableFilters';
import { useForm } from 'react-hook-form';
import { Form, FormInput, FormSelect, PriceInput, FormActions } from '../../components/forms';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Receipt,
  Plus,
  CalendarDays,
  TrendingUp,
  Wallet,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Building2,
  CreditCard,
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, subMonths, startOfMonth, parseISO } from 'date-fns';

const CHART_COLORS = [
  'var(--color-info-default)',
  'var(--color-success-default)',
  'var(--color-warning-default)',
  'var(--color-danger-default)',
  'var(--color-primary-default)',
  'var(--color-secondary-default)'
];
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_TYPES,
} from '../../lib/api/types';
import type { Expense, ExpenseFormData } from '../../lib/api/types';

export function ExpensesPage() {
  const { notify } = useNotify();
  const { storeId } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPaymentType, setFilterPaymentType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data: expenses, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', storeId],
    queryFn: () => api.expenses.list(storeId),
  });

  const createMutation = useMutation({
    mutationFn: (form: ExpenseFormData) => api.expenses.create(storeId, form),
    onSuccess: () => {
      notify('Expense recorded successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses', storeId] });
      setShowForm(false);
    },
    onError: (err: unknown) => {
      notify(err instanceof Error ? err.message : 'Failed to record expense.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ExpenseFormData> }) => api.expenses.update(id, updates),
    onSuccess: () => {
      notify('Expense updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses', storeId] });
      setEditingExpense(null);
    },
    onError: (err: unknown) => {
      notify(err instanceof Error ? err.message : 'Failed to update expense.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.expenses.remove(id),
    onSuccess: () => {
      notify('Expense deleted.', 'success');
      queryClient.invalidateQueries({ queryKey: ['expenses', storeId] });
      setDeletingExpenseId(null);
    },
    onError: (err: unknown) => {
      notify(err instanceof Error ? err.message : 'Failed to delete expense.', 'error');
    },
  });



  const filtered = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((e) => {
      if (filterCategory && e.category !== filterCategory) return false;
      if (filterPaymentType && e.paymentType !== filterPaymentType) return false;
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matches =
          e.vendorName.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [expenses, filterCategory, filterPaymentType, debouncedSearch]);

  const todayTotal = useMemo(
    () => filtered.filter((e) => isToday(new Date(e.expenseDate))).reduce((s, e) => s + e.amount, 0),
    [filtered],
  );
  const weekTotal = useMemo(
    () => filtered.filter((e) => isThisWeek(new Date(e.expenseDate), { weekStartsOn: 6 })).reduce((s, e) => s + e.amount, 0),
    [filtered],
  );
  const monthTotal = useMemo(
    () => filtered.filter((e) => isThisMonth(new Date(e.expenseDate))).reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  // Dashboard statistics
  const allExpenses = useMemo(() => expenses || [], [expenses]);

  // Total statistics
  const totalStats = useMemo(() => {
    if (allExpenses.length === 0) return { total: 0, avg: 0, min: 0, max: 0, count: 0 };
    const amounts = allExpenses.map(e => e.amount);
    const total = amounts.reduce((a, b) => a + b, 0);
    return {
      total,
      avg: total / amounts.length,
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      count: amounts.length,
    };
  }, [allExpenses]);

  // Last month vs previous month comparison
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const thisMonth = allExpenses.filter(e => isThisMonth(new Date(e.expenseDate))).reduce((s, e) => s + e.amount, 0);
    const lastMonthStart = subMonths(startOfMonth(now), 1);
    const lastMonthEnd = startOfMonth(now);
    const lastMonth = allExpenses
      .filter(e => {
        const d = new Date(e.expenseDate);
        return d >= lastMonthStart && d < lastMonthEnd;
      })
      .reduce((s, e) => s + e.amount, 0);
    const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;
    return { thisMonth, lastMonth, change };
  }, [allExpenses]);

  // Category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const grouped: Record<string, number> = {};
    allExpenses.forEach(e => {
      grouped[e.category] = (grouped[e.category] || 0) + e.amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value, percentage: totalStats.total > 0 ? (value / totalStats.total) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses, totalStats.total]);

  // Payment type breakdown
  const paymentBreakdown = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    allExpenses.forEach(e => {
      if (!grouped[e.paymentType]) grouped[e.paymentType] = { total: 0, count: 0 };
      grouped[e.paymentType].total += e.amount;
      grouped[e.paymentType].count++;
    });
    return Object.entries(grouped)
      .map(([type, data]) => ({
        type,
        total: data.total,
        count: data.count,
        percentage: totalStats.total > 0 ? (data.total / totalStats.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [allExpenses, totalStats.total]);

  // Monthly trend for bar chart
  const monthlyTrend = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    allExpenses.forEach(e => {
      const monthKey = e.expenseDate.substring(0, 7); // YYYY-MM
      if (!grouped[monthKey]) grouped[monthKey] = { total: 0, count: 0 };
      grouped[monthKey].total += e.amount;
      grouped[monthKey].count++;
    });
    return Object.entries(grouped)
      .map(([month, data]) => ({
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [allExpenses]);

  // Top vendors
  const topVendors = useMemo(() => {
    const grouped: Record<string, { total: number; count: number }> = {};
    allExpenses.forEach(e => {
      if (e.vendorName) {
        if (!grouped[e.vendorName]) grouped[e.vendorName] = { total: 0, count: 0 };
        grouped[e.vendorName].total += e.amount;
        grouped[e.vendorName].count++;
      }
    });
    return Object.entries(grouped)
      .map(([vendor, data]) => ({ vendor, total: data.total, count: data.count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [allExpenses]);

  // Highest expense category
  // Top 10 highest single expenses
  const topExpenses = useMemo(() => {
    return [...allExpenses]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(e => ({
        ...e,
        date: format(new Date(e.expenseDate), 'dd MMM yyyy'),
      }));
  }, [allExpenses]);

  if (error) {
    return (
      <PageContainer className="expenses-container">
        <PageHeader
          title="Expenses"
          description="Track and manage store expenses."
        />
        <div className="card">
          <ErrorState message="Failed to load expenses." onRetry={() => refetch()} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="expenses-container">
      <PageHeader
        title="Expenses"
        description="Track and manage store expenses."
        action={
          <button className="button-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add Expense
          </button>
        }
      />

      <div className="metric-grid">
        <MetricCard title="Today" value={`৳${todayTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`} icon={<CalendarDays size={20} className="text-success-dark dark:text-success" />} color="success" variant="light" />
        <MetricCard title="This Week" value={`৳${weekTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`} icon={<TrendingUp size={20} className="text-success-dark dark:text-success" />} color="success" variant="light" />
        <MetricCard title="This Month" value={`৳${monthTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`} icon={<Wallet size={20} className="text-success-dark dark:text-success" />} color="success" variant="light" />
      </div>

      {/* Expense Dashboard */}
      <div className="layout-2col page-section">
        {/* Overview Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Expense Overview</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-4">
              <div className="stat-card">
                <div className="text-sm text-text-muted">Total Expenses</div>
                <div className="text-2xl font-bold text-text-primary">৳{totalStats.total.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-text-muted">{totalStats.count} transactions</div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text-muted">Average Expense</div>
                <div className="text-2xl font-bold text-text-primary">৳{totalStats.avg.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-text-muted">per transaction</div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text-muted">Highest Single</div>
                <div className="text-2xl font-bold text-danger">৳{totalStats.max.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-text-muted">single expense</div>
              </div>
              <div className="stat-card">
                <div className="text-sm text-text-muted">Lowest Single</div>
                <div className="text-2xl font-bold text-success">৳{totalStats.min.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                <div className="text-xs text-text-muted">single expense</div>
              </div>
            </div>
            {monthlyComparison.lastMonth > 0 && (
              <div className="mt-4 stat-card border-none bg-surface-secondary">
                <div className="text-sm text-text-muted mb-2">Month Over Month</div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-primary">৳{monthlyComparison.thisMonth.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</span>
                  {monthlyComparison.change !== 0 && (
                    <span className={`flex items-center text-sm ${monthlyComparison.change > 0 ? 'text-danger' : 'text-success'}`}>
                      {monthlyComparison.change > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      {Math.abs(monthlyComparison.change).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted">vs ৳{monthlyComparison.lastMonth.toLocaleString('en-BD', { maximumFractionDigits: 0 })} last month</div>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">By Category</h2>
          </div>
          <div className="card-body">
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name, percent }) => `${(name as string).split(' ')[0]} ${((percent ?? 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`৳${Number(value).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`, 'Amount']}
                        contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.slice(0, 4).map((cat, idx) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-text-muted">{cat.name}</span>
                      </div>
                      <span className="font-medium text-text-primary">৳{cat.value.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState icon={<Receipt size={32} />} title="No data" description="Add expenses to see breakdown" />
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Monthly Trend</h2>
          </div>
          <div className="card-body">
            {monthlyTrend.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend}>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--text-muted)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--text-muted)" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [`৳${Number(value).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`, 'Total']}
                      labelStyle={{ color: 'var(--text-primary)' }}
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}
                    />
                    <Bar dataKey="total" fill="var(--color-success-default)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState icon={<TrendingUp size={32} />} title="No data" description="Add expenses to see trend" />
            )}
          </div>
        </div>

        {/* Payment Type & Top Vendors */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Payment Types</h2>
          {paymentBreakdown.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {paymentBreakdown.map((pt) => (
                  <div key={pt.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {pt.type === 'Cash' && <Wallet size={16} className="text-success" />}
                      {pt.type === 'Bank transfer' && <Building2 size={16} className="text-info" />}
                      {pt.type === 'Bkash' && <CreditCard size={16} className="text-warning" />}
                      {pt.type === 'Card' && <CreditCard size={16} className="text-danger" />}
                      <span className="text-sm text-text-muted">{pt.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-text-primary">৳{pt.total.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</div>
                      <div className="text-xs text-text-muted">{pt.count} txns ({pt.percentage.toFixed(1)}%)</div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-md font-semibold text-text-primary mb-3">Top Vendors</h3>
              {topVendors.length > 0 ? (
                <div className="space-y-2">
                  {topVendors.map((v, idx) => (
                    <div key={v.vendor} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted w-5">{idx + 1}.</span>
                        <span className="text-text-primary truncate" style={{ maxWidth: '150px' }}>{v.vendor}</span>
                      </div>
                      <span className="font-medium text-text-primary">৳{v.total.toLocaleString('en-BD', { maximumFractionDigits: 0 })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-text-muted">No vendor data</div>
              )}
            </>
          ) : (
            <EmptyState icon={<CreditCard size={32} />} title="No data" description="Add expenses to see breakdown" />
          )}
        </div>
      </div>

      {/* Top 5 Highest Expenses */}
      <div className="card page-section">
        <div className="card-header">
          <h2 className="card-title">Top 5 Highest Expenses</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {topExpenses.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topExpenses.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.description}</td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-text-muted">{e.category}</span>
                    </td>
                    <td className="text-right font-mono text-danger">৳{e.amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState icon={<Receipt size={32} />} title="No expenses" description="Add expenses to see top transactions" />
          )}
        </div>
      </div>

      <div className="card expenses-filters">
        <TableFilters
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search vendor, description..."
          filters={[
            {
              label: 'Category',
              value: filterCategory,
              onChange: setFilterCategory,
              options: [
                { label: 'All Categories', value: '' },
                ...EXPENSE_CATEGORIES.map(c => ({ label: c, value: c })),
              ],
            },
            {
              label: 'Payment',
              value: filterPaymentType,
              onChange: setFilterPaymentType,
              options: [
                { label: 'All Payment Types', value: '' },
                ...EXPENSE_PAYMENT_TYPES.map(t => ({ label: t, value: t })),
              ],
            },
          ]}
          onClear={() => { setFilterCategory(''); setFilterPaymentType(''); setSearchTerm(''); }}
          isFiltered={!!(filterCategory || filterPaymentType || searchTerm)}
        />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Description</th>
              <th>Category</th>
              <th>Payment</th>
              <th className="text-right">Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  <td><SkeletonBlock className="w-[80px] h-[18px]" /></td>
                  <td><SkeletonBlock className="w-[100px] h-[18px]" /></td>
                  <td><SkeletonBlock className="w-[140px] h-[18px]" /></td>
                  <td><SkeletonBlock className="w-[90px] h-[18px]" /></td>
                  <td><SkeletonBlock className="w-[70px] h-[18px]" /></td>
                  <td><SkeletonBlock className="w-[80px] h-[18px] ml-auto" /></td>
                  <td><SkeletonBlock className="w-[60px] h-[18px]" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="expenses-empty">
                  <EmptyState
                    icon={<Receipt size={48} />}
                    title="No expenses yet"
                    description="Record your first expense to start tracking spending."
                    action={<button className="button-primary" onClick={() => setShowForm(true)}><Plus size={18} /> Add Expense</button>}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id}>
                  <td className="expenses-date">{format(new Date(e.expenseDate), 'dd/MM/yyyy')}</td>
                  <td className="expenses-vendor">{e.vendorName}</td>
                  <td className="expenses-desc">{e.description}</td>
                  <td>
                    <span className="expenses-badge">{e.category}</span>
                  </td>
                  <td>
                    <span className="expenses-payment-badge">{e.paymentType}</span>
                  </td>
                  <td className="expenses-amount text-right">৳{e.amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingExpense(e)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }} aria-label="Edit expense">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeletingExpenseId(e.id)} style={{ color: 'var(--color-danger)', cursor: 'pointer', background: 'none', border: 'none' }} aria-label="Delete expense">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddExpenseDrawer
        isOpen={showForm}
        onSubmit={(form) => createMutation.mutate(form)}
        onClose={() => setShowForm(false)}
        isPending={createMutation.isPending}
      />

      <EditExpenseDrawer
        expense={editingExpense}
        isOpen={!!editingExpense}
        onSubmit={(id, updates) => updateMutation.mutate({ id, updates })}
        onClose={() => setEditingExpense(null)}
        isPending={updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingExpenseId}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deletingExpenseId && deleteMutation.mutate(deletingExpenseId)}
        onCancel={() => setDeletingExpenseId(null)}
      />
    </PageContainer>
  );
}

function AddExpenseDrawer({
  isOpen,
  onSubmit,
  onClose,
  isPending,
}: {
  isOpen: boolean;
  onSubmit: (form: ExpenseFormData) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');

  const form = useForm<ExpenseFormData>({
    defaultValues: {
      expenseDate: today,
      vendorName: '',
      description: '',
      amount: 0,
      paymentType: 'Cash',
      category: 'All Other Expenses',
    }
  });

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit(data);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Add Expense">
      <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          type="date"
          name="expenseDate"
          label="Date"
          required
        />
        <FormInput
          name="vendorName"
          label="Vendor"
          placeholder="e.g. ABC Supplies"
          required
        />
        <FormInput
          name="description"
          label="Description"
          placeholder="What was this for?"
          required
        />
        <PriceInput
          name="amount"
          label="Amount"
        />
        <FormSelect
          name="category"
          label="Category"
          options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))}
        />
        <FormSelect
          name="paymentType"
          label="Payment Method"
          options={EXPENSE_PAYMENT_TYPES.map(t => ({ label: t, value: t }))}
        />

        <FormActions>
          <button type="button" className="button-outline" onClick={onClose}>Cancel</button>
          <button
            type="submit"
            className="button-primary"
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Record Expense'}
          </button>
        </FormActions>
      </Form>
    </Drawer>
  );
}


function EditExpenseDrawer({
  expense,
  isOpen,
  onSubmit,
  onClose,
  isPending,
}: {
  expense: Expense | null;
  isOpen: boolean;
  onSubmit: (id: string, updates: Record<string, unknown>) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const form = useForm<ExpenseFormData>({
    values: expense ? {
      expenseDate: expense.expenseDate,
      vendorName: expense.vendorName,
      description: expense.description,
      amount: expense.amount,
      paymentType: expense.paymentType,
      category: expense.category,
    } : undefined
  });

  if (!expense) return null;

  const handleSubmit = (data: ExpenseFormData) => {
    onSubmit(expense.id, data as unknown as Record<string, unknown>);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Edit Expense">
      <Form form={form} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          type="date"
          name="expenseDate"
          label="Date"
          required
        />
        <FormInput
          name="vendorName"
          label="Vendor"
          required
        />
        <FormInput
          name="description"
          label="Description"
          required
        />
        <PriceInput
          name="amount"
          label="Amount"
        />
        <FormSelect
          name="category"
          label="Category"
          options={EXPENSE_CATEGORIES.map(c => ({ label: c, value: c }))}
        />
        <FormSelect
          name="paymentType"
          label="Payment Method"
          options={EXPENSE_PAYMENT_TYPES.map(t => ({ label: t, value: t }))}
        />
        <FormActions>
          <button type="button" className="button-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? 'Saving...' : 'Record Expense'}
          </button>
        </FormActions>
      </Form>
    </Drawer>
  );
}
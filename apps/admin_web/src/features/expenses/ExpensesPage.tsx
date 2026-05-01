import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import { ErrorState, EmptyState, SkeletonBlock } from '../../components/PageState';
import { useNotify } from '../../components/Notification';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Receipt,
  Plus,
  X,
  CalendarDays,
  TrendingUp,
  Wallet,
  Banknote,
  CreditCard,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, isToday, isThisWeek, isThisMonth } from 'date-fns';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_PAYMENT_TYPES,
} from '../../lib/api/types';
import type { Expense, ExpenseFormData, ExpenseCategory, ExpensePaymentType } from '../../lib/api/types';

export function ExpensesPage() {
  const { notify } = useNotify();
  const { storeId } = useAuth();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
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
    onError: (err: any) => {
      notify(err.message || 'Failed to record expense.', 'error');
    },
  });

  if (error) {
    return (
      <div className="expenses-container">
        <header className="expenses-header">
          <div>
            <h1 className="expenses-title">Expenses</h1>
            <p className="expenses-subtitle">Track and manage store expenses.</p>
          </div>
        </header>
        <div className="card">
          <ErrorState message="Failed to load expenses." onRetry={() => refetch()} />
        </div>
      </div>
    );
  }

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

  return (
    <div className="expenses-container">
      <header className="expenses-header">
        <div>
          <h1 className="expenses-title">Expenses</h1>
          <p className="expenses-subtitle">Track and manage store expenses.</p>
        </div>
        <button className="button-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> Add Expense
        </button>
      </header>

      <div className="dashboard-grid">
        <SummaryCard title="Today" amount={todayTotal} icon={<CalendarDays size={20} className="text-emerald-600" />} />
        <SummaryCard title="This Week" amount={weekTotal} icon={<TrendingUp size={20} className="text-emerald-600" />} />
        <SummaryCard title="This Month" amount={monthTotal} icon={<Wallet size={20} className="text-emerald-600" />} />
      </div>

      <div className="card expenses-filters">
        <div className="expenses-filters-row">
          <div className="expenses-search">
            <Search size={18} className="expenses-search-icon" />
            <input
              type="text"
              placeholder="Search vendor, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input expenses-search-input"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="expenses-filter-select"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterPaymentType}
            onChange={(e) => setFilterPaymentType(e.target.value)}
            className="expenses-filter-select"
          >
            <option value="">All Payment Types</option>
            {EXPENSE_PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {(filterCategory || filterPaymentType || searchTerm) && (
            <button
              className="expenses-clear-btn"
              onClick={() => { setFilterCategory(''); setFilterPaymentType(''); setSearchTerm(''); }}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Description</th>
              <th>Category</th>
              <th>Payment</th>
              <th className="text-right">Amount</th>
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
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="expenses-empty">
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AddExpenseDrawer
          onSubmit={(form) => createMutation.mutate(form)}
          onClose={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}
    </div>
  );
}

function SummaryCard({ title, amount, icon }: { title: string; amount: number; icon: React.ReactNode }) {
  return (
    <div className="card">
      <div className="expenses-summary-header">
        <span className="expenses-summary-title">{title}</span>
        {icon}
      </div>
      <span className="expenses-summary-amount">৳{amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</span>
    </div>
  );
}

function AddExpenseDrawer({
  onSubmit,
  onClose,
  isPending,
}: {
  onSubmit: (form: ExpenseFormData) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState<ExpenseFormData>({
    expenseDate: today,
    vendorName: '',
    description: '',
    amount: 0,
    paymentType: 'Cash',
    category: 'All Other Expenses',
  });

  const set = <K extends keyof ExpenseFormData>(key: K, value: ExpenseFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendorName.trim() || form.amount <= 0) return;
    onSubmit(form);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content expenses-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="expenses-drawer-header">
          <h2>Add Expense</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={24} /></button>
        </header>

        <form onSubmit={handleSubmit} className="expenses-form">
          <label className="expenses-form-label">
            Date
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) => set('expenseDate', e.target.value)}
              className="expenses-form-input"
              required
            />
          </label>

          <label className="expenses-form-label">
            Vendor
            <input
              type="text"
              placeholder="e.g. ABC Supplies"
              value={form.vendorName}
              onChange={(e) => set('vendorName', e.target.value)}
              className="expenses-form-input"
              required
            />
          </label>

          <label className="expenses-form-label">
            Description
            <input
              type="text"
              placeholder="What was this for?"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="expenses-form-input"
              required
            />
          </label>

          <label className="expenses-form-label">
            Amount (৳)
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount || ''}
              onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
              className="expenses-form-input"
              required
            />
          </label>

          <label className="expenses-form-label">
            Category
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value as ExpenseCategory)}
              className="expenses-form-input"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="expenses-form-label">
            Payment Method
            <select
              value={form.paymentType}
              onChange={(e) => set('paymentType', e.target.value as ExpensePaymentType)}
              className="expenses-form-input"
            >
              {EXPENSE_PAYMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="expenses-form-actions">
            <button type="button" className="button-outline" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="button-primary"
              disabled={isPending || !form.vendorName.trim() || form.amount <= 0}
              style={{ opacity: isPending || !form.vendorName.trim() || form.amount <= 0 ? 0.5 : 1 }}
            >
              {isPending ? 'Saving...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {  useAuth  } from '../../hooks/useAuth';
import { Phone, MessageCircle, FileText, Check, AlertCircle, X, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState, SkeletonCard, SkeletonBlock } from '../../components/PageState';
import { useDebounce } from '../../hooks/useDebounce';
import { PageHeader } from '../../components/layout/PageHeader';
import { clsx } from 'clsx';

type Receivable = {
  party_id: string;
  customer_name: string;
  phone: string;
  balance_due: number;
  days_overdue: number;
  last_note: string | null;
  promise_to_pay_date: string | null;
};

export const CollectionsWorkspace: React.FC = () => {
  const { tenantId, storeId } = useAuth();

  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  // Resolve the store's cash ledger account ID for the payment modal.
  const [cashAccountState, setCashAccountState] = useState<{
    storeId: string | null;
    accountId: string | null;
  }>({
    storeId: null,
    accountId: null,
  });
  const cashAccountId = cashAccountState.storeId === storeId ? cashAccountState.accountId : null;

  useEffect(() => {
    if (!storeId) {
      return;
    }
    supabase
      .from('ledger_accounts')
      .select('id')
      .eq('store_id', storeId)
      .eq('code', '1000_CASH')
      .maybeSingle()
      .then(({ data: acct }) => {
        setCashAccountState({
          storeId,
          accountId: (acct?.id as string) ?? null,
        });
      });
  }, [storeId]);

  // Modals
  const [selectedParty, setSelectedParty] = useState<Receivable | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Form states
  const [noteText, setNoteText] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAging = useCallback(async () => {
    if (!tenantId || !storeId) return;
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase.rpc('get_receivables_aging', {
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_search: debouncedSearch || undefined
    });

    if (!error && data) {
      setReceivables(data as Receivable[]);
    } else {
      setFetchError(error?.message ?? 'Failed to load receivables.');
    }
    setLoading(false);
  }, [tenantId, storeId, debouncedSearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchAging();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchAging]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    setActionLoading(true);
    setActionError(null);

    const { error } = await supabase.rpc('add_followup_note', {
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_party_id: selectedParty.party_id,
      p_note_text: noteText,
      p_promise_date: promiseDate || undefined
    });

    setActionLoading(false);
    if (!error) {
      setNoteModalOpen(false);
      setNoteText('');
      setPromiseDate('');
      fetchAging();
    } else {
      setActionError(error.message);
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !paymentAmount) return;

    if (!cashAccountId) {
      setActionError('Cash account not configured for this store. Contact your administrator.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    const { error } = await supabase.rpc('record_customer_payment', {
      p_idempotency_key: `pay_${Date.now()}_${selectedParty.party_id}`,
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_party_id: selectedParty.party_id,
      p_amount: parseFloat(paymentAmount),
      p_payment_account_id: cashAccountId
    });

    setActionLoading(false);
    if (!error) {
      setPaymentModalOpen(false);
      setPaymentAmount('');
      fetchAging();
    } else {
      setActionError(error.message);
    }
  };

  const handleWhatsApp = async (r: Receivable) => {
    await supabase.rpc('log_customer_reminder', {
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_party_id: r.party_id,
      p_type: 'whatsapp'
    });

    const message = `Assalamu Alaikum ${r.customer_name},\nYour outstanding balance at Lucky Store is ৳${r.balance_due.toLocaleString()}.\nPlease clear dues at your earliest convenience.\nThank you.`;
    const url = `https://wa.me/${r.phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const totalReceivables = receivables.reduce((sum, r) => sum + r.balance_due, 0);
  const overdueCount = receivables.filter(r => r.days_overdue > 30).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Collections Workspace"
        subtitle="Track receivables and follow up with customers."
      />

      {/* Fetch error banner */}
      {fetchError && (
        <div className="p-4 mb-6 bg-danger/10 border border-danger/25 text-danger rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button
            onClick={fetchAging}
            className="ml-2 bg-transparent border border-danger text-danger rounded px-2 py-0.5 text-xs font-semibold hover:bg-danger/10"
          >
            Retry
          </button>
          <button
            onClick={() => setFetchError(null)}
            className="ml-auto bg-transparent border-none cursor-pointer text-danger"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="card flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Total Receivables</span>
              <span className="text-2xl font-bold text-warning">৳ {totalReceivables.toLocaleString()}</span>
            </div>
            <div className="card flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Customers Overdue</span>
              <span className="text-2xl font-bold text-danger">{overdueCount}</span>
            </div>
            <div className="card flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Active Promises</span>
              <span className="text-2xl font-bold text-success">
                {receivables.filter(r => r.promise_to_pay_date).length}
              </span>
            </div>
            <div className="card flex flex-col gap-2">
              <span className="text-sm font-medium text-text-muted">Accounts</span>
              <span className="text-2xl font-bold text-text-primary">{receivables.length}</span>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or phone..."
          className="w-full max-w-sm px-4 py-2 border border-border-default rounded-md bg-surface-default text-text-primary outline-none focus:border-primary-default"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-border-default bg-background-subtle text-text-muted text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold text-left">Customer</th>
                <th className="p-4 font-semibold text-right">Amount Due</th>
                <th className="p-4 font-semibold text-right">Age (Days)</th>
                <th className="p-4 font-semibold text-left">Promise Date</th>
                <th className="p-4 font-semibold text-left max-w-[200px]">Latest Note</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border-default">
                    <td className="p-4">
                      <SkeletonBlock className="w-[120px] h-4" />
                      <SkeletonBlock className="w-[80px] h-3 mt-1" />
                    </td>
                    <td className="p-4 text-right"><SkeletonBlock className="w-[80px] h-[18px] ml-auto" /></td>
                    <td className="p-4 text-right"><SkeletonBlock className="w-[40px] h-[18px] ml-auto" /></td>
                    <td className="p-4"><SkeletonBlock className="w-[100px] h-[14px]" /></td>
                    <td className="p-4"><SkeletonBlock className="w-[160px] h-[14px]" /></td>
                    <td className="p-4 text-right"><SkeletonBlock className="w-[120px] h-[30px] ml-auto" /></td>
                  </tr>
                ))
              ) : receivables.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<DollarSign size={48} />}
                      title="No outstanding receivables"
                      description="All customer dues are cleared."
                    />
                  </td>
                </tr>
              ) : receivables.map((r) => (
                <tr key={r.party_id} className="border-b border-border-default hover:bg-background-subtle">
                  <td className="p-4">
                    <div className="font-semibold text-text-primary">{r.customer_name}</div>
                    <div className="text-xs text-text-muted">{r.phone || 'No phone'}</div>
                  </td>
                  <td className="p-4 text-right font-bold text-warning">
                    ৳ {r.balance_due.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className={clsx(
                      'inline-block px-2 py-0.5 rounded-full text-xs font-semibold',
                      r.days_overdue > 30 ? 'bg-danger/10 text-danger' : 'bg-background-subtle text-text-muted'
                    )}>
                      {r.days_overdue}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.promise_to_pay_date ? (
                      <div className="text-success font-medium">
                        {format(new Date(r.promise_to_pay_date), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-text-muted max-w-[200px] truncate">
                    {r.last_note || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleWhatsApp(r)}
                        title="WhatsApp Reminder"
                        className="inline-flex items-center justify-center p-2 rounded-md bg-success/15 text-success hover:bg-success/25 transition-colors cursor-pointer border-none"
                      >
                        <MessageCircle size={16} />
                      </button>
                      {r.phone && (
                        <a
                          href={`tel:${r.phone}`}
                          title="Call"
                          className="inline-flex items-center justify-center p-2 rounded-md bg-info/15 text-info hover:bg-info/25 transition-colors"
                        >
                          <Phone size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => { setSelectedParty(r); setActionError(null); setNoteModalOpen(true); }}
                        title="Add Note"
                        className="inline-flex items-center justify-center p-2 rounded-md bg-background-subtle text-text-muted hover:bg-background-default hover:text-text-primary transition-colors cursor-pointer border-none"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedParty(r); setActionError(null); setPaymentModalOpen(true); }}
                        title="Receive Payment"
                        className="inline-flex items-center justify-center p-2 rounded-md bg-warning/15 text-warning hover:bg-warning/25 transition-colors cursor-pointer border-none"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Modal */}
      {noteModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-surface-default border border-border-default shadow-xl rounded-xl">
            <h2 className="text-xl font-bold text-text-primary mb-2">Follow-up Note</h2>
            <p className="text-sm text-text-muted mb-6">
              Recording note for <strong className="text-text-primary">{selectedParty.customer_name}</strong>
            </p>

            {actionError && (
              <div className="p-3 mb-4 bg-danger/10 border border-danger/25 text-danger rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle size={14} />{actionError}
              </div>
            )}

            <form onSubmit={handleAddNote} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Note Details</label>
                <textarea
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default min-h-[96px] resize-none"
                  placeholder="E.g. Called, promised to pay next week..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Promise to Pay Date (Optional)</label>
                <input
                  type="date"
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setNoteModalOpen(false); setActionError(null); }}
                  className="button-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="button-primary flex-1"
                  style={{ opacity: actionLoading ? 0.5 : 1 }}
                >
                  {actionLoading ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-surface-default border border-border-default shadow-xl rounded-xl">
            <h2 className="text-xl font-bold text-text-primary mb-4">Receive Payment</h2>
            <div className="bg-warning/10 border border-warning/20 rounded-md p-4 mb-6">
              <div className="text-sm text-text-muted mb-1">Outstanding Balance</div>
              <div className="text-2xl font-bold text-warning">৳ {selectedParty.balance_due.toLocaleString()}</div>
            </div>

            {actionError && (
              <div className="p-3 mb-4 bg-danger/10 border border-danger/25 text-danger rounded-lg flex items-center gap-2 text-xs">
                <AlertCircle size={14} />{actionError}
              </div>
            )}

            <form onSubmit={handleReceivePayment} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted mb-1 uppercase tracking-wider">Amount Received (৳)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedParty.balance_due}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 border border-border-default rounded-md bg-background-subtle text-text-primary outline-none focus:border-primary-default text-xl font-bold"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setPaymentModalOpen(false); setActionError(null); }}
                  className="button-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !cashAccountId}
                  className="button-success flex-1 min-h-[44px] flex items-center justify-center gap-2"
                  style={{ opacity: (actionLoading || !cashAccountId) ? 0.5 : 1 }}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

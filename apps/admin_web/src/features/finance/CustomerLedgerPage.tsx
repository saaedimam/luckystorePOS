import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Party, LedgerEntry } from '../../types/finance';
import { format } from 'date-fns';
import { Users, RefreshCw } from 'lucide-react';
import { ErrorState, EmptyState, SkeletonBlock, SkeletonCard } from '../../components/PageState';

export const CustomerLedgerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('type', 'customer')
      .order('name');
    
    if (error) {
      setFetchError(error.message);
    } else if (data) {
      setCustomers(data as Party[]);
    }
    setLoading(false);
  };

  const fetchLedger = async (customer: Party) => {
    setSelectedCustomer(customer);
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('party_id', customer.id)
      .order('effective_date', { ascending: false });
    
    if (!error && data) {
      setLedgerEntries(data as LedgerEntry[]);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <header className="mb-8">
          <SkeletonBlock className="w-[300px] h-7" />
          <SkeletonBlock className="w-[280px] h-[18px] mt-2" />
        </header>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="dashboard-container">
        <header className="mb-8">
          <h1 className="text-[var(--font-size-2xl)] font-bold text-[var(--text-main)]">Customer Receivable Ledger</h1>
          <p className="text-[var(--text-muted)]">View customer statements and transaction history.</p>
        </header>
        <div className="card">
          <ErrorState message="Failed to load customers." onRetry={fetchCustomers} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>Customer Receivable Ledger</h1>
        <p style={{ color: 'var(--text-muted)' }}>View customer statements and transaction history.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Customer List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {customers.length === 0 ? (
            <div className="card col-[1/-1]">
              <EmptyState
                icon={<Users size={48} />}
                title="No customers yet"
                description="Customers will appear here once they have a balance."
              />
            </div>
          ) : customers.map((c) => (
            <button
              key={c.id}
              onClick={() => fetchLedger(c)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: selectedCustomer?.id === c.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: selectedCustomer?.id === c.id ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: selectedCustomer?.id === c.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
              className="card"
            >
              <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.name}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{c.phone || 'No phone'}</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: '700', color: c.current_balance > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                ৳ {c.current_balance.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginTop: '2px' }}>
                Current Balance (Due)
              </div>
            </button>
          ))}
        </div>

        {/* Ledger Detail */}
        {selectedCustomer ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'rgba(0,0,0,0.02)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedCustomer.name}</h2>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Statement of Account</p>
              </div>
              <button
                className="button-outline"
                onClick={() => window.print()}
              >
                Print Statement
              </button>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-size-xs)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    <th style={{ padding: 'var(--space-4)' }}>Date</th>
                    <th style={{ padding: 'var(--space-4)' }}>Reference</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Debit (Sale)</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Credit (Paid)</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600', color: 'var(--text-main)', marginBottom: 'var(--space-1)' }}>No transactions yet</p>
                        <p style={{ fontSize: 'var(--font-size-sm)' }}>Transactions will appear once sales or payments are recorded.</p>
                      </td>
                    </tr>
                  ) : ledgerEntries.map((entry, idx) => {
                    const balanceAtPoint = ledgerEntries
                      .slice(idx)
                      .reduce((acc, curr) => acc + (curr.debit_amount - curr.credit_amount), 0);
                      
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                          {format(new Date(entry.effective_date), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{entry.reference_type}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-light)' }}>
                            {entry.reference_id}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--color-warning)', fontWeight: '600' }}>
                          {entry.debit_amount > 0 ? `৳ ${entry.debit_amount.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--color-success)', fontWeight: '600' }}>
                          {entry.credit_amount > 0 ? `৳ ${entry.credit_amount.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                          ৳ {balanceAtPoint.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-12)',
            border: '2px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <Users size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
            <p>Select a customer to view their statement</p>
          </div>
        )}
      </div>
    </div>
  );
};
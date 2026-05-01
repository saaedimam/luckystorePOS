import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Party, LedgerEntry } from '../../types/finance';
import { format } from 'date-fns';
import { Store } from 'lucide-react';
import { ErrorState, EmptyState, SkeletonBlock, SkeletonCard } from '../../components/PageState';

export const SupplierLedgerPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('type', 'supplier')
      .order('name');
    
    if (error) {
      setFetchError(error.message);
    } else if (data) {
      setSuppliers(data as Party[]);
    }
    setLoading(false);
  };

  const fetchLedger = async (supplier: Party) => {
    setSelectedSupplier(supplier);
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('party_id', supplier.id)
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
          <h1 className="text-[var(--font-size-2xl)] font-bold text-[var(--text-main)]">Supplier Payable Ledger</h1>
          <p className="text-[var(--text-muted)]">View supplier statements and transaction history.</p>
        </header>
        <div className="card">
          <ErrorState message="Failed to load suppliers." onRetry={fetchSuppliers} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '700', color: 'var(--text-main)' }}>Supplier Payable Ledger</h1>
        <p style={{ color: 'var(--text-muted)' }}>View supplier statements and transaction history.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Supplier List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
          {suppliers.length === 0 ? (
            <div className="card col-[1/-1]">
              <EmptyState
                icon={<Store size={48} />}
                title="No suppliers yet"
                description="Suppliers will appear here once they have a balance."
              />
            </div>
          ) : suppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => fetchLedger(s)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                border: selectedSupplier?.id === s.id ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: selectedSupplier?.id === s.id ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-card)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                boxShadow: selectedSupplier?.id === s.id ? 'var(--shadow-md)' : 'var(--shadow-sm)'
              }}
              className="card"
            >
              <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{s.name}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{s.phone || 'No phone'}</div>
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-lg)', fontWeight: '700', color: s.current_balance > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                ৳ {s.current_balance.toLocaleString()}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginTop: '2px' }}>
                Current Payable
              </div>
            </button>
          ))}
        </div>

        {/* Ledger Detail */}
        {selectedSupplier ? (
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
                <h2 style={{ fontWeight: '700', color: 'var(--text-main)' }}>{selectedSupplier.name}</h2>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Transaction History</p>
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
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Debit (Paid)</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Credit (Purch)</th>
                    <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry, idx) => {
                    const balanceAtPoint = ledgerEntries
                      .slice(idx)
                      .reduce((acc, curr) => acc + (curr.credit_amount - curr.debit_amount), 0);
                      
                    return (
                      <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                          {format(new Date(entry.effective_date), 'MMM dd, yyyy')}
                        </td>
                        <td style={{ padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{entry.reference_type}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-light)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.reference_id}
                          </div>
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--color-success)', fontWeight: '600' }}>
                          {entry.debit_amount > 0 ? `৳ ${entry.debit_amount.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', color: 'var(--color-danger)', fontWeight: '600' }}>
                          {entry.credit_amount > 0 ? `৳ ${entry.credit_amount.toLocaleString()}` : '-'}
                        </td>
                        <td style={{ padding: 'var(--space-4)', textAlign: 'right', fontWeight: '700', color: 'var(--text-main)' }}>
                          ৳ {balanceAtPoint.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {ledgerEntries.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No transactions found for this supplier.
                      </td>
                    </tr>
                  )}
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
            <Store size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.2 }} />
            <p>Select a supplier to view their statement</p>
          </div>
        )}
      </div>
    </div>
  );
};
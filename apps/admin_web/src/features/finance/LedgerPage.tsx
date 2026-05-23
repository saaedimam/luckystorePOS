import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Party, LedgerEntry } from '../../types/finance';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { SkeletonCard } from '../../components/PageState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../layouts/PageHeader';
import { PageContainer } from '../../layouts/PageContainer';
import { Drawer } from '../../components/ui/Drawer';
import {  useAuth  } from '../../hooks/useAuth';
import { useNotify } from '../../components/NotificationContext';

interface LedgerPageConfig {
  partyType: 'customer' | 'supplier';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  balanceLabel: string;
  balanceColorPositive: string; // CSS variable for positive balance
  statementSubtitle: string;
  debitLabel: string;
  creditLabel: string;
  debitColor: string; // CSS variable
  creditColor: string; // CSS variable
  balanceSign: 1 | -1; // 1 = debit - credit (customer), -1 = credit - debit (supplier)
  emptyLedgerText: string;
}

export const LedgerPage: React.FC<LedgerPageConfig> = ({
  partyType,
  title,
  subtitle,
  icon: Icon,
  emptyTitle,
  emptyDescription,
  balanceLabel,
  balanceColorPositive,
  statementSubtitle,
  debitLabel,
  creditLabel,
  debitColor,
  creditColor,
  balanceSign,
  emptyLedgerText,
}) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [showAddParty, setShowAddParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const { tenantId } = useAuth();
  const { notify } = useNotify();


  const fetchParties = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('type', partyType)
      .order('name');

    if (error) {
      setFetchError(error.message);
    } else if (data) {
      setParties(data as Party[]);
    }
    setLoading(false);
  }, [partyType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchParties();
  }, [fetchParties]);

  const fetchLedger = async (party: Party) => {
    setSelectedParty(party);
    const { data, error } = await (supabase
      .from('ledger_entries' as unknown as 'items')
      .select('*') as unknown as {
        eq: (key: string, value: string) => {
          order: (key: string, options: { ascending: boolean }) => Promise<{ data: unknown[]; error: { message: string } | null }>
        }
      })
      .eq('party_id', party.id)
      .order('effective_date', { ascending: false });

    if (!error && data) {
      setLedgerEntries(data as unknown as LedgerEntry[]);
    }
  };

  if (loading) {
    return (
      <PageContainer className="dashboard-container">
        <PageHeader title="Loading Ledger..." description="Gathering records" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  if (fetchError) {
    return (
      <PageContainer className="dashboard-container">
        <PageHeader title={title} description={subtitle} />
        <div className="card">
          <ErrorState message={`Failed to load ${partyType}s.`} onRetry={fetchParties} />
        </div>
      </PageContainer>
    );
  }

  const balanceAtPoint = (idx: number) =>
    ledgerEntries
      .slice(idx)
      .reduce((acc, curr) => acc + balanceSign * (curr.debit_amount - curr.credit_amount), 0);

  return (
    <PageContainer className="dashboard-container">
      <PageHeader title={title} description={subtitle} action={
        <button className="button-primary" onClick={() => setShowAddParty(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <Plus size={18} /> Add {partyType === 'supplier' ? 'Supplier' : 'Customer'}
        </button>
      } />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Party List */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          {parties.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Icon size={48} />}
                title={emptyTitle}
                description={emptyDescription}
              />
            </div>
          ) : parties.map((p) => (
            <button
              key={p.id}
              onClick={() => fetchLedger(p)}
              className={`card text-left transition-all cursor-pointer ${
                selectedParty?.id === p.id 
                  ? 'border-[var(--color-primary-default)] bg-[var(--color-primary-subtle)] shadow-md' 
                  : 'hover:border-[var(--color-primary-default)] hover:shadow-md'
              }`}
            >
              <div className="font-semibold text-text-primary">{p.name}</div>
              <div className="text-sm text-text-muted">{p.phone || 'No phone'}</div>
              <div className="mt-2 text-lg font-bold" style={{ color: (p.current_balance ?? 0) > 0 ? balanceColorPositive : 'var(--color-success-default)' }}>
                ৳ {(p.current_balance ?? 0).toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-wider text-text-muted mt-0.5">
                {balanceLabel}
              </div>
            </button>
          ))}
        </div>

        {/* Ledger Detail */}
        <div className="w-full lg:w-2/3">
          {selectedParty ? (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header flex justify-between items-center bg-surface-secondary">
                <div>
                  <h2 className="card-title text-text-primary">{selectedParty.name}</h2>
                  <p className="text-xs text-text-muted">{statementSubtitle}</p>
                </div>
                <button
                  className="button-outline"
                  onClick={() => window.print()}
                >
                  Print Statement
                </button>
              </div>
  
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th className="text-right">{debitLabel}</th>
                    <th className="text-right">{creditLabel}</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="p-12 text-center">
                          <p className="text-lg font-semibold text-text-primary mb-1">{emptyLedgerText}</p>
                          <p className="text-sm text-text-muted">Transactions will appear once sales or payments are recorded.</p>
                        </div>
                      </td>
                    </tr>
                  ) : ledgerEntries.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td className="text-text-muted text-sm">
                        {format(new Date(entry.effective_date), 'MMM dd, yyyy')}
                      </td>
                      <td>
                        <div className="font-medium text-text-primary">{entry.reference_type}</div>
                        <div className="text-xs text-text-muted truncate max-w-[120px]">
                          {entry.reference_id}
                        </div>
                      </td>
                      <td className="text-right font-semibold" style={{ color: debitColor }}>
                        {entry.debit_amount > 0 ? `৳ ${entry.debit_amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right font-semibold" style={{ color: creditColor }}>
                        {entry.credit_amount > 0 ? `৳ ${entry.credit_amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="text-right font-bold text-text-primary">
                        ৳ {balanceAtPoint(idx).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card flex items-center justify-center p-12 border-dashed border-2 border-border-default">
              <EmptyState 
                icon={<Icon size={48} />} 
                title={`Select a ${partyType}`}
                description="Choose an account from the list to view their statement" 
              />
            </div>
          )}
        </div>
      </div>

      <Drawer isOpen={showAddParty} onClose={() => setShowAddParty(false)} title={`Add ${partyType === 'supplier' ? 'Supplier' : 'Customer'}`}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newPartyName.trim()) { notify('Name is required', 'error'); return; }
          const { data, error } = await supabase.from('parties').insert([{
            tenant_id: tenantId,
            type: partyType,
            name: newPartyName.trim(),
            phone: newPartyPhone.trim() || null,
          }]).select().single();
          if (error) { notify(error.message, 'error'); return; }
          if (data) setParties(prev => [...prev, data as Party]);
          setNewPartyName('');
          setNewPartyPhone('');
          setShowAddParty(false);
          notify(`${partyType === 'supplier' ? 'Supplier' : 'Customer'} added`, 'success');
        }} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name *</label>
            <input type="text" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} className="input w-full" placeholder="Enter name" required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input type="text" value={newPartyPhone} onChange={e => setNewPartyPhone(e.target.value)} className="input w-full" placeholder="Phone number" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="button-outline" onClick={() => setShowAddParty(false)}>Cancel</button>
            <button type="submit" className="button-primary">Add {partyType === 'supplier' ? 'Supplier' : 'Customer'}</button>
          </div>
        </form>
      </Drawer>
    </PageContainer>
  );
};
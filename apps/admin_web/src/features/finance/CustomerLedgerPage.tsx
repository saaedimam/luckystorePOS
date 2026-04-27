import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Party, LedgerEntry } from '../../types/finance';
import { format } from 'date-fns';

export const CustomerLedgerPage: React.FC = () => {
  const [customers, setCustomers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('type', 'customer')
      .order('name');
    
    if (!error && data) {
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

  if (loading) return <div className="p-8 text-white/50">Loading customers...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Customer Receivable Ledger</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 space-y-4">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => fetchLedger(c)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedCustomer?.id === c.id
                  ? 'bg-amber-500/10 border-amber-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-semibold text-white">{c.name}</div>
              <div className="text-sm text-white/40">{c.phone || 'No phone'}</div>
              <div className={`mt-2 text-lg font-bold ${c.current_balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ৳ {c.current_balance.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/20 mt-1">
                Current Balance (Due)
              </div>
            </button>
          ))}
        </div>

        {/* Ledger Detail */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-xs text-white/40">Statement of Account</p>
                </div>
                <button 
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                  onClick={() => window.print()}
                >
                  Print Statement
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5 bg-white/[0.02]">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4 text-right">Debit (Sale)</th>
                      <th className="p-4 text-right">Credit (Paid)</th>
                      <th className="p-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/80">
                    {ledgerEntries.map((entry, idx) => {
                      const balanceAtPoint = ledgerEntries
                        .slice(idx)
                        .reduce((acc, curr) => acc + (curr.debit_amount - curr.credit_amount), 0);
                        
                      return (
                        <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-4 text-white/60">
                            {format(new Date(entry.effective_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{entry.reference_type}</div>
                            <div className="text-[10px] text-white/30">
                              {entry.reference_id}
                            </div>
                          </td>
                          <td className="p-4 text-right text-amber-400">
                            {entry.debit_amount > 0 ? `৳ ${entry.debit_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-right text-emerald-400">
                            {entry.credit_amount > 0 ? `৳ ${entry.credit_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-right font-bold">
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
            <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl text-white/20">
              <div className="text-4xl mb-4">👤</div>
              <p>Select a customer to view their statement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

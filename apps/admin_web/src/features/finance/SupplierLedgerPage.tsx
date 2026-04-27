import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Party, LedgerEntry } from '../../types/finance';
import { format } from 'date-fns';

export const SupplierLedgerPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<Party | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('type', 'supplier')
      .order('name');
    
    if (!error && data) {
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

  if (loading) return <div className="p-8 text-white/50">Loading suppliers...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Supplier Payable Ledger</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier List */}
        <div className="lg:col-span-1 space-y-4">
          {suppliers.map((s) => (
            <button
              key={s.id}
              onClick={() => fetchLedger(s)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedSupplier?.id === s.id
                  ? 'bg-amber-500/10 border-amber-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="font-semibold text-white">{s.name}</div>
              <div className="text-sm text-white/40">{s.phone || 'No phone'}</div>
              <div className={`mt-2 text-lg font-bold ${s.current_balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                ৳ {s.current_balance.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/20 mt-1">
                Current Payable
              </div>
            </button>
          ))}
        </div>

        {/* Ledger Detail */}
        <div className="lg:col-span-2">
          {selectedSupplier ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-white">{selectedSupplier.name}</h2>
                  <p className="text-xs text-white/40">Transaction History</p>
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
                      <th className="p-4 text-right">Debit (Paid)</th>
                      <th className="p-4 text-right">Credit (Purch)</th>
                      <th className="p-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-white/80">
                    {ledgerEntries.map((entry, idx) => {
                      // Note: This is a simplified balance calculation for the view
                      const balanceAtPoint = ledgerEntries
                        .slice(idx)
                        .reduce((acc, curr) => acc + (curr.credit_amount - curr.debit_amount), 0);
                        
                      return (
                        <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-4 text-white/60">
                            {format(new Date(entry.effective_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{entry.reference_type}</div>
                            <div className="text-[10px] text-white/30 truncate max-w-[120px]">
                              {entry.reference_id}
                            </div>
                          </td>
                          <td className="p-4 text-right text-emerald-400">
                            {entry.debit_amount > 0 ? `৳ ${entry.debit_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-right text-red-400">
                            {entry.credit_amount > 0 ? `৳ ${entry.credit_amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="p-4 text-right font-bold">
                            ৳ {balanceAtPoint.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {ledgerEntries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-white/20">
                          No transactions found for this supplier.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl text-white/20">
              <div className="text-4xl mb-4">📒</div>
              <p>Select a supplier to view their statement</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

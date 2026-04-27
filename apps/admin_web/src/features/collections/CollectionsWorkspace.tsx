import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Phone, MessageCircle, FileText, Check } from 'lucide-react';
import { format } from 'date-fns';

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
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedParty, setSelectedParty] = useState<Receivable | null>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Form states
  const [noteText, setNoteText] = useState('');
  const [promiseDate, setPromiseDate] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // App context (mocked for this snippet, typically fetched from auth/context)
  const [tenantId] = useState('00000000-0000-0000-0000-000000000001'); // Replace with actual context
  const [storeId] = useState('00000000-0000-0000-0000-000000000002');   // Replace with actual context

  useEffect(() => {
    fetchAging();
  }, [search]);

  const fetchAging = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_receivables_aging', {
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_search: search || null
    });

    if (!error && data) {
      setReceivables(data as Receivable[]);
    } else {
      console.error('Error fetching aging:', error);
    }
    setLoading(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;

    const { error } = await supabase.rpc('add_followup_note', {
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_party_id: selectedParty.party_id,
      p_note_text: noteText,
      p_promise_date: promiseDate || null
    });

    if (!error) {
      setNoteModalOpen(false);
      setNoteText('');
      setPromiseDate('');
      fetchAging();
    }
  };

  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || !paymentAmount) return;

    // Typically you'd fetch the payment account ID. Hardcoding cash account for demo/mock:
    const cashAccountId = '00000000-0000-0000-0000-000000000003';

    const { error } = await supabase.rpc('record_customer_payment', {
      p_idempotency_key: `pay_${Date.now()}_${selectedParty.party_id}`,
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_party_id: selectedParty.party_id,
      p_amount: parseFloat(paymentAmount),
      p_payment_account_id: cashAccountId
    });

    if (!error) {
      setPaymentModalOpen(false);
      setPaymentAmount('');
      fetchAging();
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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Collections Workspace</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-white/50 mb-1">Total Receivables</div>
          <div className="text-2xl font-bold text-amber-400">৳ {totalReceivables.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-white/50 mb-1">Customers Overdue</div>
          <div className="text-2xl font-bold text-rose-400">{overdueCount}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-white/50 mb-1">Active Promises</div>
          <div className="text-2xl font-bold text-emerald-400">
            {receivables.filter(r => r.promise_to_pay_date).length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-white/50 mb-1">Accounts</div>
          <div className="text-2xl font-bold text-white/90">{receivables.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <input 
          type="text" 
          placeholder="Search by name or phone..." 
          className="w-full md:w-1/3 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[11px] uppercase tracking-wider text-white/40 border-b border-white/5 bg-white/[0.02]">
              <tr>
                <th className="p-4">Customer</th>
                <th className="p-4 text-right">Amount Due</th>
                <th className="p-4 text-right">Age (Days)</th>
                <th className="p-4">Promise Date</th>
                <th className="p-4 w-1/4">Latest Note</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-white/80">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">Loading receivables...</td></tr>
              ) : receivables.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-white/40">No dues found.</td></tr>
              ) : receivables.map((r) => (
                <tr key={r.party_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="font-semibold text-white">{r.customer_name}</div>
                    <div className="text-xs text-white/50">{r.phone || 'No phone'}</div>
                  </td>
                  <td className="p-4 text-right font-bold text-amber-400">
                    ৳ {r.balance_due.toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.days_overdue > 30 ? 'bg-rose-500/20 text-rose-400' : 'bg-white/10 text-white/60'}`}>
                      {r.days_overdue}
                    </span>
                  </td>
                  <td className="p-4">
                    {r.promise_to_pay_date ? (
                      <div className="text-emerald-400 font-medium">
                        {format(new Date(r.promise_to_pay_date), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      <span className="text-white/20">-</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-white/60 truncate max-w-[200px]">
                    {r.last_note || '-'}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleWhatsApp(r)}
                      title="WhatsApp Reminder"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                    >
                      <MessageCircle size={16} />
                    </button>
                    {r.phone && (
                      <a 
                        href={`tel:${r.phone}`}
                        title="Call"
                        className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors inline-block"
                      >
                        <Phone size={16} />
                      </a>
                    )}
                    <button 
                      onClick={() => { setSelectedParty(r); setNoteModalOpen(true); }}
                      title="Add Note"
                      className="p-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg transition-colors"
                    >
                      <FileText size={16} />
                    </button>
                    <button 
                      onClick={() => { setSelectedParty(r); setPaymentModalOpen(true); }}
                      title="Receive Payment"
                      className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors"
                    >
                      <Check size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Modal */}
      {noteModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Follow-up Note</h2>
            <p className="text-sm text-white/50 mb-6">Recording note for <strong className="text-white">{selectedParty.customer_name}</strong></p>
            
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Note Details</label>
                <textarea 
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-primary h-24 resize-none"
                  placeholder="E.g. Called, promised to pay next week..."
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Promise to Pay Date (Optional)</label>
                <input 
                  type="date" 
                  value={promiseDate}
                  onChange={(e) => setPromiseDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-primary"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setNoteModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-semibold shadow-lg shadow-primary/20"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOpen && selectedParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Receive Payment</h2>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="text-sm text-amber-500/70 mb-1">Outstanding Balance</div>
              <div className="text-2xl font-bold text-amber-400">৳ {selectedParty.balance_due.toLocaleString()}</div>
            </div>
            
            <form onSubmit={handleReceivePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1 uppercase tracking-wider">Amount Received (৳)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={selectedParty.balance_due}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-primary text-xl font-bold"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-500/20"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

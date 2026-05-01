import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { Trash2, Save, Send, Search, Package } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

type Supplier = {
  id: string;
  name: string;
  phone?: string;
};

type Item = {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
};

type ReceiptLine = {
  item: Item;
  quantity: number;
  unitCost: number;
};

export const PurchaseEntryPage: React.FC = () => {
  // Form state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceTotal, setInvoiceTotal] = useState('');
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [amountPaid, setAmountPaid] = useState('0');

  // Item search
  const [itemSearch, setItemSearch] = useState('');
  const debouncedItemSearch = useDebounce(itemSearch, 300);
  const [itemResults, setItemResults] = useState<Item[]>([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [quickQty, setQuickQty] = useState(1);
  const [quickCost, setQuickCost] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auth context
  const { tenantId, storeId } = useAuth();

  // ── Load suppliers ──────────────────────────────────────────────
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setSuppliersLoading(true);
    const { data, error } = await supabase
      .from('parties')
      .select('id, name, phone')
      .eq('type', 'supplier')
      .order('name');
    if (!error && data) setSuppliers(data as Supplier[]);
    setSuppliersLoading(false);
  };

  // ── Supplier search ─────────────────────────────────────────────
  const filteredSuppliers = supplierSearch.length < 2
    ? suppliers
    : suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        (s.phone && s.phone.includes(supplierSearch))
      );

  const selectSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupplierSearch(s.name);
    setShowSupplierDropdown(false);
  };

  // ── Item search ─────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedItemSearch.length < 2) {
      setItemResults([]);
      return;
    }
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, sku, barcode, price')
        .or(`name.ilike.%${debouncedItemSearch}%,sku.ilike.%${debouncedItemSearch}%,barcode.ilike.%${debouncedItemSearch}%`)
        .limit(8);
      if (!error && data) setItemResults(data as Item[]);
    };
    fetchItems();
  }, [debouncedItemSearch]);

  const addItem = (item: Item) => {
    const cost = quickCost ? parseFloat(quickCost) : item.price;
    setLines(prev => {
      const existing = prev.findIndex(l => l.item.id === item.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          quantity: updated[existing].quantity + quickQty,
          unitCost: cost,
        };
        return updated;
      }
      return [...prev, { item, quantity: quickQty, unitCost: cost }];
    });
    setItemSearch('');
    setItemResults([]);
    setQuickQty(1);
    setQuickCost('');
  };

  const removeLine = (index: number) =>
    setLines(prev => prev.filter((_, i) => i !== index));

  // ── Calculations ────────────────────────────────────────────────
  const totalCost = lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  const paid = parseFloat(amountPaid) || 0;
  const payable = Math.max(0, totalCost - paid);

  // ── Submit ──────────────────────────────────────────────────────
  const submit = async (asDraft: boolean) => {
    setError('');
    setSuccess('');
    if (!selectedSupplier) { setError('Please select a supplier'); return; }
    if (lines.length === 0) { setError('Add at least one item'); return; }
    if (paid > totalCost) { setError('Amount paid cannot exceed total cost'); return; }

    setLoading(true);
    const itemsJson = lines.map(l => ({
      item_id: l.item.id,
      quantity: l.quantity,
      unit_cost: l.unitCost,
    }));

    const { error } = await supabase.rpc('record_purchase_v2', {
      p_idempotency_key: `pr_${Date.now()}_${selectedSupplier.id}`,
      p_tenant_id: tenantId,
      p_store_id: storeId,
      p_supplier_id: selectedSupplier.id,
      p_invoice_number: invoiceNumber || null,
      p_invoice_total: invoiceTotal ? parseFloat(invoiceTotal) : null,
      p_items: itemsJson,
      p_amount_paid: paid,
      p_status: asDraft ? 'draft' : 'posted',
    });

    setLoading(false);
    if (error) {
      setError(error.message || 'Submission failed');
    } else {
      setSuccess(asDraft ? 'Draft saved!' : 'Purchase posted successfully!');
      // Reset form
      setSelectedSupplier(null);
      setSupplierSearch('');
      setInvoiceNumber('');
      setInvoiceTotal('');
      setLines([]);
      setAmountPaid('0');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Purchase Receiving</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Supplier */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label htmlFor="supplier-search" className="block text-sm text-white/40 mb-2">Supplier</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-white/30" />
                <input
                  id="supplier-search"
                  type="text"
                  value={supplierSearch}
                  onChange={e => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  placeholder="Search supplier by name or phone..."
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-white/20"
                />
              </div>
              {showSupplierDropdown && (
                <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-[#161B22] border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                  {suppliersLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="px-4 py-3">
                        <div className="h-4 bg-white/10 rounded animate-pulse w-3/5" />
                        <div className="h-3 bg-white/5 rounded animate-pulse w-2/5 mt-2" />
                      </div>
                    ))
                  ) : filteredSuppliers.length === 0 ? (
                    <div className="p-4 text-white/30 text-sm text-center">No suppliers found</div>
                  ) : filteredSuppliers.map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectSupplier(s)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex justify-between items-center"
                    >
                      <span className="text-white font-medium">{s.name}</span>
                      <span className="text-white/40 text-sm">{s.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Info */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/40 mb-2">Invoice # (optional)</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-001"
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="block text-sm text-white/40 mb-2">Invoice Total (৳)</label>
                <input
                  type="number"
                  value={invoiceTotal}
                  onChange={e => setInvoiceTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>

          {/* Item Quick Add */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label htmlFor="item-search" className="block text-sm text-white/40 mb-2">Add Items (barcode / SKU / name)</label>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-white/30" />
                <input
                  id="item-search"
                  type="text"
                  value={itemSearch}
                  onChange={e => {
                    setItemSearch(e.target.value);
                    setShowItemDropdown(true);
                  }}
                  placeholder="Scan barcode or search item..."
                  className="flex-1 bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 outline-none focus:border-amber-500/50"
                />
              </div>
              {showItemDropdown && itemResults.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#161B22] border border-white/10 rounded-xl max-h-48 overflow-y-auto">
                  {itemResults.map(item => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-white/40 text-xs">{item.sku} {item.barcode}</div>
                      </div>
                      <div className="text-amber-400 text-sm">৳ {item.price}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <label htmlFor="quick-qty" className="block text-xs text-white/30 mb-1">Qty</label>
                <input
                  id="quick-qty"
                  type="number"
                  value={quickQty}
                  onChange={e => setQuickQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="quick-cost" className="block text-xs text-white/30 mb-1">Unit Cost (৳)</label>
                <input
                  id="quick-cost"
                  type="number"
                  value={quickCost}
                  onChange={e => setQuickCost(e.target.value)}
                  placeholder="Auto"
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/20 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Receipt Lines */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="font-semibold text-white">Receipt Lines ({lines.length})</h3>
            </div>
            {lines.length === 0 ? (
              <div className="p-8 text-center">
                <Package size={32} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/30 text-sm">No items added yet. Search or scan items above.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {lines.map((l, i) => (
                  <div key={i} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{l.item.name}</div>
                      <div className="text-white/40 text-sm">
                        {l.quantity} × ৳{l.unitCost} = ৳{(l.quantity * l.unitCost).toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-300" aria-label="Remove item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary + Actions */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-6">
            <h3 className="font-semibold text-white mb-4">Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">Total Cost</span>
                <span className="text-white font-bold">৳ {totalCost.toFixed(2)}</span>
              </div>

              <div>
                <label htmlFor="cash-paid" className="block text-white/40 mb-1">Cash Paid Now (৳)</label>
                <input
                  id="cash-paid"
                  type="number"
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                  className="w-full bg-[#161B22] border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex justify-between pt-3 border-t border-white/10">
                <span className="text-white/40">Payable (Remaining)</span>
                <span className={`font-bold ${payable > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ৳ {payable.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                title="Post purchase receipt to ledger"
                onClick={() => submit(false)}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {loading ? 'Posting...' : 'POST RECEIPT'}
              </button>
              <button
                title="Save purchase as draft"
                onClick={() => submit(true)}
                disabled={loading}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 border border-white/10"
              >
                <Save size={18} />
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

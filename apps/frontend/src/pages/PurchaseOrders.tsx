import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePOStatus,
  receivePurchaseOrder,
  type PurchaseOrder,
  type POStatus,
} from '../services/purchaseOrders'
import { getSuppliers } from '../services/purchaseOrders'
import { getItems } from '../services/items'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'

const STATUS_BADGE: Record<POStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-800',
  partially_received: 'bg-amber-100 text-amber-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
}

const CURRENCY = (n: number) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n)

// ─── Receive Modal ────────────────────────────────────────────────────────────
function ReceivePOModal({ po, onClose, onDone }: { po: PurchaseOrder; onClose: () => void; onDone: () => void }) {
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    po.items?.forEach(i => {
      init[i.id] = String(i.qty_ordered - i.qty_received)
    })
    return init
  })
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      const payload = (po.items || [])
        .map(i => ({ po_item_id: i.id, qty_received: parseInt(quantities[i.id] || '0', 10) }))
        .filter(x => x.qty_received > 0)

      if (payload.length === 0) { setErr('Enter at least one quantity to receive.'); setSaving(false); return }

      await receivePurchaseOrder(po.id, payload, notes || undefined)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to receive PO')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Receive Stock</h2>
            <p className="text-sm text-gray-500">{po.po_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleReceive} className="p-6 flex-1 overflow-y-auto space-y-4">
          {err && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{err}</div>}

          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Already Received</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Receive Now</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {po.items?.map(item => {
                  const remaining = item.qty_ordered - item.qty_received
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.item?.name}</div>
                        <div className="text-xs text-gray-400">{item.item?.sku || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.qty_ordered}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{item.qty_received}</td>
                      <td className="px-4 py-3 text-right">
                        {remaining === 0 ? (
                          <span className="text-green-600 text-xs font-medium">Fully received</span>
                        ) : (
                          <input
                            type="number" min="0" max={remaining}
                            value={quantities[item.id] || ''}
                            onChange={e => setQuantities({ ...quantities, [item.id]: e.target.value })}
                            className="w-20 text-right rounded border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. partial shipment, damaged goods…" className="w-full rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </form>

        <div className="border-t p-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleReceive} disabled={saving} className="px-4 py-2 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Receiving…' : 'Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create PO Modal ──────────────────────────────────────────────────────────
function CreatePOModal({ storeId, onClose, onDone }: { storeId: string; onClose: () => void; onDone: () => void }) {
  const [supplierId, setSupplierId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; sku: string; qty: number; cost: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })
  const { data: allItems = [] } = useQuery({ queryKey: ['items', 'all'], queryFn: () => getItems({ active: true }) })

  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const t = search.toLowerCase()
    return allItems
      .filter(i => (i.name.toLowerCase().includes(t) || (i.sku || '').toLowerCase().includes(t)) && !selectedItems.find(s => s.id === i.id))
      .slice(0, 8)
  }, [search, allItems, selectedItems])

  const addItem = (item: typeof allItems[number]) => {
    setSelectedItems(p => [...p, { id: item.id, name: item.name, sku: item.sku || '', qty: 1, cost: item.cost }])
    setSearch('')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) { setErr('Add at least one item.'); return }
    setSaving(true); setErr(null)
    try {
      await createPurchaseOrder({
        supplierId: supplierId || undefined,
        storeId,
        orderDate: orderDate || undefined,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        items: selectedItems.map(i => ({ item_id: i.id, qty_ordered: i.qty, unit_cost: i.cost })),
      })
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create PO')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl m-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5">
          {err && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{err}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full rounded-md border-gray-300 text-sm" aria-label="Supplier">
                <option value="">— No supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-md border-gray-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
              <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="w-full rounded-md border-gray-300 text-sm" aria-label="Order date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="w-full rounded-md border-gray-300 text-sm" aria-label="Expected delivery date" />
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-base font-medium text-gray-800 mb-3">Add Items</h3>
            <div className="relative mb-4">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU…" className="w-full rounded-md border-gray-300 text-sm" aria-label="Search items" />
              {search.trim() && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow rounded border max-h-48 overflow-y-auto">
                  {searchResults.length === 0
                    ? <div className="p-3 text-sm text-gray-400">No items found.</div>
                    : searchResults.map(i => (
                      <div key={i.id} onClick={() => addItem(i)} className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between">
                        <span className="text-sm font-medium text-gray-900">{i.name}</span>
                        <span className="text-xs text-gray-400">{i.sku}</span>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <div className="border rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Item','SKU','Qty Ordered','Unit Cost (BDT)',''].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {selectedItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-gray-900">{item.name}</td>
                        <td className="px-3 py-2 text-gray-400 text-xs">{item.sku}</td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={item.qty}
                            onChange={e => setSelectedItems(p => p.map(i => i.id === item.id ? { ...i, qty: parseInt(e.target.value) || 1 } : i))}
                            className="w-20 text-right rounded border-gray-300 text-sm"
                            aria-label={`Quantity for ${item.name}`} />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" step="0.01" value={item.cost}
                            onChange={e => setSelectedItems(p => p.map(i => i.id === item.id ? { ...i, cost: parseFloat(e.target.value) || 0 } : i))}
                            className="w-24 text-right rounded border-gray-300 text-sm"
                            aria-label={`Cost for ${item.name}`} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => setSelectedItems(p => p.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </form>

        <div className="border-t p-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving || selectedItems.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Creating…' : 'Create PO'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PurchaseOrders() {
  const { currentStore } = useStore()
  const { profile } = useAuth()
  const qc = useQueryClient()

  const [showCreate, setShowCreate] = useState(false)
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionErr, setActionErr] = useState<string | null>(null)

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', currentStore?.id],
    queryFn: () => getPurchaseOrders(currentStore?.id),
    enabled: !!currentStore,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: POStatus }) => updatePOStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); setActionErr(null) },
    onError: (e: Error) => setActionErr(e.message),
  })

  const isManager = profile?.role === 'admin' || profile?.role === 'manager'

  if (!currentStore) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 text-center text-gray-500">
        Please select a store to manage purchase orders.
      </div>
    )
  }

  const totalOrderValue = (po: PurchaseOrder) =>
    (po.items || []).reduce((s, i) => s + i.qty_ordered * i.unit_cost, 0)

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          New PO
        </button>
      </div>

      {actionErr && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{actionErr}</div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-md">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading purchase orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No purchase orders yet.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {orders.map(po => (
              <li key={po.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-gray-900">{po.po_number}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[po.status]}`}>
                        {po.status.replace('_', ' ')}
                      </span>
                    </div>
                    <button onClick={() => setExpandedId(expandedId === po.id ? null : po.id)} className="text-sm text-indigo-600 hover:text-indigo-800">
                      {expandedId === po.id ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 flex flex-wrap gap-4">
                    <span>Supplier: {po.supplier?.name || 'N/A'}</span>
                    <span>Value: {CURRENCY(totalOrderValue(po))}</span>
                    {po.expected_date && <span>Expected: {new Date(po.expected_date).toLocaleDateString()}</span>}
                    <span>Items: {po.items?.length || 0}</span>
                    <span>Created: {new Date(po.created_at).toLocaleDateString()}</span>
                  </div>

                  {expandedId === po.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      <div className="border rounded overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Item','SKU','Ordered','Received','Unit Cost','Line Total'].map(h => (
                                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {po.items?.map(i => (
                              <tr key={i.id}>
                                <td className="px-3 py-2 text-gray-900 font-medium">{i.item?.name}</td>
                                <td className="px-3 py-2 text-gray-400 text-xs">{i.item?.sku || '—'}</td>
                                <td className="px-3 py-2 text-gray-700">{i.qty_ordered}</td>
                                <td className="px-3 py-2">
                                  <span className={i.qty_received >= i.qty_ordered ? 'text-green-700 font-medium' : 'text-amber-700'}>
                                    {i.qty_received}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-gray-600">{CURRENCY(i.unit_cost)}</td>
                                <td className="px-3 py-2 text-gray-800 font-medium">{CURRENCY(i.qty_ordered * i.unit_cost)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Action buttons */}
                      {isManager && (
                        <div className="flex flex-wrap gap-2 justify-end bg-gray-50 p-3 rounded border">
                          {po.status === 'draft' && (
                            <>
                              <button onClick={() => statusMutation.mutate({ id: po.id, status: 'ordered' })} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Mark as Ordered</button>
                              <button onClick={() => statusMutation.mutate({ id: po.id, status: 'cancelled' })} className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50">Cancel PO</button>
                            </>
                          )}
                          {(po.status === 'ordered' || po.status === 'partially_received') && (
                            <>
                              <button onClick={() => setReceivingPO(po)} className="px-3 py-1.5 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800">Receive Stock</button>
                              <button onClick={() => { if(confirm('Cancel this PO?')) statusMutation.mutate({ id: po.id, status: 'cancelled' })}} className="px-3 py-1.5 border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50">Cancel</button>
                            </>
                          )}
                          {po.status === 'received' && <span className="text-green-700 text-sm font-medium flex items-center">✓ Fully received</span>}
                          {po.status === 'cancelled' && <span className="text-red-600 text-sm">This PO has been cancelled.</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreate && (
        <CreatePOModal
          storeId={currentStore.id}
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['purchase-orders'] }) }}
        />
      )}

      {receivingPO && (
        <ReceivePOModal
          po={receivingPO}
          onClose={() => setReceivingPO(null)}
          onDone={() => { setReceivingPO(null); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['items'] }) }}
        />
      )}
    </div>
  )
}

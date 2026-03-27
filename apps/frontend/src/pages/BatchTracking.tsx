import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBatchesForStore,
  addBatch,
  updateBatchStatus,
  type BatchStatus,
  type ItemBatch,
} from '../services/batches'
import { getItems } from '../services/items'
import { useStore } from '../hooks/useStore'

const STATUS_BADGE: Record<BatchStatus, string> = {
  active:   'bg-green-100 text-green-800',
  expired:  'bg-red-100 text-red-700',
  consumed: 'bg-gray-100 text-gray-600',
  recalled: 'bg-orange-100 text-orange-800',
}

// Computed once per module load — stable across renders
const TODAY_TS = new Date().setHours(0, 0, 0, 0)

const FILTER_TABS: { label: string; value: BatchStatus | 'all' }[] = [
  { label: 'Active',   value: 'active' },
  { label: 'Expired',  value: 'expired' },
  { label: 'Consumed', value: 'consumed' },
  { label: 'Recalled', value: 'recalled' },
  { label: 'All',      value: 'all' },
]

// ─── Add Batch Modal ──────────────────────────────────────────────────────────
function AddBatchModal({ storeId, onClose, onDone }: { storeId: string; onClose: () => void; onDone: () => void }) {
  const [itemSearch, setItemSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string } | null>(null)
  const [form, setForm] = useState({ batchNumber: '', qty: 1, expiresAt: '', manufacturedAt: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const { data: allItems = [] } = useQuery({
    queryKey: ['items', 'all'],
    queryFn: () => getItems({ active: true }),
  })

  const searchResults = useMemo(() => {
    if (!itemSearch.trim() || selectedItem) return []
    const t = itemSearch.toLowerCase()
    return allItems.filter(i => i.name.toLowerCase().includes(t) || (i.sku || '').toLowerCase().includes(t)).slice(0, 8)
  }, [itemSearch, allItems, selectedItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) { setErr('Please select an item.'); return }
    if (!form.batchNumber.trim()) { setErr('Batch number is required.'); return }
    if (form.qty < 1) { setErr('Quantity must be at least 1.'); return }
    setSaving(true); setErr(null)
    try {
      await addBatch({
        storeId,
        itemId: selectedItem.id,
        batchNumber: form.batchNumber,
        qty: form.qty,
        expiresAt: form.expiresAt || undefined,
        manufacturedAt: form.manufacturedAt || undefined,
        notes: form.notes || undefined,
      })
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add batch')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Add Batch / Lot</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{err}</div>}

          {/* Item picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
            {selectedItem ? (
              <div className="flex items-center justify-between p-2 border rounded bg-indigo-50">
                <span className="text-sm font-medium text-indigo-900">{selectedItem.name}</span>
                <button type="button" onClick={() => { setSelectedItem(null); setItemSearch('') }} className="text-xs text-red-500">Clear</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={itemSearch}
                  onChange={e => setItemSearch(e.target.value)}
                  placeholder="Search item by name or SKU…"
                  className="w-full rounded-md border-gray-300 text-sm"
                  aria-label="Search item"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white shadow rounded border max-h-48 overflow-y-auto">
                    {searchResults.map(i => (
                      <div key={i.id} onClick={() => { setSelectedItem({ id: i.id, name: i.name }); setItemSearch('') }}
                        className="p-3 hover:bg-indigo-50 cursor-pointer text-sm"
                      >
                        {i.name} <span className="text-gray-400 text-xs ml-1">{i.sku}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch / Lot Number *</label>
              <input value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })}
                placeholder="e.g. LOT-2024-001" className="w-full rounded-md border-gray-300 text-sm" aria-label="Batch number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min="1" value={form.qty} onChange={e => setForm({ ...form, qty: parseInt(e.target.value) || 1 })}
                className="w-full rounded-md border-gray-300 text-sm" aria-label="Quantity" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label>
              <input type="date" value={form.manufacturedAt} onChange={e => setForm({ ...form, manufacturedAt: e.target.value })}
                className="w-full rounded-md border-gray-300 text-sm" aria-label="Manufacturing date" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full rounded-md border-gray-300 text-sm" aria-label="Expiry date" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-md border-gray-300 text-sm" />
          </div>
        </form>

        <div className="border-t p-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Batch'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function BatchTracking() {
  const { currentStore } = useStore()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('active')
  const [showAdd, setShowAdd] = useState(false)
  const [actionErr, setActionErr] = useState<string | null>(null)

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches', currentStore?.id, statusFilter],
    queryFn: () => getBatchesForStore(currentStore!.id, statusFilter === 'all' ? undefined : statusFilter),
    enabled: !!currentStore,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BatchStatus }) => updateBatchStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['batches'] }); setActionErr(null) },
    onError: (e: Error) => setActionErr(e.message),
  })

  if (!currentStore) {
    return <div className="max-w-7xl mx-auto py-10 px-4 text-center text-gray-500">Select a store to manage batches.</div>
  }

  const getDaysLeftBadge = (batch: ItemBatch) => {
    if (!batch.expires_at) return null
    const daysLeft = Math.ceil((new Date(batch.expires_at).getTime() - TODAY_TS) / (1000 * 60 * 60 * 24))
    const colorClass = daysLeft <= 0 ? 'bg-red-200 text-red-900'
      : daysLeft <= 7  ? 'bg-red-100 text-red-800'
      : daysLeft <= 14 ? 'bg-amber-100 text-amber-800'
      : 'bg-green-50 text-green-700'
    return (
      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass}`}>
        {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch & Expiry Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          Add Batch
        </button>
      </div>

      {actionErr && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{actionErr}</div>}

      {/* Status filter tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium ${
                statusFilter === tab.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading batches…</div>
        ) : batches.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No {statusFilter === 'all' ? '' : statusFilter} batches found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Batch #', 'Item', 'Qty', 'Mfg Date', 'Expiry Date', 'Expires In', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {batches.map(batch => (
                <tr key={batch.id} className={`hover:bg-gray-50 ${batch.expires_at && new Date(batch.expires_at) < new Date() ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 font-semibold">{batch.batch_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{batch.item?.name}</div>
                    <div className="text-xs text-gray-400">{batch.item?.sku || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{batch.qty}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{batch.manufactured_at ? new Date(batch.manufactured_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs font-medium">{batch.expires_at ? new Date(batch.expires_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">{getDaysLeftBadge(batch)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[batch.status]}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {batch.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => statusMutation.mutate({ id: batch.id, status: 'expired' })}
                          className="text-xs text-red-600 hover:text-red-800 font-medium">Mark Expired</button>
                        <button onClick={() => statusMutation.mutate({ id: batch.id, status: 'consumed' })}
                          className="text-xs text-gray-500 hover:text-gray-800 font-medium">Consume</button>
                        <button onClick={() => statusMutation.mutate({ id: batch.id, status: 'recalled' })}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium">Recall</button>
                      </div>
                    )}
                    {batch.status !== 'active' && (
                      <button onClick={() => statusMutation.mutate({ id: batch.id, status: 'active' })}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddBatchModal
          storeId={currentStore.id}
          onClose={() => setShowAdd(false)}
          onDone={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['batches'] }); qc.invalidateQueries({ queryKey: ['items'] }) }}
        />
      )}
    </div>
  )
}

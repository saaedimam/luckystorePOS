import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStores } from '../services/stores'
import { getItems } from '../services/items'
import { createStockTransfer } from '../services/stockTransfers'

interface CreateTransferModalProps {
  currentStoreId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateTransferModal({ currentStoreId, onClose, onSuccess }: CreateTransferModalProps) {
  const [toStoreId, setToStoreId] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; sku: string; qty: number; maxQty: number }[]>([])
  
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all stores to pick destination
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores
  })
  
  // Destination stores = all stores EXCEPT current
  const destStores = useMemo(() => stores.filter(s => s.id !== currentStoreId), [stores, currentStoreId])

  // Fetch available items for this store
  const { data: storeItems = [] } = useQuery({
    queryKey: ['items', 'store', currentStoreId],
    queryFn: async () => {
      const allItems = await getItems({ active: true, storeId: currentStoreId })
      // Only keep items that actually have stock > 0 in this store
      return allItems.filter(item => {
        const stockArr = item.stock_levels || [] // TypeScript workaround if not fully defined in type
        const stockRecord = stockArr.find((s: Record<string, unknown>) => s.store_id === currentStoreId) as { qty: number } | undefined
        return stockRecord && stockRecord.qty > 0
      })
    }
  })

  // Filter items by search
  const searchResults = useMemo(() => {
    if (!search.trim()) return []
    const term = search.toLowerCase()
    return storeItems
      .filter(item => 
        (item.name.toLowerCase().includes(term) || (item.sku && item.sku.toLowerCase().includes(term))) &&
        !selectedItems.find(s => s.id === item.id)
      )
      .slice(0, 10)
  }, [search, storeItems, selectedItems])

  const handleAddItem = (item: { id: string; name: string; sku: string | null; stock_levels?: any[] }) => {
    const stockRecord = item.stock_levels?.find((s: Record<string, unknown>) => s.store_id === currentStoreId) as { qty: number } | undefined
    const maxQty = stockRecord ? stockRecord.qty : 0
    if (maxQty === 0) return

    setSelectedItems(prev => [
      ...prev,
      { id: item.id, name: item.name, sku: item.sku || '', qty: 1, maxQty }
    ])
    setSearch('')
  }

  const handleUpdateQty = (id: string, qtyStr: string) => {
    const raw = parseInt(qtyStr, 10)
    const qty = isNaN(raw) ? 0 : raw
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.min(Math.max(1, qty), item.maxQty) }
      }
      return item
    }))
  }

  const handleRemoveItem = (id: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!toStoreId) {
      setError('Please select a destination store.')
      return
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one item to transfer.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await createStockTransfer({
        fromStoreId: currentStoreId,
        toStoreId,
        notes,
        items: selectedItems.map(i => ({ item_id: i.id, qty: i.qty }))
      })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transfer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Initiate Stock Transfer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-sm text-red-800 rounded-md shadow-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination Store *</label>
              <select
                required
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Select a store...</option>
                {destStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason or reference for transfer..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Items</h3>
            
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search & Add Items</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or SKU..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              
              {search.trim() !== '' && (
                <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-sm text-gray-500">No available items found.</div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {searchResults.map((item: { id: string; name: string; sku: string | null; stock_levels?: any[] }) => {
                        const stockRecord = item.stock_levels?.find((s: Record<string, unknown>) => s.store_id === currentStoreId) as { qty: number } | undefined
                        const maxQty = stockRecord?.qty || 0
                        return (
                          <li 
                            key={item.id}
                            className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                            onClick={() => handleAddItem(item)}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.sku || 'No SKU'}</p>
                            </div>
                            <div className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-1 rounded">
                              {maxQty} available
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {selectedItems.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Transfer Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedItems.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.sku}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="1"
                            max={item.maxQty}
                            value={item.qty}
                            onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                            className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-right"
                          />
                          <p className="text-xs text-gray-400 mt-1">Max: {item.maxQty}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-sm text-gray-500">No items selected for transfer.</p>
              </div>
            )}
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between mt-auto">
           <div className="text-sm text-gray-500">
             Transfers wait in <strong>Pending</strong> state until approved.
           </div>
           <div className="space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedItems.length === 0 || !toStoreId}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Transfer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

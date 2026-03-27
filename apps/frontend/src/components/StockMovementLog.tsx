import { useCallback, useEffect, useState } from 'react'
import { getStockMovements, type StockMovement } from '../services/stockAdjustments'

interface StockMovementLogProps {
  storeId?: string
  itemId?: string
  itemName?: string
  onClose: () => void
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  sale: { label: 'Sale', color: 'bg-blue-100 text-blue-700' },
  import: { label: 'Import', color: 'bg-purple-100 text-purple-700' },
  received: { label: 'Received', color: 'bg-green-100 text-green-700' },
  damaged: { label: 'Damaged', color: 'bg-red-100 text-red-700' },
  lost: { label: 'Lost / Theft', color: 'bg-red-100 text-red-700' },
  correction: { label: 'Correction', color: 'bg-amber-100 text-amber-700' },
  returned: { label: 'Return', color: 'bg-teal-100 text-teal-700' },
  transfer_in: { label: 'Transfer In', color: 'bg-green-100 text-green-700' },
  transfer_out: { label: 'Transfer Out', color: 'bg-orange-100 text-orange-700' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-700' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
}

const PAGE_SIZE = 25

export function StockMovementLog({ storeId, itemId, itemName, onClose }: StockMovementLogProps) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadMovements = useCallback(async (offset: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStockMovements({
        storeId,
        itemId,
        limit: PAGE_SIZE,
        offset,
      })
      setMovements(data)
      setHasMore(data.length >= PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock movements')
    } finally {
      setLoading(false)
    }
  }, [storeId, itemId])

  useEffect(() => {
    loadMovements(page * PAGE_SIZE)
  }, [page, loadMovements])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getReasonBadge = (reason: string) => {
    const info = REASON_LABELS[reason] ?? { label: reason, color: 'bg-gray-100 text-gray-700' }
    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${info.color}`}>
        {info.label}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Stock Movement History</h2>
            {itemName && (
              <p className="text-sm text-gray-500 mt-0.5">{itemName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="text-sm text-red-800">{error}</div>
            <button
              onClick={() => loadMovements(page * PAGE_SIZE)}
              className="mt-1 text-sm text-red-600 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                {!itemId && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading movements...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(m.created_at)}
                    </td>
                    {!itemId && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 font-medium">
                        {m.item_name}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {m.store_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                      <span className={m.delta > 0 ? 'text-green-600' : 'text-red-600'}>
                        {m.delta > 0 ? '+' : ''}{m.delta}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getReasonBadge(m.reason)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {m.notes || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {m.performer_name || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>
            Page {page + 1}{movements.length > 0 ? ` · Showing ${movements.length} records` : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0 || loading}
              className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
              className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

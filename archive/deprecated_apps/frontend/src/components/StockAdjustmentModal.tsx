import { useState } from 'react'
import { ADJUSTMENT_REASONS, type AdjustmentReason, adjustStock } from '../services/stockAdjustments'

interface StockAdjustmentModalProps {
  itemId: string
  itemName: string
  storeId: string
  storeCode: string
  currentQty: number
  onClose: () => void
  onSuccess: (newQty: number) => void
}

export function StockAdjustmentModal({
  itemId,
  itemName,
  storeId,
  storeCode,
  currentQty,
  onClose,
  onSuccess,
}: StockAdjustmentModalProps) {
  const [delta, setDelta] = useState<string>('')
  const [direction, setDirection] = useState<'add' | 'remove'>('add')
  const [reason, setReason] = useState<AdjustmentReason>('received')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedDelta = Math.abs(parseInt(delta, 10) || 0)
  const effectiveDelta = direction === 'add' ? parsedDelta : -parsedDelta
  const newQty = currentQty + effectiveDelta
  const isValid = parsedDelta > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    setError(null)

    try {
      const result = await adjustStock({
        store_id: storeId,
        item_id: itemId,
        delta: effectiveDelta,
        reason,
        notes: notes.trim() || undefined,
      })
      onSuccess(result.new_qty)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stock adjustment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Adjust Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <div className="text-sm text-gray-500">Item</div>
          <div className="text-sm font-semibold text-gray-800">{itemName}</div>
          <div className="mt-1 text-xs text-gray-500">
            Store: {storeCode} · Current stock: <span className={`font-semibold ${currentQty > 0 ? 'text-green-600' : 'text-red-600'}`}>{currentQty}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direction
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('add')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  direction === 'add'
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ➕ Add Stock
              </button>
              <button
                type="button"
                onClick={() => setDirection('remove')}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${
                  direction === 'remove'
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ➖ Remove Stock
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="adj-qty" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              id="adj-qty"
              type="number"
              min="1"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="Enter quantity..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="adj-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="adj-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="adj-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add any notes..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {isValid && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <span className="text-gray-600">After adjustment: </span>
              <span className={`font-semibold ${direction === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                {currentQty} {direction === 'add' ? '+' : '−'} {parsedDelta} = {newQty < 0 ? '0' : newQty}
              </span>
              {newQty < 0 && (
                <span className="ml-2 text-xs text-amber-600">(capped at 0)</span>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 ${
                direction === 'add'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Adjusting...' : `${direction === 'add' ? 'Add' : 'Remove'} ${parsedDelta || ''} units`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { getAlertThreshold, saveAlertThreshold } from '../services/analytics'

interface AlertThresholdModalProps {
  itemId: string
  itemName: string
  storeId: string
  storeCode: string
  onClose: () => void
  onSuccess: () => void
}

export function AlertThresholdModal({
  itemId,
  itemName,
  storeId,
  storeCode,
  onClose,
  onSuccess,
}: AlertThresholdModalProps) {
  const [minQty, setMinQty] = useState<string>('5')
  const [reorderQty, setReorderQty] = useState<string>('20')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await getAlertThreshold(storeId, itemId)
        if (mounted && data) {
          setMinQty(data.min_qty.toString())
          setReorderQty(data.reorder_qty.toString())
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load existing thresholds')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [storeId, itemId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const min = parseInt(minQty, 10) || 0
    const reorder = parseInt(reorderQty, 10) || 0

    try {
      if (reorder < min) {
        throw new Error('Reorder quantity must be greater than or equal to minimum quantity')
      }

      await saveAlertThreshold(storeId, itemId, min, reorder)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save thresholds')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-sm shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alert Config</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <div className="text-sm font-semibold text-gray-800">{itemName}</div>
          <div className="mt-1 text-xs text-gray-500">
            Store: {storeCode}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading Configuration...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="min-qty" className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold (Min Qty)
              </label>
              <input
                id="min-qty"
                type="number"
                min="0"
                value={minQty}
                onChange={(e) => setMinQty(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">Alert triggers when stock drops to or below this amount.</p>
            </div>

            <div>
              <label htmlFor="reorder-qty" className="block text-sm font-medium text-gray-700 mb-1">
                Target Reorder Quantity
              </label>
              <input
                id="reorder-qty"
                type="number"
                min="0"
                value={reorderQty}
                onChange={(e) => setReorderQty(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">How many units to suggest reordering.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

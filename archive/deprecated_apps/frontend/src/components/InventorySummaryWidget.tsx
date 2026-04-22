import { useQuery } from '@tanstack/react-query'
import { getInventorySummary } from '../services/analytics'

interface InventorySummaryWidgetProps {
  storeId: string
}

export function InventorySummaryWidget({ storeId }: InventorySummaryWidgetProps) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['inventory-summary', storeId],
    queryFn: () => getInventorySummary(storeId),
    refetchInterval: 5 * 60_000,
  })

  // Format currency
  const formatValue = (num: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0
    }).format(num)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventory Summary</h3>
        <p className="text-sm text-red-600">Failed to load inventory summary.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <span className="text-indigo-500 mr-2">📊</span>
        Inventory Summary
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Total SKUs */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total SKUs</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat('en-US').format(summary?.total_skus || 0)}
          </p>
        </div>

        {/* Out of Stock */}
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wider">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-700">
            {new Intl.NumberFormat('en-US').format(summary?.out_of_stock_count || 0)}
          </p>
        </div>

        {/* Total Value */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Est. Retail Value</p>
          <p className="mt-1 text-xl font-bold text-green-800">
            {formatValue(summary?.total_value || 0)}
          </p>
        </div>

        {/* Total Cost */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-wider">Est. Total Cost</p>
          <p className="mt-1 text-xl font-bold text-blue-800">
            {formatValue(summary?.total_cost || 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

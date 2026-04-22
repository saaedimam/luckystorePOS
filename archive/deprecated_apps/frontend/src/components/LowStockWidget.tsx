import { useQuery } from '@tanstack/react-query'
import { getLowStockItems } from '../services/analytics'
import { Link } from 'react-router-dom'

interface LowStockWidgetProps {
  storeId: string
}

export function LowStockWidget({ storeId }: LowStockWidgetProps) {
  const { data: items, isLoading, error } = useQuery({
    queryKey: ['low-stock', storeId],
    queryFn: () => getLowStockItems(storeId),
    refetchInterval: 5 * 60_000, // Refresh every 5 mins
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-100 rounded w-full"></div>
          <div className="h-4 bg-gray-100 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Low Stock Alerts</h3>
        <p className="text-sm text-red-600">Failed to load low stock data.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="text-amber-500 mr-2">⚠️</span> 
          Low Stock Alerts
        </h3>
        {items && items.length > 0 && (
          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {items.length} items
          </span>
        )}
      </div>

      <div className="flex-grow overflow-auto">
        {!items || items.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">All inventory levels are healthy.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((item) => {
              const deficit = item.min_qty - item.current_qty
              const statusClass = item.current_qty === 0 ? 'text-red-600 font-bold' : 'text-amber-600 font-semibold'
              
              return (
                <li key={item.item_id} className="py-3 flex justify-between items-center">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      SKU: {item.sku || 'N/A'} • Target: {item.reorder_qty}
                    </p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={`text-sm ${statusClass}`}>
                      {item.current_qty} / {item.min_qty}
                    </p>
                    {deficit > 0 && (
                      <p className="text-xs text-gray-400">
                        need {deficit}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link 
          to="/admin/items" 
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Manage Inventory &rarr;
        </Link>
      </div>
    </div>
  )
}

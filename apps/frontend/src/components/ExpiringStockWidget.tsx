import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getExpiringBatches } from '../services/batches'

interface ExpiringStockWidgetProps {
  storeId: string
}

export function ExpiringStockWidget({ storeId }: ExpiringStockWidgetProps) {
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['expiring-batches', storeId, 30],
    queryFn: () => getExpiringBatches(storeId, 30),
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  })

  const critical  = batches.filter(b => b.days_left <= 7)
  const warning   = batches.filter(b => b.days_left > 7 && b.days_left <= 14)
  const upcoming  = batches.filter(b => b.days_left > 14)

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Expiring Stock</h3>
        <p className="text-sm text-green-600 font-medium">✓ No items expiring within 30 days</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-base font-semibold text-gray-900">Expiring Stock <span className="text-sm font-normal text-gray-400">(next 30 days)</span></h3>
        <Link to="/admin/batches" className="text-xs text-indigo-600 hover:underline font-medium">View All</Link>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mb-4">
        {critical.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            🔴 {critical.length} critical (&lt;7d)
          </span>
        )}
        {warning.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
            🟡 {warning.length} warning (7–14d)
          </span>
        )}
        {upcoming.length > 0 && (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            🔵 {upcoming.length} upcoming (14–30d)
          </span>
        )}
      </div>

      {/* Top 5 items */}
      <ul className="divide-y divide-gray-100">
        {batches.slice(0, 5).map(b => (
          <li key={b.batch_id} className="py-2 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900 leading-tight">{b.item_name}</p>
              <p className="text-xs text-gray-400">{b.batch_number} · qty {b.qty}</p>
            </div>
            <div className="text-right ml-4">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                b.days_left <= 0 ? 'bg-red-200 text-red-900'
                  : b.days_left <= 7 ? 'bg-red-100 text-red-800'
                  : b.days_left <= 14 ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-50 text-blue-700'
              }`}>
                {b.days_left <= 0 ? 'EXPIRED' : `${b.days_left}d left`}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {batches.length > 5 && (
        <Link to="/admin/batches" className="block mt-3 text-xs text-center text-indigo-600 hover:underline">
          +{batches.length - 5} more expiring…
        </Link>
      )}
    </div>
  )
}

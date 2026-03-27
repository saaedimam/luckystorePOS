import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStore } from '../hooks/useStore'
import {
  getStockValuation,
  getTopSellingItems,
  getSlowMovingItems,
  getDailyMovementTrend,
} from '../services/reports'

const TABS = ['Valuation', 'Top Sellers', 'Slow Movers', 'Movement Trend'] as const
type Tab = (typeof TABS)[number]

const CURRENCY = (n: number) =>
  new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(n)

const DAY_OPTIONS = [7, 14, 30, 60, 90]

export function InventoryReports() {
  const { currentStore } = useStore()
  const [activeTab, setActiveTab] = useState<Tab>('Valuation')
  const [days, setDays] = useState(30)

  // ── Valuation ────────────────────────────────────────────────────────────
  const valuationQuery = useQuery({
    queryKey: ['reports', 'valuation', currentStore?.id],
    queryFn: () => getStockValuation(currentStore!.id, 200),
    enabled: !!currentStore && activeTab === 'Valuation',
  })

  // ── Top Sellers ──────────────────────────────────────────────────────────
  const topSellersQuery = useQuery({
    queryKey: ['reports', 'top-sellers', currentStore?.id, days],
    queryFn: () => getTopSellingItems(currentStore!.id, days, 20),
    enabled: !!currentStore && activeTab === 'Top Sellers',
  })

  // ── Slow Movers ──────────────────────────────────────────────────────────
  const slowMoversQuery = useQuery({
    queryKey: ['reports', 'slow-movers', currentStore?.id, days],
    queryFn: () => getSlowMovingItems(currentStore!.id, days, 50),
    enabled: !!currentStore && activeTab === 'Slow Movers',
  })

  // ── Movement Trend ────────────────────────────────────────────────────────
  const trendQuery = useQuery({
    queryKey: ['reports', 'trend', currentStore?.id, days],
    queryFn: () => getDailyMovementTrend(currentStore!.id, days),
    enabled: !!currentStore && activeTab === 'Movement Trend',
  })

  if (!currentStore) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 text-center text-gray-500">
        Please select a store to view inventory reports.
      </div>
    )
  }

  // --- Shared header -------------------------------------------------------
  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
        <p className="text-sm text-gray-500 mt-1">{currentStore.name}</p>
      </div>
      {activeTab !== 'Valuation' && (
        <div className="flex items-center gap-2">
          <label htmlFor="days-select" className="text-sm text-gray-600 font-medium whitespace-nowrap">Period:</label>
          <select
            id="days-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {DAY_OPTIONS.map(d => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )

  const tabBar = (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  )

  const loadingRow = (
    <tr>
      <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td>
    </tr>
  )

  const emptyRow = (msg: string) => (
    <tr>
      <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-sm">{msg}</td>
    </tr>
  )

  // ─── Tab: Stock Valuation ─────────────────────────────────────────────────
  const valuationTab = () => {
    const rows = valuationQuery.data || []
    const totalCost = rows.reduce((s, r) => s + r.total_cost, 0)
    const totalValue = rows.reduce((s, r) => s + r.total_value, 0)

    return (
      <>
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Total Items</p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{rows.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Retail Value</p>
            <p className="text-2xl font-bold text-green-800 mt-1">{CURRENCY(totalValue)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Cost Value</p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{CURRENCY(totalCost)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'SKU', 'Category', 'Qty', 'Unit Cost', 'Unit Price', 'Margin', 'Total Cost', 'Total Value'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {valuationQuery.isLoading ? loadingRow : rows.length === 0 ? emptyRow('No stock data for this store.') : rows.map(r => (
                <tr key={r.item_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.item_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.sku || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.category_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-900 font-mono">{r.qty_on_hand.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{CURRENCY(r.unit_cost)}</td>
                  <td className="px-4 py-3 text-gray-600">{CURRENCY(r.unit_price)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.margin_pct >= 20 ? 'text-green-600' : r.margin_pct >= 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.margin_pct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{CURRENCY(r.total_cost)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{CURRENCY(r.total_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  // ─── Tab: Top Sellers ────────────────────────────────────────────────────
  const topSellersTab = () => {
    const rows = topSellersQuery.data || []
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#', 'Item', 'SKU', 'Category', 'Qty Sold', 'Revenue', 'Profit'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {topSellersQuery.isLoading ? loadingRow : rows.length === 0 ? emptyRow(`No sales data found for the last ${days} days.`) : rows.map((r, i) => (
              <tr key={r.item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.item_name}</td>
                <td className="px-4 py-3 text-gray-500">{r.sku || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{r.category_name || '—'}</td>
                <td className="px-4 py-3 font-mono text-indigo-700 font-semibold">{r.total_qty.toLocaleString()}</td>
                <td className="px-4 py-3 text-green-700 font-medium">{CURRENCY(r.total_revenue)}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${r.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {CURRENCY(r.total_profit)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // ─── Tab: Slow Movers ────────────────────────────────────────────────────
  const slowMoversTab = () => {
    const rows = slowMoversQuery.data || []
    return (
      <>
        {rows.length > 0 && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            ⚠️ <strong>{rows.length}</strong> item{rows.length > 1 ? 's' : ''} had{' '}<strong>zero sales</strong> in the last {days} days but still hold stock.
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'SKU', 'Category', 'Qty on Hand', 'Stock Value', 'Last Sold'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {slowMoversQuery.isLoading ? loadingRow : rows.length === 0 ? emptyRow('No slow movers — all stocked items sold recently. ✅') : rows.map(r => (
                <tr key={r.item_id} className="hover:bg-amber-50">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.item_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.sku || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{r.category_name || '—'}</td>
                  <td className="px-4 py-3 font-mono text-amber-700 font-semibold">{r.qty_on_hand.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{CURRENCY(r.total_cost)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.last_sold_at ? new Date(r.last_sold_at).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  // ─── Tab: Movement Trend ─────────────────────────────────────────────────
  const movementTrendTab = () => {
    const rows = trendQuery.data || []
    if (trendQuery.isLoading) return <p className="text-center text-gray-400 py-10">Loading…</p>
    if (rows.length === 0) return <p className="text-center text-gray-400 py-10">No movement data for the selected period.</p>

    const maxVal = Math.max(...rows.map(r => Math.max(r.total_in, r.total_out)), 1)

    return (
      <div>
        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100 text-center">
            <p className="text-xs font-medium text-green-700 uppercase">Total Stock In</p>
            <p className="text-xl font-bold text-green-800 mt-1">{rows.reduce((s, r) => s + r.total_in, 0).toLocaleString()}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100 text-center">
            <p className="text-xs font-medium text-red-600 uppercase">Total Stock Out</p>
            <p className="text-xl font-bold text-red-700 mt-1">{rows.reduce((s, r) => s + r.total_out, 0).toLocaleString()}</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-center">
            <p className="text-xs font-medium text-indigo-600 uppercase">Net Delta</p>
            <p className="text-xl font-bold text-indigo-800 mt-1">{rows.reduce((s, r) => s + r.net_delta, 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <div className="flex items-end gap-1" style={{ minWidth: `${rows.length * 56}px`, height: '200px' }}>
            {rows.map(r => (
              <div key={r.trend_date} className="flex-1 flex flex-col items-center gap-1">
                {/* Bars */}
                <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '170px' }}>
                  <div
                    className="w-full bg-red-300 rounded-t-sm transition-all"
                    style={{ height: `${(r.total_out / maxVal) * 100}%` }}
                    title={`Out: ${r.total_out}`}
                  />
                  <div
                    className="w-full bg-green-400 rounded-t-sm transition-all"
                    style={{ height: `${(r.total_in / maxVal) * 100}%` }}
                    title={`In: ${r.total_in}`}
                  />
                </div>
                {/* Date label */}
                <span className="text-[10px] text-gray-400 whitespace-nowrap rotate-0">
                  {new Date(r.trend_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500 justify-center">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-400" /> Stock In</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-300" /> Stock Out</span>
          </div>
        </div>

        {/* Tabular data */}
        <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Date', 'Stock In', 'Stock Out', 'Net Delta'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map(r => (
                <tr key={r.trend_date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{new Date(r.trend_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-green-700 font-medium">+{r.total_in.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">-{r.total_out.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${r.net_delta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {r.net_delta >= 0 ? '+' : ''}{r.net_delta.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">
      {header}
      {tabBar}
      {activeTab === 'Valuation' && valuationTab()}
      {activeTab === 'Top Sellers' && topSellersTab()}
      {activeTab === 'Slow Movers' && slowMoversTab()}
      {activeTab === 'Movement Trend' && movementTrendTab()}
    </div>
  )
}

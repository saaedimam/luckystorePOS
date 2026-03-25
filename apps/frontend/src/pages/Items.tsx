import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BulkImport } from '../components/BulkImport'
import { CategoryManager } from '../components/CategoryManager'
import { ItemForm } from '../components/ItemForm'
import { StoreSelector } from '../components/StoreSelector'
import { useAuth } from '../hooks/useAuth'
import { useItemsMutations } from '../hooks/useItemsMutations'
import { inventoryQueryKeys, useCategoriesQuery, useItemsPageQuery } from '../hooks/useInventoryQueries'
import { useRealtimeStore } from '../hooks/useRealtimeStore'
import { useStore } from '../hooks/useStore'
import type { Item, ItemFormData } from '../services/items'
import { trackMetric } from '../services/metrics'
import { supabase } from '../services/supabase'

// Extend Item type to include stock_levels
interface ItemWithStock extends Item {
  stock_levels?: { qty: number; store_id: string }[]
}

interface ImportResult {
  import_run_id?: string | null
  rows_total?: number
  rows_valid?: number
  rows_processed?: number
  rows_succeeded?: number
  rows_failed?: number
  items_inserted?: number
  items_updated?: number
  inserted?: number
  updated?: number
  batches_created?: number
  stock_created?: number
  stock_updated?: number
  stock_movements?: number
  barcodes_generated?: number
  images_uploaded?: number
  parse_errors?: number
  row_errors?: number
  system_errors?: number
  next_row_index?: number
  processing_complete?: boolean
  can_resume?: boolean
  chunk_rows_processed?: number
  chunk_size?: number
  errors?: Array<{ row: number; code?: string; error: string }>
}

export function Items() {
  const { signOut } = useAuth()
  const { currentStore } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [clearingStock, setClearingStock] = useState(false)
  const [showOutOfStock, setShowOutOfStock] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(localStorage.getItem('items-page-size') || '200')
    if ([100, 150, 200, 300].includes(saved)) return saved
    return 200
  })
  const [pendingRealtimeRefresh, setPendingRealtimeRefresh] = useState(false)
  const queryClient = useQueryClient()
  const currentStoreId = currentStore?.id

  const itemsQuery = useItemsPageQuery({
    searchTerm,
    selectedCategory,
    activeFilter,
    currentStoreId,
    page,
    pageSize,
  })
  const categoriesQuery = useCategoriesQuery()

  const items = useMemo(
    () => ((itemsQuery.data?.items ?? []) as ItemWithStock[]),
    [itemsQuery.data]
  )
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data]
  )
  const totalItems = itemsQuery.data?.total ?? 0
  const loading = itemsQuery.isLoading
  const queryErrorMessage = itemsQuery.error instanceof Error ? itemsQuery.error.message : null
  const displayError = error ?? queryErrorMessage

  const {
    refreshItems,
    handleSave: runSave,
    handleDelete: runDelete,
    handleClearStoreStock: runClearStoreStock,
  } = useItemsMutations({
    setError,
    setSuccess,
    setShowForm,
    setEditingItem,
    setClearingStock,
  })

  // Realtime sync
  useRealtimeStore(currentStore?.id, () => {
    console.log('🔄 Realtime update received, scheduling inventory refresh...')
    setPendingRealtimeRefresh(true)
  })

  // Reset paging whenever filters/store scope changes
  useEffect(() => {
    if (page === 1) return
    const timer = window.setTimeout(() => setPage(1), 0)
    return () => window.clearTimeout(timer)
  }, [searchTerm, selectedCategory, activeFilter, currentStore?.id, page])

  useEffect(() => {
    if (page === 1) return
    const timer = window.setTimeout(() => setPage(1), 0)
    return () => window.clearTimeout(timer)
  }, [pageSize, page])

  useEffect(() => {
    localStorage.setItem('items-page-size', String(pageSize))
  }, [pageSize])

  // Realtime updates should refresh current page silently and in batches.
  useEffect(() => {
    if (!pendingRealtimeRefresh) return
    const timer = setTimeout(() => {
      setPendingRealtimeRefresh(false)
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.itemsRoot })
    }, 500)
    return () => clearTimeout(timer)
  }, [pendingRealtimeRefresh, queryClient])

  const handleSave = async (data: ItemFormData) => {
    await runSave(data, editingItem)
  }

  const handleDelete = async (id: string) => {
    await runDelete(id)
  }

  const handleBulkImport = async (file: File) => {
    const startedAt = performance.now()
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) {
      throw new Error('You are not logged in. Please log in again and retry import.')
    }

    const invokeChunk = async (accessToken: string, importRunId?: string): Promise<ImportResult> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('max_rows', '300')
      if (importRunId) {
        formData.append('import_run_id', importRunId)
      }
      const { data, error } = await supabase.functions.invoke('import-inventory', {
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (error) {
        let message = error.message || 'Import failed'
        const context = (error as { context?: unknown }).context
        const response = context instanceof Response ? context : undefined
        if (response && typeof response.text === 'function') {
          try {
            const raw = await response.text()
            if (raw) {
              try {
                const parsed = JSON.parse(raw)
                message =
                  parsed.error ||
                  parsed.message ||
                  parsed.msg ||
                  parsed.details ||
                  parsed.hint ||
                  message
              } catch {
                message = raw
              }
            }
            if (response.status) {
              message = `${message} (HTTP ${response.status})`
            }
          } catch {
            // keep original message
          }
        }

        throw new Error(message)
      }
      return data
    }

    let result: ImportResult | null = null
    let importRunId: string | undefined
    let attempts = 0
    const maxAttempts = 100

    const runWithToken = async (token: string) => {
      while (attempts < maxAttempts) {
        attempts += 1
        const chunkResult = await invokeChunk(token, importRunId)
        result = chunkResult
        importRunId = chunkResult.import_run_id ?? importRunId

        if (chunkResult.processing_complete || !chunkResult.can_resume) {
          break
        }
      }
    }

    try {
      await runWithToken(sessionData.session.access_token)
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : ''
      const shouldRetry =
        message.includes('invalid jwt') ||
        message.includes('jwt') ||
        message.includes('unauthorized') ||
        message.includes('token')

      if (!shouldRetry) throw err

      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError || !refreshed.session?.access_token) {
        throw new Error('Session expired or invalid JWT. Please log out and log in again, then retry import.')
      }

      await runWithToken(refreshed.session.access_token)
    }

    if (!result) {
      throw new Error('Import did not return a result')
    }
    const finalResult = result as ImportResult
    if (!finalResult.processing_complete && finalResult.can_resume) {
      throw new Error(
        `Import paused after ${attempts} chunks. Resume with run ${finalResult.import_run_id}.`
      )
    }
    trackMetric('items.import.duration', performance.now() - startedAt, {
      runId: finalResult.import_run_id ?? null,
      rowsTotal: finalResult.rows_total ?? 0,
      rowsSucceeded: finalResult.rows_succeeded ?? 0,
      rowsFailed: finalResult.rows_failed ?? 0,
      parseErrors: finalResult.parse_errors ?? 0,
      rowErrors: finalResult.row_errors ?? 0,
      systemErrors: finalResult.system_errors ?? 0,
      chunks: attempts,
    })

    console.log('Import result:', finalResult)

    // Return result for display in component
    return finalResult
  }

  const handleClearStoreStock = async () => {
    await runClearStoreStock(currentStore)
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  // Helper to get stock quantity
  const getStockQty = (item: ItemWithStock) => {
    if (!item.stock_levels || item.stock_levels.length === 0) return 0
    if (!currentStore) return item.stock_levels[0].qty

    const selectedStoreStock = item.stock_levels.find(
      (stockLevel) => stockLevel.store_id === currentStore.id
    )

    return selectedStoreStock?.qty ?? 0
  }

  const visibleItems = currentStore && !showOutOfStock
    ? items.filter((item) => getStockQty(item) > 0)
    : items

  const outOfStockCount = currentStore
    ? items.filter((item) => getStockQty(item) === 0).length
    : 0

  const emptyItemsMessage =
    currentStore && !showOutOfStock
      ? `No in-stock items match the current filters for ${currentStore.code}.`
      : 'No items found. Click "Add Item" to create your first item.'
  const hasActiveFilters =
    searchTerm.trim().length > 0 || selectedCategory !== '' || activeFilter !== undefined
  const selectedCategoryName = categories.find((cat) => cat.id === selectedCategory)?.name ?? null
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const pageEnd = Math.min(totalItems, page * pageSize)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard">
                <img src="/logo.png" alt="Lucky Store" className="h-10 w-auto" />
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-700">Items Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <StoreSelector />
              <Link
                to="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {displayError && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{displayError}</div>
              {error ? (
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Dismiss
                </button>
              ) : (
                <button
                  onClick={() => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.itemsRoot })}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-800">{success}</div>
              <button
                onClick={() => setSuccess(null)}
                className="mt-2 text-sm text-green-600 hover:text-green-800"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Items Management</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBulkImport(!showBulkImport)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {showBulkImport ? 'Hide' : 'Bulk Import'}
              </button>
              <button
                onClick={handleClearStoreStock}
                disabled={!currentStore || clearingStock}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                {clearingStock ? 'Clearing Stock...' : 'Clear Store Stock'}
              </button>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {showCategories ? 'Hide' : 'Manage Categories'}
              </button>
              {currentStore && outOfStockCount > 0 && (
                <button
                  onClick={() => setShowOutOfStock((v) => !v)}
                  className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                    showOutOfStock
                      ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {showOutOfStock
                    ? `Hide out-of-stock (${outOfStockCount})`
                    : `Show out-of-stock (${outOfStockCount})`}
                </button>
              )}
              <button
                onClick={() => {
                  setEditingItem(null)
                  setShowForm(true)
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Item
              </button>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Current store</div>
              <div className="text-sm font-semibold text-gray-800">
                {currentStore ? `${currentStore.code} - ${currentStore.name}` : 'All stores'}
              </div>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Items on this page</div>
              <div className="text-sm font-semibold text-gray-800">{visibleItems.length}</div>
            </div>
            <div className="rounded-lg bg-white border border-gray-200 p-3">
              <div className="text-xs text-gray-500">Out of stock</div>
              <div className="text-sm font-semibold text-gray-800">{outOfStockCount}</div>
            </div>
          </div>

          {showBulkImport && (
            <div className="mb-6">
              <BulkImport
                onImport={handleBulkImport}
                onSuccess={refreshItems}
                currentStoreCode={currentStore?.code ?? null}
              />
            </div>
          )}

          {showCategories && (
            <div className="mb-6">
              <CategoryManager
                categories={categories}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.categories })}
              />
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Filters</h2>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setActiveFilter(undefined)
                }}
                disabled={!hasActiveFilters}
                className="text-xs px-2.5 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Clear filters
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="items-search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  id="items-search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, barcode, or SKU..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="items-category-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="items-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="items-status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="items-status-filter"
                  value={activeFilter === undefined ? '' : activeFilter.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    setActiveFilter(value === '' ? undefined : value === 'true')
                  }}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {searchTerm.trim().length > 0 && (
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                    Search: {searchTerm}
                  </span>
                )}
                {selectedCategoryName && (
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                    Category: {selectedCategoryName}
                  </span>
                )}
                {activeFilter !== undefined && (
                  <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-1">
                    Status: {activeFilter ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading items...</div>
            ) : visibleItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-600 mb-3">{emptyItemsMessage}</div>
                <div className="flex items-center justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('')
                        setSelectedCategory('')
                        setActiveFilter(undefined)
                      }}
                      className="px-3 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Reset filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null)
                      setShowForm(true)
                    }}
                    className="px-3 py-1.5 rounded border border-transparent text-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Barcode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {currentStore ? `Stock (${currentStore.code})` : 'Stock'}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-12 w-12 object-cover rounded"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.sku || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.barcode || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getStockQty(item) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {getStockQty(item)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ৳{item.cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ৳{item.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {item.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingItem(item)
                              setShowForm(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-3">
              Showing {pageStart}-{pageEnd} of {totalItems} items ({pageSize}/page)
              <label className="flex items-center gap-2">
                <span>Per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <option value={100}>100</option>
                  <option value={150}>150</option>
                  <option value={200}>200</option>
                  <option value={300}>300</option>
                </select>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Item Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingItem ? 'Edit Item' : 'Add New Item'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingItem(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <ItemForm
                  item={editingItem || undefined}
                  categories={categories}
                  onSave={handleSave}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingItem(null)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

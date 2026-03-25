import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Receipt } from '../components/Receipt'
import { useAuth } from '../hooks/useAuth'
import { inventoryQueryKeys, useCategoriesQuery, usePosItemsQuery } from '../hooks/useInventoryQueries'
import { useRealtimeStore } from '../hooks/useRealtimeStore'
import { useStore } from '../hooks/useStore'
import { buildCheckoutOutcomeRoute, type CheckoutOutcome } from '../services/checkoutOutcome'
import { invokeEdgeFunction } from '../services/edgeFunctions'
import { addToQueue, processQueue } from '../services/offlineQueue'
import { savePendingCardCheckout } from '../services/checkoutSession'
import { supabase } from '../services/supabase'

interface Item {
  id: string
  barcode: string | null
  name: string
  price: number
  cost: number
  category_id: string | null
  image_url: string | null
  stock_levels?: { qty: number; store_id?: string }[]
}

function getItemStockQty(item: Pick<Item, 'stock_levels'>, storeId?: string) {
  if (!item.stock_levels || item.stock_levels.length === 0) return 0
  if (!storeId) return item.stock_levels[0].qty

  const selectedStoreStock = item.stock_levels.find(
    (stockLevel) => stockLevel.store_id === storeId
  )

  return selectedStoreStock?.qty ?? 0
}

interface Category {
  id: string
  name: string
}

interface BillItem {
  id: string
  barcode: string | null
  name: string
  price: number
  quantity: number
}

interface ReceiptLineItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface ReceiptData {
  receiptNumber: string
  date: Date
  items: ReceiptLineItem[]
  subtotal: number
  discount: number
  total: number
  cashPaid: number
  change: number
  isOffline: boolean
}

type PaymentMethod = 'cash' | 'card'

export function POS() {
  const { profile } = useAuth()
  const { currentStore } = useStore()
  const navigate = useNavigate()
  const currentStoreId = currentStore?.id
  const queryClient = useQueryClient()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [categoryItems, setCategoryItems] = useState<Item[]>([])
  const [bill, setBill] = useState<BillItem[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<Item[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [billDiscount, setBillDiscount] = useState(0)
  const [cashPayment, setCashPayment] = useState(0)

  // UI state
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [showOutOfStock, setShowOutOfStock] = useState(false)

  // Refs
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const cashPaymentRef = useRef<HTMLInputElement>(null)
  const itemsQuery = usePosItemsQuery(currentStoreId)
  const categoriesQuery = useCategoriesQuery()

  useEffect(() => {
    if (!itemsQuery.data) return
    const loadedItems = itemsQuery.data
    setItems(loadedItems)
    if (currentCategory) {
      const filtered = loadedItems.filter((i) => i.category_id === currentCategory)
      setCategoryItems(filtered)
    }
  }, [itemsQuery.data, currentStoreId, currentCategory])

  useEffect(() => {
    if (!categoriesQuery.data) return
    setCategories(categoriesQuery.data as Category[])
  }, [categoriesQuery.data])

  useEffect(() => {
    if (itemsQuery.error) {
      const message = itemsQuery.error instanceof Error ? itemsQuery.error.message : 'Failed to load items'
      setError(message)
    }
  }, [itemsQuery.error])

  // Focus and online/offline listeners
  useEffect(() => {
    // Auto-focus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }

    // Online/Offline listeners
    const handleOnline = () => {
      console.log('🌐 Back online! Processing queue...')
      processQueue().then(({ processed }) => {
        if (processed > 0) {
          alert(`Synced ${processed} offline sales!`)
          queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.posItemsRoot })
        }
      })
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [queryClient])

  // Realtime sync
  useRealtimeStore(currentStore?.id, () => {
    console.log('🔄 Realtime update received, refreshing POS items...')
    queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.posItemsRoot })
  })

  // Load items by category
  const loadCategoryItems = async (categoryId: string) => {
    try {
      // Filter from already loaded items (which have stock info)
      const filtered = items.filter(i => i.category_id === categoryId)
      setCategoryItems(filtered)
      setCurrentCategory(categoryId)
    } catch (err: unknown) {
      console.error('Error loading category items:', err)
    }
  }

  // Helper to get stock quantity
  const getStockQty = (item: Item) => {
    return getItemStockQty(item, currentStoreId)
  }

  const browsableItems = currentStoreId && !showOutOfStock
    ? items.filter((item) => getStockQty(item) > 0)
    : items

  const visibleCategories = categories.filter((category) =>
    browsableItems.some((item) => item.category_id === category.id)
  )

  const visibleCategoryItems = currentStoreId && !showOutOfStock
    ? categoryItems.filter((item) => getStockQty(item) > 0)
    : categoryItems

  const outOfStockInCategory = categoryItems.length - visibleCategoryItems.length

  // Handle barcode input
  const handleBarcodeSubmit = async (barcode: string) => {
    if (!barcode.trim()) return

    // Search in local items first (faster and has stock info)
    const item = items.find(i => i.barcode === barcode.trim())

    if (item) {
      addItemToBill(item)
    } else {
      // Fallback to server search if not found locally (e.g. inactive or pagination)
      try {
        const { data, error } = await supabase
          .from('items')
          .select(`
            *,
            stock_levels(qty, store_id)
          `)
          .eq('barcode', barcode.trim())
          .eq('active', true)
          .single()

        if (error) throw error

        if (data) {
          addItemToBill(data)
        } else {
          setError(`Item not found with barcode: ${barcode}`)
          setTimeout(() => setError(null), 3000)
        }
      } catch (err: unknown) {
        console.error('Error finding item:', err)
        setError('Item not found')
        setTimeout(() => setError(null), 3000)
      }
    }

    // Clear and refocus
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = ''
      barcodeInputRef.current.focus()
    }
  }

  // Handle name search with debounce
  const handleNameSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Search in local items first
    const localMatches = items
      .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10)

    setSearchSuggestions(localMatches)
    setShowSuggestions(localMatches.length > 0)
    setSelectedSuggestionIndex(-1)
  }

  // Debounce helper
  const debounce = <T extends unknown[]>(func: (...args: T) => void, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>
    return (...args: T) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  const debouncedSearch = useRef(debounce(handleNameSearch, 300)).current

  // Handle suggestion navigation
  const handleSuggestionKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev =>
        Math.min(prev + 1, searchSuggestions.length - 1)
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault()
      selectSuggestion(selectedSuggestionIndex)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  // Select suggestion
  const selectSuggestion = (index: number) => {
    const item = searchSuggestions[index]
    if (item) {
      addItemToBill(item)
      if (searchInputRef.current) {
        searchInputRef.current.value = ''
      }
      setShowSuggestions(false)
      setSearchSuggestions([])
      setSelectedSuggestionIndex(-1)
    }
  }

  // Add item to bill
  const addItemToBill = (item: Item) => {
    const stockQty = getStockQty(item)

    if (currentStore && stockQty <= 0) {
      setError(`${item.name} is out of stock in ${currentStore.code}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    const existingItem = bill.find((billItem) => billItem.id === item.id)
    if (currentStore && existingItem && existingItem.quantity >= stockQty) {
      setError(`Only ${stockQty} units of ${item.name} available in ${currentStore.code}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setBill(prevBill => {
      const existingIndex = prevBill.findIndex(b => b.id === item.id)
      if (existingIndex >= 0) {
        const newBill = [...prevBill]
        newBill[existingIndex].quantity += 1
        return newBill
      } else {
        return [...prevBill, {
          id: item.id,
          barcode: item.barcode,
          name: item.name,
          price: item.price,
          quantity: 1
        }]
      }
    })
  }

  // Update item quantity
  const updateQuantity = (index: number, newQuantity: number) => {
    const billItem = bill[index]
    const sourceItem = billItem ? items.find((item) => item.id === billItem.id) : undefined
    const maxQty = sourceItem ? getStockQty(sourceItem) : undefined

    if (currentStore && maxQty !== undefined && newQuantity > maxQty) {
      const storeCode = currentStore.code
      setError(`Only ${maxQty} units of ${billItem.name} available in ${storeCode}`)
      setTimeout(() => setError(null), 3000)
      newQuantity = maxQty
    }

    if (newQuantity <= 0) {
      removeItem(index)
    } else {
      setBill(prev => {
        const newBill = [...prev]
        newBill[index].quantity = newQuantity
        return newBill
      })
    }
  }

  // Update item price
  const updatePrice = (index: number, newPrice: number) => {
    setBill(prev => {
      const newBill = [...prev]
      newBill[index].price = newPrice
      return newBill
    })
  }

  // Remove item
  const removeItem = (index: number) => {
    setBill(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate totals
  const subtotal = bill.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = Math.max(subtotal - billDiscount, 0)
  const balance = cashPayment - total

  // Number pad input
  const handleNumPadInput = (value: string) => {
    const activeElement = document.activeElement as HTMLInputElement
    if (activeElement && activeElement.type === 'number') {
      if (value === '.') {
        if (!activeElement.value.includes('.')) {
          activeElement.value += value
        }
      } else {
        activeElement.value = activeElement.value === '0' ? value : activeElement.value + value
      }
      // Trigger change event
      activeElement.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  const handleNumPadBackspace = () => {
    const activeElement = document.activeElement as HTMLInputElement
    if (activeElement && activeElement.type === 'number') {
      activeElement.value = activeElement.value.slice(0, -1) || '0'
      activeElement.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  // Checkout
  const handleCheckout = async () => {
    if (bill.length === 0) {
      setError('Bill is empty!')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (paymentMethod === 'cash' && cashPayment < total) {
      setError('Cash payment is less than total amount!')
      setTimeout(() => setError(null), 3000)
      return
    }

    if (!currentStore) {
      setError('No store selected!')
      setTimeout(() => setError(null), 3000)
      return
    }

    setIsCheckingOut(true)
    setError(null)

    try {
      const saleItems = bill.map(item => ({
        item_id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
      }))

      const saleData = {
        store_id: currentStore.id,
        items: saleItems,
        discount: billDiscount,
        payment_method: paymentMethod,
        payment_meta: {
          cash_paid: cashPayment,
          change: balance
        }
      }

      let receiptNumber = 'OFFLINE-' + Date.now()
      let tranId: string | null = null

      if (paymentMethod === 'card') {
        if (!navigator.onLine) {
          navigate('/pos/checkout/error?error=' + encodeURIComponent('Card checkout requires an internet connection.'))
          return
        }

        const functionsBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

        savePendingCardCheckout({
          store_id: currentStore.id,
          items: saleItems,
          discount: billDiscount,
          subtotal,
          total,
          created_at: Date.now(),
        })

        const data = await invokeEdgeFunction<{ redirect_url?: string; tran_id?: string }>(
          'create-card-checkout',
          {
            store_id: currentStore.id,
            items: saleItems.map((saleItem) => ({
              item_id: saleItem.item_id,
              quantity: saleItem.quantity,
              price: saleItem.price,
            })),
            discount: billDiscount,
            total_amount: total,
            success_url: `${functionsBaseUrl}/payment-return-success`,
            fail_url: `${functionsBaseUrl}/payment-return-fail`,
            cancel_url: `${functionsBaseUrl}/payment-return-cancel`,
          },
          'Failed to initialize card checkout',
        )

        const redirectUrl = data?.redirect_url
        tranId = data?.tran_id ?? null

        if (!redirectUrl) {
          throw new Error('Payment gateway did not return a redirect URL')
        }

        window.location.assign(redirectUrl)
        return
      }

      if (navigator.onLine) {
        // Online: Call Edge Function
        const data = await invokeEdgeFunction<{ receipt_number: string; tran_id?: string }>(
          'create-sale',
          {
            ...saleData,
            items: saleData.items.map((saleItem) => ({
              item_id: saleItem.item_id,
              quantity: saleItem.quantity,
              price: saleItem.price,
            })),
          },
          'Failed to create sale',
        )
        receiptNumber = data.receipt_number
        tranId = data?.tran_id ?? null
        console.log('✅ Sale created online:', data)
      } else {
        // Offline: Save to Queue
        console.log('📴 Offline: Saving sale to queue')
        await addToQueue(saleData)
        // Show a different success message or toast?
        // For now, we treat it as success but with a special receipt number
      }

      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.posItemsRoot })
      const outcome: CheckoutOutcome = {
        status: 'success',
        receiptNumber,
        tranId,
      }
      navigate(buildCheckoutOutcomeRoute(outcome))
    } catch (err: unknown) {
      console.error('Checkout error:', err)
      const message = err instanceof Error ? err.message : 'Checkout failed'
      setError(message)
      const outcome: CheckoutOutcome = {
        status: 'error',
        error: message,
      }
      navigate(buildCheckoutOutcomeRoute(outcome))
    } finally {
      setIsCheckingOut(false)
    }
  }

  // Handle receipt close
  const handleReceiptClose = () => {
    setShowReceipt(false)
    setReceiptData(null)

    // Reset bill
    setBill([])
    setBillDiscount(0)
    setCashPayment(0)

    // Refocus barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <Receipt
          receiptNumber={receiptData.receiptNumber}
          date={receiptData.date}
          items={receiptData.items}
          subtotal={receiptData.subtotal}
          discount={receiptData.discount}
          total={receiptData.total}
          cashPaid={receiptData.cashPaid}
          change={receiptData.change}
          onClose={handleReceiptClose}
        />
      )}
      {/* Header */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Lucky Store" className="h-10 w-auto" />
              {currentStore && (
                <span className="ml-4 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium">
                  {currentStore.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {profile?.full_name || profile?.email}
              </span>
              <Link
                to="/dashboard"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-200px)]">

          {/* Column 1: Item Selection */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Item Selection</h3>
              {currentStoreId && (
                <button
                  onClick={() => setShowOutOfStock((v) => !v)}
                  className={`text-xs px-2 py-1 rounded border font-medium ${
                    showOutOfStock
                      ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {showOutOfStock ? 'In-stock only' : 'Show all'}
                </button>
              )}
            </div>

            {/* Barcode input */}
            <div className="mb-4">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan/Enter Barcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeSubmit(e.currentTarget.value)
                  }
                }}
              />
            </div>

            {/* Name search */}
            <div className="mb-4 relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onInput={(e) => debouncedSearch(e.currentTarget.value)}
                onKeyDown={handleSuggestionKeyDown}
              />

              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((item, index) => (
                    <div
                      key={item.id}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
      index === selectedSuggestionIndex ? 'bg-gray-100' : ''
    }`}
                      onClick={() => selectSuggestion(index)}
                    >
                      <div className="flex justify-between">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">Qty: {getStockQty(item)}</div>
                      </div>
                      <div className="text-xs text-gray-500">৳{item.price.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Back button (when viewing category items) */}
            {currentCategory && (
              <div className="mb-4 flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentCategory(null)
                    setCategoryItems([])
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  ← Back to Categories
                </button>
                {!showOutOfStock && outOfStockInCategory > 0 && (
                  <button
                    onClick={() => setShowOutOfStock(true)}
                    className="text-xs px-2 py-1 rounded border border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 whitespace-nowrap"
                  >
                    +{outOfStockInCategory} out of stock
                  </button>
                )}
              </div>
            )}

            {/* Categories/Items grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {!currentCategory ? (
                  // Show categories
                  visibleCategories.map((category) => (
                    <div
                      key={category.id}
                      onClick={() => loadCategoryItems(category.id)}
                      className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition text-center"
                    >
                      <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                    </div>
                  ))
                ) : (
                  // Show category items
                  visibleCategoryItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addItemToBill(item)}
                      className="bg-white border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-indigo-500 hover:shadow-md transition flex flex-col items-center"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded mb-2"
                        />
                      )}
                      <div className="text-sm font-medium text-gray-900 text-center mb-1">
                        {item.name}
                      </div>
                      <div className="flex justify-between w-full px-2">
                        <div className="text-sm font-semibold text-indigo-600">
                          ৳{item.price.toFixed(2)}
                        </div>
                        <div className={`text-xs font-medium ${getStockQty(item) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Qty: {getStockQty(item)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Bill */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill</h3>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Qty</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bill.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-2 py-8 text-center text-gray-500">
                        No items in bill
                      </td>
                    </tr>
                  ) : (
                    bill.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-2">{index + 1}</td>
                        <td className="px-2 py-2">{item.name}</td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => updatePrice(index, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            step="0.01"
                            aria-label={`Price for ${item.name}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            min="1"
                            aria-label={`Quantity for ${item.name}`}
                          />
                        </td>
                        <td className="px-2 py-2">৳{(item.price * item.quantity).toFixed(2)}</td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 3: Payment */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>

            {/* Payment summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700 block mb-2">Payment Method:</span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-1 rounded border text-sm font-medium ${
                      paymentMethod === 'cash'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`px-3 py-1 rounded border text-sm font-medium ${
                      paymentMethod === 'card'
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Card
                  </button>
                </div>
                {paymentMethod === 'card' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <a
                      href="https://www.sslcommerz.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="SSLCommerz"
                      className="inline-block"
                    >
                      <img
                        src="https://securepay.sslcommerz.com/public/image/SSLCommerz-Pay-With-logo-All-Size-04.png"
                        alt="SSLCommerz"
                        className="w-[300px] max-w-full h-auto"
                      />
                    </a>
                  </div>
                )}
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Subtotal:</span>
                <span className="text-sm font-semibold text-gray-900">৳{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Bill Discount:</span>
                <input
                  type="number"
                  value={billDiscount}
                  onChange={(e) => setBillDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  step="0.01"
                  aria-label="Bill discount"
                />
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-indigo-600">৳{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm text-gray-700">Cash Payment:</span>
                <input
                  ref={cashPaymentRef}
                  type="number"
                  value={cashPayment}
                  onChange={(e) => setCashPayment(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                  step="0.01"
                  aria-label="Cash payment"
                  disabled={paymentMethod !== 'cash'}
                />
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-700">Balance:</span>
                <span className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{balance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumPadInput(num)}
                  className="bg-white border-2 border-gray-300 rounded-lg py-3 text-lg font-semibold text-gray-900 hover:bg-gray-50 hover:border-indigo-500 transition"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleNumPadBackspace}
                className="bg-red-500 border-2 border-red-500 rounded-lg py-3 text-lg font-semibold text-white hover:bg-red-600 transition"
              >
                ⌫
              </button>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || bill.length === 0}
              className="w-full bg-green-500 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {isCheckingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

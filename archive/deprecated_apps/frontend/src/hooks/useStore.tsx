/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { getStores, getStore } from '../services/stores'
import type { Store } from '../services/stores'
import { trackMetric } from '../services/metrics'

const STORE_STORAGE_KEY = 'lucky-pos-selected-store-id'

type StoreContextType = {
  stores: Store[]
  currentStore: Store | null
  loading: boolean
  setCurrentStore: (store: Store | null) => void
  refreshStores: () => Promise<void>
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<Store[]>([])
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStores = async () => {
    const startedAt = performance.now()
    let loadedStoreCount = 0
    try {
      const data = await getStores()
      setStores(data)
      loadedStoreCount = data.length

      // Load saved store selection
      const savedStoreId = localStorage.getItem(STORE_STORAGE_KEY)
      if (savedStoreId) {
        try {
          const store = await getStore(savedStoreId)
          setCurrentStoreState(store)
        } catch {
          // Store might have been deleted, clear the saved ID
          localStorage.removeItem(STORE_STORAGE_KEY)
        }
      } else if (data.length > 0) {
        // Auto-select first store if none is selected
        setCurrentStoreState(data[0])
        localStorage.setItem(STORE_STORAGE_KEY, data[0].id)
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
      trackMetric('stores.load.error', performance.now() - startedAt)
    } finally {
      setLoading(false)
      trackMetric('stores.load.duration', performance.now() - startedAt, {
        storeCount: loadedStoreCount,
      })
    }
  }

  const setCurrentStore = (store: Store | null) => {
    const startedAt = performance.now()
    setCurrentStoreState(store)
    if (store) {
      localStorage.setItem(STORE_STORAGE_KEY, store.id)
    } else {
      localStorage.removeItem(STORE_STORAGE_KEY)
    }
    trackMetric('stores.switch.duration', performance.now() - startedAt, {
      storeId: store?.id ?? null,
      storeCode: store?.code ?? null,
    })
  }

  useEffect(() => {
    loadStores()
  }, [])

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        loading,
        setCurrentStore,
        refreshStores: loadStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}


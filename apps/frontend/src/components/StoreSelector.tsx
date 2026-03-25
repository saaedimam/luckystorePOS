import { useState } from 'react'
import { useStore } from '../hooks/useStore'

export function StoreSelector() {
  const { stores, currentStore, setCurrentStore, loading } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredStores = stores.filter((store) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true
    return (
      store.code.toLowerCase().includes(keyword) ||
      store.name.toLowerCase().includes(keyword) ||
      (store.address ?? '').toLowerCase().includes(keyword)
    )
  })

  if (loading) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2">
        Loading stores...
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="text-sm text-gray-500 px-3 py-2">
        No stores available
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className="text-gray-500">Store:</span>
        <span className="font-semibold">
          {currentStore ? `${currentStore.code} - ${currentStore.name}` : 'Select Store'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false)
              setSearch('')
            }}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="p-2 border-b border-gray-100">
              <label htmlFor="store-search" className="sr-only">
                Search store
              </label>
              <input
                id="store-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search store..."
                className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="py-1 max-h-64 overflow-y-auto">
              {filteredStores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setCurrentStore(store)
                    setIsOpen(false)
                    setSearch('')
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    currentStore?.id === store.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{store.code}</div>
                      <div className="text-xs text-gray-500">{store.name}</div>
                    </div>
                    {currentStore?.id === store.id && (
                      <svg
                        className="w-5 h-5 text-indigo-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
              {filteredStores.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">No matching stores</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}


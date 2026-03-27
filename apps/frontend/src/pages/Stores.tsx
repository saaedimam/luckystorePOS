import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../hooks/useStore'
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
} from '../services/stores'
import type { Store, StoreFormData } from '../services/stores'
import { StoreForm } from '../components/StoreForm'
import { StoreSelector } from '../components/StoreSelector'
import { StoreLocatorMap } from '../components/StoreLocatorMap'

export function Stores() {
  const { signOut } = useAuth()
  const { refreshStores } = useStore()
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStores = async () => {
    try {
      setLoading(true)
      const data = await getStores()
      setStores(data)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stores'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [])

  const handleSave = async (data: StoreFormData) => {
    if (editingStore) {
      await updateStore(editingStore.id, data)
    } else {
      await createStore(data)
    }
    setShowForm(false)
    setEditingStore(null)
    await loadStores()
    // Refresh store context so StoreSelector picks up changes
    await refreshStores()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this store? This action cannot be undone.')) return

    try {
      await deleteStore(id)
      await loadStores()
      // Refresh store context so StoreSelector picks up changes
      await refreshStores()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete store'
      setError(message)
    }
  }

  const handleLogout = async () => {
    await signOut()
    window.location.href = '/login'
  }

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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
              <span className="text-gray-700">Stores Management</span>
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
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Stores Management</h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMap((v) => !v)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {showMap ? '🗺 Hide Map' : '🗺 Show Map'}
              </button>
              <button
                onClick={() => {
                  setEditingStore(null)
                  setShowForm(true)
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add Store
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Stores
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, code, or address..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Stores Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading stores...</div>
            ) : filteredStores.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm
                  ? 'No stores found matching your search.'
                  : 'No stores found. Click "Add Store" to create your first store.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timezone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStores.map((store) => (
                      <tr key={store.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {store.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {store.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {store.address || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{store.timezone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(store.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setEditingStore(store)
                              setShowForm(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(store.id)}
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

          {/* Store Locator Map */}
          {showMap && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Store Locations Map</h2>
              <StoreLocatorMap stores={stores} />
            </div>
          )}

          {/* Store Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingStore ? 'Edit Store' : 'Add New Store'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingStore(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
                <StoreForm
                  store={editingStore || undefined}
                  onSave={handleSave}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingStore(null)
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


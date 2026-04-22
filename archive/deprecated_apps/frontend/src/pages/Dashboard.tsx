import { useAuth } from '../hooks/useAuth'
import { Link, useNavigate } from 'react-router-dom'
import { StoreSelector } from '../components/StoreSelector'
import { useStore } from '../hooks/useStore'
import { LowStockWidget } from '../components/LowStockWidget'
import { InventorySummaryWidget } from '../components/InventorySummaryWidget'
import { ExpiringStockWidget } from '../components/ExpiringStockWidget'

export function Dashboard() {
  const { profile, signOut } = useAuth()
  const { currentStore } = useStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Show all features when bypassing auth (for testing)
  const showAllFeatures = !profile

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Lucky Store" className="h-10 w-auto" />
              {showAllFeatures && (
                <span className="ml-3 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                  Auth Bypassed (Testing Mode)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <StoreSelector />
              <div className="text-sm text-gray-700">
                {profile?.full_name || profile?.email || 'Guest'} ({profile?.role || 'guest'})
              </div>
              {(profile?.role === 'admin' || showAllFeatures) && (
                <Link
                  to="/register"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Register User
                </Link>
              )}
              {profile && (
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Logout
                </button>
              )}
              {!profile && (
                <Link
                  to="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Lucky Store</h2>
            <p className="text-gray-600 mb-6">
              {profile ? (
                <>You are logged in as <strong>{profile.role}</strong></>
              ) : (
                <>You are viewing in <strong>testing mode</strong> (authentication bypassed)</>
              )}
            </p>

            {/* Inventory Analytics Widgets */}
            {currentStore && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <InventorySummaryWidget storeId={currentStore.id} />
                <LowStockWidget storeId={currentStore.id} />
                <ExpiringStockWidget storeId={currentStore.id} />
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4 px-1">Quick Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(profile?.role === 'admin' || showAllFeatures) && (
                <Link
                  to="/admin/items"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Items Management</h3>
                  <p className="text-sm text-gray-600 mt-2">Manage products and inventory</p>
                </Link>
              )}
              
              {(profile?.role === 'admin' || profile?.role === 'manager' || showAllFeatures) && (
                <Link
                  to="/admin/stores"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-gray-900">Stores Management</h3>
                  <p className="text-sm text-gray-600 mt-2">Manage store locations</p>
                </Link>
              )}

              <Link
                to="/admin/transfers"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-indigo-100"
              >
                <h3 className="text-lg font-semibold text-indigo-900">Stock Transfers</h3>
                <p className="text-sm text-gray-600 mt-2">Move inventory between stores safely</p>
              </Link>

              {(profile?.role === 'admin' || profile?.role === 'manager' || showAllFeatures) && (
                <Link
                  to="/admin/reports"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-emerald-100"
                >
                  <h3 className="text-lg font-semibold text-emerald-900">Inventory Reports</h3>
                  <p className="text-sm text-gray-600 mt-2">Valuation, top sellers, slow movers &amp; trends</p>
                </Link>
              )}

              {(profile?.role === 'admin' || profile?.role === 'manager' || showAllFeatures) && (
                <Link
                  to="/admin/suppliers"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-purple-100"
                >
                  <h3 className="text-lg font-semibold text-purple-900">Suppliers</h3>
                  <p className="text-sm text-gray-600 mt-2">Manage supplier contacts & details</p>
                </Link>
              )}

              {(profile?.role === 'admin' || profile?.role === 'manager' || showAllFeatures) && (
                <Link
                  to="/admin/purchase-orders"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-orange-100"
                >
                  <h3 className="text-lg font-semibold text-orange-900">Purchase Orders</h3>
                  <p className="text-sm text-gray-600 mt-2">Order and receive stock from suppliers</p>
                </Link>
              )}

              {(profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'stock' || showAllFeatures) && (
                <Link
                  to="/admin/batches"
                  className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition border border-teal-100"
                >
                  <h3 className="text-lg font-semibold text-teal-900">Batch & Expiry Tracking</h3>
                  <p className="text-sm text-gray-600 mt-2">Track lot numbers, expiry dates & recalls</p>
                </Link>
              )}

              <Link
                to="/pos"
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold text-gray-900">POS Terminal</h3>
                <p className="text-sm text-gray-600 mt-2">Point of Sale interface</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


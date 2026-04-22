import { Analytics } from '@vercel/analytics/react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { StoreProvider } from './hooks/useStore'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Items } from './pages/Items'
import { POS } from './pages/POS'
import { POSCheckoutStatus } from './pages/POSCheckoutStatus'
import { Stores } from './pages/Stores'
import { StockTransfers } from './pages/StockTransfers'
import { InventoryReports } from './pages/InventoryReports'
import { Suppliers } from './pages/Suppliers'
import { PurchaseOrders } from './pages/PurchaseOrders'
import { BatchTracking } from './pages/BatchTracking'
import { Unauthorized } from './pages/Unauthorized'
import { Home } from './pages/Home'
import { ReturnPolicy } from './pages/ReturnPolicy'
import { Shop } from './pages/Shop'
import { ProductPage } from './pages/ProductPage'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <Analytics />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/register"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Register />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/items"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Items />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Stores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transfers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'stock']}>
                  <StockTransfers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <InventoryReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/suppliers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/purchase-orders"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'stock']}>
                  <PurchaseOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/batches"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'stock']}>
                  <BatchTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <POS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos/checkout/success"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <POSCheckoutStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos/checkout/fail"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <POSCheckoutStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos/checkout/cancelled"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <POSCheckoutStatus />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos/checkout/error"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
                  <POSCheckoutStatus />
                </ProtectedRoute>
              }
            />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:productSlug" element={<ProductPage />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  )
}

export default App

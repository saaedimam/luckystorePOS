import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'cashier' | 'stock'
  allowedRoles?: ('admin' | 'manager' | 'cashier' | 'stock')[]
}

export function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // TEMPORARY: Allow unauthenticated access for testing
  // TODO: Remove this in production
  const BYPASS_AUTH = false

  if (BYPASS_AUTH) {
    // Skip all auth checks and just render the children
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">Loading...</div>
          <div className="text-sm text-gray-500">Checking authentication...</div>
        </div>
      </div>
    )
  }

  // If no user, redirect to login (but not if already on login page to avoid loop)
  if (!user) {
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />
    }
    return null
  }

  // If user exists but no profile, show a message instead of redirecting
  // (Profile might be missing but user is authenticated - this is a setup issue)
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Profile Not Found</h2>
          <p className="text-gray-700 mb-4">
            Your account is authenticated, but your user profile is missing from the database.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Please contact an administrator to create your user profile, or run the SQL script to create it manually.
          </p>
          <button
            onClick={() => {
              // Sign out and redirect to login
              window.location.href = '/login'
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Check role-based access
  if (requiredRole && profile.role !== requiredRole) {
    // Admin can access everything
    if (profile.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />
    }
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Admin can access everything
    if (profile.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />
    }
  }

  return <>{children}</>
}


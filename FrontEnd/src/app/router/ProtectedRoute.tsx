import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute() {
  const isAuthenticatedStore = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()

  const isAuthenticated = isAuthenticatedStore || (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubCurrentUser')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return !!(parsed && parsed.email)
        } catch {}
      }
    }
    return false
  })()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

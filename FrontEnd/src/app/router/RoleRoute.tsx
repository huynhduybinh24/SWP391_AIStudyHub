import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserRole } from '@/types/auth'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const userFromStore = useAuthStore((s) => s.user)

  const currentUser = userFromStore || (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiStudyHubCurrentUser')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed && parsed.role) {
            return {
              ...parsed,
              role: (parsed.role || 'user').toLowerCase() as UserRole,
            }
          }
        } catch {}
      }
    }
    return null
  })()

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.some((r) => r.toLowerCase() === currentUser.role.toLowerCase())) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

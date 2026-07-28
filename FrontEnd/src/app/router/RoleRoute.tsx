import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/Toast'
import type { UserRole } from '@/types/auth'
import { useEffect } from 'react'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const userFromStore = useAuthStore((s) => s.user)
  const toast = useToast()

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

  const userRole = currentUser?.role?.toLowerCase() || 'user'
  const isAllowed = allowedRoles.some((r) => r.toLowerCase() === userRole)

  useEffect(() => {
    if (currentUser && !isAllowed) {
      toast.error('Tài khoản không có quyền truy cập trang Quản trị Admin!')
    }
  }, [currentUser, isAllowed])

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

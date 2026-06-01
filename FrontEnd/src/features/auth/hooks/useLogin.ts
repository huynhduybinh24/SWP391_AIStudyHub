import { useMutation } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { LoginFormValues } from '@/features/auth/schemas/loginSchema'

export const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'

export function useLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (values: LoginFormValues) => authService.login(values),
    onSuccess: (data, variables) => {
      // Capture actual login credentials to match on the switcher
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
          let list = stored ? JSON.parse(stored) : []
          if (!Array.isArray(list)) list = []
          
          const index = list.findIndex((u: any) => u.email?.toLowerCase() === data.user.email?.toLowerCase())
          if (index !== -1) {
            list[index].password = variables.password
          } else {
            list.push({
              id: `u-${data.user.id}`,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role === 'admin' ? 'admin' : data.user.role === 'teacher' || data.user.role === 'instructor' ? 'instructor' : 'student',
              plan: (data.user.plan || 'free').toUpperCase() as 'FREE' | 'PRO',
              initials: data.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
              description: `Tài khoản đăng nhập hệ thống ngày ${new Date().toLocaleDateString('vi-VN')}`,
              remembered: false,
              password: variables.password
            })
          }
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
        } catch (e) {
          console.error('Failed to sync login password to account history:', e)
        }
      }

      setSession(data.user, data.tokens)
      // Priority: Admin -> sessionStorage → location.state.from → /dashboard
      const stored = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
      if (stored) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
      
      const from = data.user.role.toLowerCase() === 'admin'
        ? '/dashboard/admin'
        : (stored || (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard')
        
      navigate(from, { replace: true })
    },
  })
}

export function useSocialLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (provider: 'google' | 'facebook' | 'github') => authService.socialLogin(provider),
    onSuccess: (data) => {
      setSession(data.user, data.tokens)
      // Priority: Admin -> sessionStorage → location.state.from → /dashboard
      const stored = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
      if (stored) sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
      
      const from = data.user.role.toLowerCase() === 'admin'
        ? '/dashboard/admin'
        : (stored || (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard')
        
      navigate(from, { replace: true })
    },
  })
}

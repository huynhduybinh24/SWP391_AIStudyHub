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

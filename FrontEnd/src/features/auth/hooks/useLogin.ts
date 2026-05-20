import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { LoginFormValues } from '@/features/auth/schemas/loginSchema'

export function useLogin() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (values: LoginFormValues) => authService.login(values),
    onSuccess: (data) => {
      setSession(data.user, data.tokens)
      navigate('/dashboard', { replace: true })
    },
  })
}

export function useSocialLogin() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (provider: 'google' | 'facebook' | 'github') => authService.socialLogin(provider),
    onSuccess: (data) => {
      setSession(data.user, data.tokens)
      navigate('/dashboard', { replace: true })
    },
  })
}

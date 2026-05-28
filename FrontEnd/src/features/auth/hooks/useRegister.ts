import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { RegisterCredentials } from '@/types/auth'

export function useRegister() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (values: RegisterCredentials) => authService.register(values),
    onSuccess: (data) => {
      setSession(data.user, data.tokens)
      if (data.user.role?.toLowerCase() === 'teacher') {
        navigate('/dashboard/admin', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    },
  })
}

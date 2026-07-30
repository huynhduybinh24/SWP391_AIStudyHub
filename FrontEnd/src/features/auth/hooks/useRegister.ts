import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authService } from '@/features/auth/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { connectGoogleDrive } from '@/features/settings/services/googleDriveService'
import type { RegisterCredentials } from '@/types/auth'

export function useRegister() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: (values: RegisterCredentials) => authService.register(values),
    onSuccess: async (data) => {
      setSession(data.user, data.tokens)
      try {
        await connectGoogleDrive()
      } catch (err) {
        console.error('Auto connect Google Drive after registration failed:', err)
        navigate('/dashboard', { replace: true })
      }
    },
  })
}

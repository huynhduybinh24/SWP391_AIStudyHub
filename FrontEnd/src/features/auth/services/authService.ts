import { apiClient } from '@/lib/axios'
import type { LoginCredentials, LoginResponse, RegisterCredentials } from '@/types/auth'

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
    return data
  },

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', credentials)
    return data
  },

  async googleLogin(code: string, redirectUri: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/google', { code, redirectUri })
    return data
  },

  async socialLogin(provider: 'google' | 'facebook' | 'github'): Promise<LoginResponse> {
    // For social login, we can still use a mock template as third party providers are not set up in sandbox
    return {
      user: {
        id: `mock-${provider}-user`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `${provider}@example.com`,
        role: 'user',
        plan: 'free',
      },
      tokens: { accessToken: `mock-${provider}-token` },
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // no-op
    }
  },
}

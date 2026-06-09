import { apiClient } from '@/lib/axios'
import type { LoginCredentials, LoginResponse, RegisterCredentials } from '@/types/auth'

/** Backend response shape from POST /auth/login and /auth/register */
interface BackendAuthResponse {
  userId: number
  fullName: string
  email: string
  role: string
  plan?: string
  accountStatus: string
  message: string
  accessToken: string
  refreshToken?: string
}

/** Map backend flat response → frontend { user, tokens } shape */
function mapToLoginResponse(data: BackendAuthResponse): LoginResponse {
  const planRaw = (data.plan ?? 'free').toLowerCase()
  const plan = planRaw === 'institutional' || planRaw === 'enterprise' || planRaw === 'premium'
    ? 'institutional'
    : planRaw === 'pro' ? 'pro' : 'free'

  return {
    user: {
      id: String(data.userId),
      name: data.fullName,
      email: data.email,
      role: (data.role?.toLowerCase() ?? 'user') as LoginResponse['user']['role'],
      plan: plan as 'free' | 'pro' | 'institutional',
    },
    tokens: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    },
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/login', credentials)
    return mapToLoginResponse(data)
  },

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/register', credentials)
    return mapToLoginResponse(data)
  },

  async googleLogin(code: string, redirectUri: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/google', { code, redirectUri })
    return mapToLoginResponse(data)
  },

  async socialLogin(provider: 'google' | 'facebook' | 'github'): Promise<LoginResponse> {
    // Social login mock — third-party OAuth not configured in sandbox
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
      // no-op — backend logout is optional, client clears state regardless
    }
  },
}

import { apiClient } from '@/lib/axios'
import type { LoginCredentials, LoginResponse, RegisterCredentials, AuthUser, AuthTokens } from '@/types/auth'

/** Backend response shape from POST /auth/login and /auth/register */
interface BackendAuthResponse {
  user?: {
    id: string | number
    name?: string
    fullName?: string
    email: string
    role: string
    plan?: string
    avatarUrl?: string
    twoFactorEnabled?: boolean
  }
  tokens?: {
    accessToken: string
    refreshToken?: string
  }
  requires2fa?: boolean
  email?: string
  // Fallbacks for flat structure
  userId?: number
  fullName?: string
  role?: string
  plan?: string
  accessToken?: string
  refreshToken?: string
}

export interface LoginResult {
  requires2fa?: boolean
  email?: string
  user?: AuthUser
  tokens?: AuthTokens
}

/** Map backend response (nested or flat) → frontend { user, tokens } shape */
function mapToLoginResponse(data: BackendAuthResponse): LoginResponse {
  // If the backend returned a nested structure: { user, tokens }
  if (data && data.user && data.tokens) {
    const user = data.user
    const tokens = data.tokens
    const planRaw = (user.plan ?? 'free').toLowerCase()
    const plan = planRaw === 'institutional' || planRaw === 'enterprise' || planRaw === 'premium'
      ? 'institutional'
      : planRaw === 'pro' ? 'pro' : 'free'

    return {
      user: {
        id: String(user.id),
        name: user.name || user.fullName || '',
        email: user.email || '',
        role: (user.role?.toLowerCase() ?? 'student') as LoginResponse['user']['role'],
        plan: plan as 'free' | 'pro' | 'institutional',
        avatarUrl: user.avatarUrl || '/logo.png',
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    }
  }

  // Fallback to flat structure
  const planRaw = (data.plan ?? 'free').toLowerCase()
  const plan = planRaw === 'institutional' || planRaw === 'enterprise' || planRaw === 'premium'
    ? 'institutional'
    : planRaw === 'pro' ? 'pro' : 'free'

  return {
    user: {
      id: String(data.userId || ''),
      name: data.fullName || '',
      email: data.email || '',
      role: (data.role?.toLowerCase() ?? 'student') as LoginResponse['user']['role'],
      plan: plan as 'free' | 'pro' | 'institutional',
      avatarUrl: '/logo.png',
      twoFactorEnabled: false,
    },
    tokens: {
      accessToken: data.accessToken || '',
      refreshToken: data.refreshToken,
    },
  }
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/login', credentials)
    if (data.requires2fa) {
      return { requires2fa: true, email: data.email }
    }
    return mapToLoginResponse(data)
  },

  async verify2fa(email: string, code: string): Promise<LoginResponse> {
    const { data } = await apiClient.post<BackendAuthResponse>('/auth/login/verify-2fa', { email, code })
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
      // no-op — client clears state regardless
    }
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await apiClient.post<{ message?: string } | string>('/auth/forgot-password', { email })
    return typeof data === 'string' ? data : (data?.message || '')
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<string> {
    const { data } = await apiClient.post<{ message?: string } | string>('/auth/reset-password', { email, token, newPassword })
    return typeof data === 'string' ? data : (data?.message || '')
  },
}

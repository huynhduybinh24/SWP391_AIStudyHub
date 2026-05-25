import { apiClient } from '@/lib/axios'
import type { LoginCredentials, LoginResponse, RegisterCredentials } from '@/types/auth'

/** Replace with real API when backend is ready */
const MOCK_USERS: Record<string, LoginResponse> = {
  'alex@example.com': {
    user: {
      id: '1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'student',
      plan: 'free',
    },
    tokens: { accessToken: 'mock-student-token' },
  },
  'admin@example.com': {
    user: {
      id: '2',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      plan: 'pro',
    },
    tokens: { accessToken: 'mock-admin-token' },
  },
  'student@university.edu': {
    user: {
      id: '3',
      name: 'Test Student',
      email: 'student@university.edu',
      role: 'student',
      plan: 'free',
    },
    tokens: { accessToken: 'mock-test-token' },
  },
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
      return data
    } catch {
      const mock = MOCK_USERS[credentials.email.toLowerCase()]
      if (mock && credentials.password.length >= 6) {
        return mock
      }
      throw new Error('Invalid email or password')
    }
  },

  async register(credentials: RegisterCredentials): Promise<LoginResponse> {
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/register', credentials)
      return data
    } catch {
      // Mock successful registration
      return {
        user: {
          id: Math.random().toString(36).substr(2, 9),
          name: credentials.fullName,
          email: credentials.email,
          role: 'student',
          plan: 'free',
        },
        tokens: { accessToken: 'mock-registered-token' },
      }
    }
  },

  async socialLogin(provider: 'google' | 'facebook' | 'github'): Promise<LoginResponse> {
    // Mock successful social login
    return {
      user: {
        id: `mock-${provider}-user`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `${provider}@example.com`,
        role: 'student',
        plan: 'free',
      },
      tokens: { accessToken: `mock-${provider}-token` },
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      /* no-op for mock */
    }
  },
}

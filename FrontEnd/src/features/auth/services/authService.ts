import { apiClient } from '@/lib/axios'
import type { LoginCredentials, LoginResponse } from '@/types/auth'

/** Replace with real API when backend is ready */
const MOCK_USERS: Record<string, LoginResponse> = {
  'alex@example.com': {
    user: {
      id: '1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'student',
    },
    tokens: { accessToken: 'mock-student-token' },
  },
  'admin@example.com': {
    user: {
      id: '2',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
    tokens: { accessToken: 'mock-admin-token' },
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

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      /* no-op for mock */
    }
  },
}

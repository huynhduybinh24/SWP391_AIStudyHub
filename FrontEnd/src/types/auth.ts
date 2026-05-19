export type UserRole = 'student' | 'instructor' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
}

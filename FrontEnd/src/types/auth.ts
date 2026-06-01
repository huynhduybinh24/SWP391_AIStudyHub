export type UserRole = 'student' | 'instructor' | 'teacher' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
  plan: 'free' | 'pro' | 'institutional'
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

export interface RegisterCredentials {
  fullName: string
  email: string
  password: string
  role?: UserRole
}

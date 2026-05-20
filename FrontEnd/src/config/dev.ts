import type { AuthTokens, AuthUser } from '@/types/auth'

/** Tạm bỏ login — vào thẳng dashboard với user demo */
export const DEV_SKIP_AUTH = false

export const DEV_DEFAULT_USER: AuthUser = {
  id: '1',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'student',
}

export const DEV_DEFAULT_TOKENS: AuthTokens = {
  accessToken: 'dev-token',
}

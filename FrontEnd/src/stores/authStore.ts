import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEV_DEFAULT_TOKENS,
  DEV_DEFAULT_USER,
  DEV_SKIP_AUTH,
} from '@/config/dev'
import type { AuthTokens, AuthUser } from '@/types/auth'

interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  setSession: (user: AuthUser, tokens: AuthTokens) => void
  logout: () => void
}

const initialAuth = DEV_SKIP_AUTH
  ? {
      user: DEV_DEFAULT_USER,
      tokens: DEV_DEFAULT_TOKENS,
      isAuthenticated: true,
    }
  : {
      user: null,
      tokens: null,
      isAuthenticated: false,
    }

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialAuth,
      setSession: (user, tokens) =>
        set({ user, tokens, isAuthenticated: true }),
      logout: () => {
        if (DEV_SKIP_AUTH) {
          set({
            user: DEV_DEFAULT_USER,
            tokens: DEV_DEFAULT_TOKENS,
            isAuthenticated: true,
          })
          return
        }
        set({ user: null, tokens: null, isAuthenticated: false })
      },
    }),
    {
      name: 'ai-study-hub-auth-v2',
      merge: (persisted, current) => {
        if (!DEV_SKIP_AUTH) {
          return { ...current, ...(persisted as Partial<AuthState>) }
        }
        return {
          ...current,
          ...(persisted as Partial<AuthState>),
          user: DEV_DEFAULT_USER,
          tokens: DEV_DEFAULT_TOKENS,
          isAuthenticated: true,
        }
      },
    },
  ),
)

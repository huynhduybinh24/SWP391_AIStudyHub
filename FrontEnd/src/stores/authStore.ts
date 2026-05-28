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
      setSession: (user, tokens) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            plan: user.plan || 'free',
            avatar: user.avatarUrl || '/avatar.svg'
          }))
        }
        set({ user, tokens, isAuthenticated: true })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('aiStudyHubCurrentUser')
        }
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
        const persistedState = persisted as Partial<AuthState>
        
        // Restore mock user from localStorage if it exists to persist on reload
        const savedMockUserStr = typeof window !== 'undefined' ? localStorage.getItem('aiStudyHubCurrentUser') : null
        if (savedMockUserStr) {
          try {
            const savedUser = JSON.parse(savedMockUserStr)
            const userObj = {
              id: savedUser.id,
              name: savedUser.name,
              email: savedUser.email,
              role: savedUser.role,
              plan: savedUser.plan.toLowerCase() as 'free' | 'pro' | 'institutional',
              avatarUrl: savedUser.avatar || '/avatar.svg',
            }
            return {
              ...current,
              user: userObj,
              tokens: persistedState?.tokens || DEV_DEFAULT_TOKENS,
              isAuthenticated: true
            }
          } catch (e) {
            console.error('Error hydrating mock user:', e)
          }
        }

        // Prevent admin session from persisting across reloads (F5) (only if not mock user)
        if (persistedState?.user?.role?.toLowerCase() === 'admin') {
          return {
            ...current,
            user: null,
            tokens: null,
            isAuthenticated: false,
          }
        }

        if (!DEV_SKIP_AUTH) {
          return { ...current, ...persistedState }
        }
        return {
          ...current,
          ...persistedState,
          user: DEV_DEFAULT_USER,
          tokens: DEV_DEFAULT_TOKENS,
          isAuthenticated: true,
        }
      },
    },
  ),
)

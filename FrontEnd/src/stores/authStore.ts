import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEV_DEFAULT_TOKENS,
  DEV_DEFAULT_USER,
  DEV_SKIP_AUTH,
} from '@/config/dev'
import type { AuthTokens, AuthUser } from '@/types/auth'
import { logActivity, recordLogoutTime, cancelLogoutTime } from '@/services/activityLogService'

interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  setSession: (user: AuthUser, tokens: AuthTokens, isGoogle?: boolean) => void
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
      setSession: (user, tokens, isGoogle) => {
        if (typeof window !== 'undefined') {
          const normalizedPlan = (() => {
            const p = (user.plan || 'free').toLowerCase()
            if (p === 'enterprise' || p === 'premium' || p === 'institutional') return 'institutional'
            return p
          })()
          localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            plan: normalizedPlan,
            avatar: user.avatarUrl || '/logo.png'
          }))

          // Cancel any scheduled log deletion since the user logged back in
          cancelLogoutTime(user.email)

          // Log user login activity
          logActivity({
            eventKey: 'userLoggedIn',
            category: 'security',
            status: 'success',
            eventTextEn: 'User logged in',
            eventTextVi: 'Đăng nhập hệ thống',
            detailsTextEn: `User ${user.email} successfully logged in to the system.`,
            detailsTextVi: `Người dùng ${user.email} đã đăng nhập thành công vào hệ thống.`
          })

          // Automatically register this logged-in account in device login history
          try {
            const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
            let list = stored ? JSON.parse(stored) : []
            if (!Array.isArray(list)) list = []
            
            const existingIndex = list.findIndex((u: any) => u.email?.toLowerCase() === user.email?.toLowerCase())
            if (existingIndex !== -1) {
              list[existingIndex].tokens = tokens // Always update/persist the tokens
              if (isGoogle) {
                list[existingIndex].isGoogle = true
                list[existingIndex].remembered = true
              }
            } else {
              list.push({
                id: `u-${user.id}`,
                name: user.name,
                email: user.email,
                role: user.role === 'admin' ? 'admin' : 'user',
                plan: (user.plan || 'free').toUpperCase() as 'FREE' | 'PRO',
                initials: user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
                description: `Tài khoản đăng nhập hệ thống ngày ${new Date().toLocaleDateString('vi-VN')}`,
                remembered: isGoogle ? true : false,
                isGoogle: isGoogle || false,
                tokens: tokens // Save tokens here!
              })
            }
            localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
          } catch (e) {
            console.error('Failed to sync login session to logged-in accounts list:', e)
          }
        }
        const normalizedUser = {
          ...user,
          plan: (() => {
            const p = (user.plan || 'free').toLowerCase()
            if (p === 'enterprise' || p === 'premium' || p === 'institutional') return 'institutional'
            return p
          })() as 'free' | 'pro' | 'institutional'
        }
        set({ user: normalizedUser, tokens, isAuthenticated: true })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          // If the logged out user was an admin, clear the admin database states & history too!
          const activeUserStr = localStorage.getItem('aiStudyHubCurrentUser')
          if (activeUserStr) {
            try {
              const activeUser = JSON.parse(activeUserStr)

              // Record logout time for 1-hour deletion window
              recordLogoutTime(activeUser.email)

              // Log user logout activity
              logActivity({
                eventKey: 'userLoggedOut',
                category: 'security',
                status: 'success',
                eventTextEn: 'User logged out',
                eventTextVi: 'Đăng xuất hệ thống',
                detailsTextEn: `User ${activeUser.email} signed out of the system.`,
                detailsTextVi: `Người dùng ${activeUser.email} đã đăng xuất khỏi hệ thống.`
              })

              if (activeUser?.role?.toLowerCase() === 'admin') {
                localStorage.removeItem('mock_sent_emails')
                localStorage.removeItem('aiStudyHubSystemStatus') // Resets status
              }
            } catch (e) {
              console.error(e)
            }
          }
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

            // Check if this reload is triggered by a User Switch action
            const isSwitchingUser = typeof window !== 'undefined' && sessionStorage.getItem('aiStudyHubSwitchingUser') === 'true'
            
            // If it is admin, kick back to login on reload (F5) UNLESS it was just a user switch reload
            if (savedUser?.role?.toLowerCase() === 'admin') {
              if (isSwitchingUser) {
                // Clear the switch flag so subsequent manual reloads (F5) will trigger logout
                sessionStorage.removeItem('aiStudyHubSwitchingUser')
              } else {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('aiStudyHubCurrentUser')
                }
                return {
                  ...current,
                  user: null,
                  tokens: null,
                  isAuthenticated: false,
                }
              }
            }

            const userObj = {
              id: savedUser.id,
              name: savedUser.name,
              email: savedUser.email,
              role: savedUser.role,
              plan: (() => {
                const p = (savedUser.plan || 'free').toLowerCase()
                if (p === 'enterprise' || p === 'premium' || p === 'institutional') return 'institutional'
                return p
              })() as 'free' | 'pro' | 'institutional',
              avatarUrl: savedUser.avatar || '/logo.png',
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

        // Prevent admin session from persisting across reloads (F5) (fallback safeguard)
        const isSwitchingUser = typeof window !== 'undefined' && sessionStorage.getItem('aiStudyHubSwitchingUser') === 'true'
        if (persistedState?.user?.role?.toLowerCase() === 'admin' && !isSwitchingUser) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('aiStudyHubCurrentUser')
          }
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

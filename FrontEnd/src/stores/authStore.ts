import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEV_DEFAULT_TOKENS,
  DEV_DEFAULT_USER,
  DEV_SKIP_AUTH,
} from '@/config/dev'
import type { AuthTokens, AuthUser, UserRole } from '@/types/auth'
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
            role: (user.role || 'user').toLowerCase(),
            plan: normalizedPlan,
            avatar: user.avatarUrl || '/logo.png',
            university: user.university || 'FPT University',
            major: user.major || 'Software engineering',
            degree: user.degree || 'Bachelor',
            twoFactorEnabled: user.twoFactorEnabled
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
            const cleanEmail = (email?: string): string => {
              if (!email) return ''
              return email.trim().toLowerCase().replace(/[^\x20-\x7E]/g, '')
            }

            const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
            let list = stored ? JSON.parse(stored) : []
            if (!Array.isArray(list)) list = []
            
            const userEmailClean = cleanEmail(user.email)
            const existingIndex = list.findIndex((u: any) => cleanEmail(u.email) === userEmailClean)
            const planFormatted = (user.plan || 'free').toUpperCase()
            const nameFormatted = user.name
            const initialsFormatted = user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'
            const roleFormatted = user.role?.toLowerCase() === 'admin' ? 'admin' : 'user'

            if (existingIndex !== -1) {
              list[existingIndex] = {
                ...list[existingIndex],
                name: nameFormatted,
                email: userEmailClean, // Save cleaned email!
                role: roleFormatted,
                plan: planFormatted,
                initials: initialsFormatted,
                avatar: user.avatarUrl || list[existingIndex].avatar || '/logo.png',
                tokens: tokens,
                isGoogle: isGoogle || list[existingIndex].isGoogle || false,
                remembered: isGoogle ? true : list[existingIndex].remembered
              }
            } else {
              list.push({
                id: `u-${user.id}`,
                name: nameFormatted,
                email: userEmailClean, // Save cleaned email!
                role: roleFormatted,
                plan: planFormatted,
                initials: initialsFormatted,
                avatar: user.avatarUrl || '/logo.png',
                description: `Tài khoản đăng nhập hệ thống ngày ${new Date().toLocaleDateString('vi-VN')}`,
                remembered: isGoogle ? true : false,
                isGoogle: isGoogle || false,
                tokens: tokens
              })
            }
            localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
          } catch (e) {
            console.error('Failed to sync login session to logged-in accounts list:', e)
          }
        }
        const normalizedUser = {
          ...user,
          role: (user.role || 'user').toLowerCase() as UserRole,
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
        
        // Restore active user from localStorage if it exists to persist on reload
        const savedMockUserStr = typeof window !== 'undefined' ? localStorage.getItem('aiStudyHubCurrentUser') : null
        if (savedMockUserStr) {
          try {
            const savedUser = JSON.parse(savedMockUserStr)
            if (savedUser && savedUser.email) {
              const userObj = {
                id: String(savedUser.id || '1'),
                name: savedUser.name || 'LumiEdu User',
                email: savedUser.email,
                role: (savedUser.role || 'user').toLowerCase() as UserRole,
                plan: (() => {
                  const p = (savedUser.plan || 'free').toLowerCase()
                  if (p === 'enterprise' || p === 'premium' || p === 'institutional') return 'institutional'
                  return p
                })() as 'free' | 'pro' | 'institutional',
                avatarUrl: savedUser.avatar || '/logo.png',
                university: savedUser.university || 'FPT University',
                major: savedUser.major || 'Software engineering',
                degree: savedUser.degree || 'Bachelor'
              }

              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('aiStudyHubSwitchingUser')
              }

              return {
                ...current,
                user: userObj,
                tokens: persistedState?.tokens || DEV_DEFAULT_TOKENS,
                isAuthenticated: true
              }
            }
          } catch (e) {
            console.error('Error hydrating mock user:', e)
          }
        }

        if (persistedState && persistedState.user && persistedState.isAuthenticated) {
          return {
            ...current,
            ...persistedState
          }
        }

        if (!DEV_SKIP_AUTH) {
          return {
            ...current,
            user: null,
            tokens: null,
            isAuthenticated: false
          }
        }

        return {
          ...current,
          user: DEV_DEFAULT_USER,
          tokens: DEV_DEFAULT_TOKENS,
          isAuthenticated: true,
        }
      },
    },
  ),
)

if (typeof window !== 'undefined') {
  const cleanEmail = (email?: string): string => {
    if (!email) return ''
    return email.trim().toLowerCase().replace(/[^\x20-\x7E]/g, '')
  }

  useAuthStore.subscribe((state) => {
    if (state.user) {
      try {
        const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
        if (stored) {
          const list = JSON.parse(stored)
          if (Array.isArray(list)) {
            const userEmailClean = cleanEmail(state.user?.email)
            const existingIndex = list.findIndex((u: any) => cleanEmail(u.email) === userEmailClean)
            if (existingIndex !== -1) {
              const currentItem = list[existingIndex]
              const newPlan = (state.user.plan || 'free').toUpperCase()
              const newRole = state.user.role?.toLowerCase() === 'admin' ? 'admin' : 'user'
              const newName = state.user.name
              const newAvatar = state.user.avatarUrl || '/logo.png'
              const newInitials = state.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US'

              if (
                currentItem.plan !== newPlan ||
                currentItem.role !== newRole ||
                currentItem.name !== newName ||
                currentItem.avatar !== newAvatar ||
                cleanEmail(currentItem.email) !== userEmailClean
              ) {
                list[existingIndex] = {
                  ...currentItem,
                  email: userEmailClean,
                  name: newName,
                  role: newRole,
                  plan: newPlan,
                  avatar: newAvatar,
                  initials: newInitials
                }
                localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
                window.dispatchEvent(new Event('aiStudyHubLoggedInAccountsUpdated'))
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed to sync state.user to logged-in accounts:', e)
      }
    }
  })
}

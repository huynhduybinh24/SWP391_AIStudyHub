import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProfileStore } from '@/features/profile/stores/profileStore'

export type ThemePreference = 'light' | 'dark' | 'system'

export interface AccountSettings {
  email: string
  name: string
  language: string
  timezone: string
}

export interface SecuritySettings {
  isTwoFactorEnabled: boolean
  lastPasswordChanged: string
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
}

interface SettingsState {
  account: AccountSettings
  security: SecuritySettings
  notifications: NotificationSettings
  theme: ThemePreference
  updateAccount: (data: Partial<AccountSettings>) => void
  toggleTwoFactor: () => void
  updateNotifications: (data: Partial<NotificationSettings>) => void
  setTheme: (theme: ThemePreference) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      account: {
        email: 'student@university.edu',
        name: 'Alex Morgan',
        language: 'English (US)',
        timezone: 'Pacific Time (PT)',
      },
      security: {
        isTwoFactorEnabled: false,
        lastPasswordChanged: '3 months ago',
      },
      notifications: {
        emailNotifications: typeof window !== 'undefined' && localStorage.getItem('ai-study-hub-email-notifications') !== 'false',
        pushNotifications: typeof window !== 'undefined' && localStorage.getItem('ai-study-hub-push-notifications') === 'true',
      },
      theme: (typeof window !== 'undefined' && localStorage.getItem('ai-study-hub-theme') as ThemePreference) || 'light',
      updateAccount: (data) => {
        set((state) => ({
          account: { ...state.account, ...data },
        }))
        // Sync display name with profileStore
        if (data.name) {
          useProfileStore.getState().updateProfile({ name: data.name })
        }
      },
      toggleTwoFactor: () =>
        set((state) => ({
          security: {
            ...state.security,
            isTwoFactorEnabled: !state.security.isTwoFactorEnabled,
          },
        })),
      updateNotifications: (data) => {
        set((state) => {
          const nextNotifications = { ...state.notifications, ...data }
          if (typeof window !== 'undefined') {
            if (data.emailNotifications !== undefined) {
              localStorage.setItem('ai-study-hub-email-notifications', String(data.emailNotifications))
            }
            if (data.pushNotifications !== undefined) {
              localStorage.setItem('ai-study-hub-push-notifications', String(data.pushNotifications))
            }
          }
          return { notifications: nextNotifications }
        })
      },
      setTheme: (newTheme) => {
        set({ theme: newTheme })
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai-study-hub-theme', newTheme)
        }

        const applyTheme = (isDark: boolean) => {
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }

        if (newTheme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          applyTheme(prefersDark)
        } else {
          applyTheme(newTheme === 'dark')
        }
      },
    }),
    {
      name: 'study-hub-settings-store',
    }
  )
)
export default useSettingsStore

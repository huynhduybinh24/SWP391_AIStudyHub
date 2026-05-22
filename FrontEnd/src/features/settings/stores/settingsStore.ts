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
        language: 'en-US',
        timezone: 'America/Los_Angeles',
      },
      security: {
        isTwoFactorEnabled: false,
        lastPasswordChanged: '3 months ago',
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
      },
      theme: 'light',
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
      updateNotifications: (data) =>
        set((state) => ({
          notifications: { ...state.notifications, ...data },
        })),
      setTheme: (newTheme) => {
        set({ theme: newTheme })
        localStorage.setItem('theme', newTheme)

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

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { settingsService } from '../services/settingsService'
import { getCurrentUser } from '@/features/notifications/services/userNotificationService'

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
  loadUserSettings: (email: string) => void
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
        language: 'en',
        timezone: 'Pacific Time (PT)',
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
      loadUserSettings: (email) => {
        const settings = settingsService.getSettings(email)
        set({
          account: settings.account,
          security: settings.security,
          notifications: settings.notifications,
          theme: settings.theme,
        })
      },
      updateAccount: (data) => {
        set((state) => {
          const nextAccount = { ...state.account, ...data }
          settingsService.updateSettings(state.account.email, { account: nextAccount })
          if (data.name) {
            useProfileStore.getState().updateProfile({ name: data.name })
          }
          return { account: nextAccount }
        })
      },
      toggleTwoFactor: () => {
        set((state) => {
          const nextSecurity = {
            ...state.security,
            isTwoFactorEnabled: !state.security.isTwoFactorEnabled,
          }
          settingsService.updateSettings(state.account.email, { security: nextSecurity })
          return { security: nextSecurity }
        })
      },
      updateNotifications: (data) => {
        set((state) => {
          const nextNotifications = { ...state.notifications, ...data }
          settingsService.updateSettings(state.account.email, { notifications: nextNotifications })
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
        set((state) => {
          settingsService.updateSettings(state.account.email, { theme: newTheme })
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
          return { theme: newTheme }
        })
      },
    }),
    {
      name: 'study-hub-settings-store',
    }
  )
)

if (typeof window !== 'undefined') {
  window.addEventListener('aiStudyHubUserChanged', () => {
    try {
      const email = getCurrentUser().email;
      useSettingsStore.getState().loadUserSettings(email);
    } catch (e) {
      console.error('Failed to load user settings on user changed event', e);
    }
  });
  
  setTimeout(() => {
    try {
      const email = getCurrentUser().email;
      useSettingsStore.getState().loadUserSettings(email);
    } catch (e) {}
  }, 100);
}

export default useSettingsStore

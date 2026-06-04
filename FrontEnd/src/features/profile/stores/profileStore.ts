import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/axios'

export interface ProfileData {
  name: string
  university: string
  major: string
  degree: string
  avatarUrl: string
}

export interface LinkedAccount {
  id: string
  name: string
  connected: boolean
  email?: string
}

export interface ProfileStatistics {
  studyPlans: number
  aiSummaries: number
  studyHours: number
  assignments: number
}

interface ProfileState {
  profile: ProfileData
  linkedAccounts: LinkedAccount[]
  statistics: ProfileStatistics
  updateProfile: (data: Partial<ProfileData>) => Promise<void>
  toggleAccountConnection: (id: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: {
        name: 'Alex Rivera',
        university: 'FPT University',
        major: 'Software engineering',
        degree: 'Bachelor',
        avatarUrl: '/avatar.svg',
      },
      linkedAccounts: [
        { id: 'google', name: 'Google', connected: true, email: 'alex.rivera@gmail.com' },
        { id: 'microsoft', name: 'Microsoft', connected: true, email: 'alex.rivera@outlook.com' },
      ],
      statistics: {
        studyPlans: 12,
        aiSummaries: 86,
        studyHours: 42,
        assignments: 8,
      },
      updateProfile: async (data) => {
        const authUser = useAuthStore.getState().user
        if (authUser && authUser.id) {
          try {
            await apiClient.put(`/api/users/${authUser.id}/profile`, {
              fullName: data.name ?? authUser.name,
              avatarUrl: data.avatarUrl ?? authUser.avatarUrl,
            })
          } catch (error) {
            console.error('Failed to update profile on backend database:', error)
            throw error
          }
        }

        set((state) => {
          const updatedProfile = { ...state.profile, ...data }
          
          // Sync with authStore if there is an active user
          if (authUser) {
            useAuthStore.setState({
              user: {
                ...authUser,
                name: updatedProfile.name,
                avatarUrl: updatedProfile.avatarUrl,
              }
            })

            // Also update the local storage copy of currentUser
            localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify({
              id: authUser.id,
              name: updatedProfile.name,
              email: authUser.email,
              role: authUser.role,
              plan: authUser.plan || 'free',
              avatar: updatedProfile.avatarUrl || '/avatar.svg'
            }))
          }
          
          return { profile: updatedProfile }
        })
      },
      toggleAccountConnection: (id) =>
        set((state) => ({
          linkedAccounts: state.linkedAccounts.map((acc) =>
            acc.id === id ? { ...acc, connected: !acc.connected } : acc
          ),
        })),
    }),
    {
      name: 'study-hub-profile-store',
    }
  )
)

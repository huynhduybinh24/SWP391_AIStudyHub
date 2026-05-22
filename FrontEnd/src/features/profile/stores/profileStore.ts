import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/stores/authStore'

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
  updateProfile: (data: Partial<ProfileData>) => void
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
      updateProfile: (data) => {
        set((state) => {
          const updatedProfile = { ...state.profile, ...data }
          
          // Sync with authStore if there is an active user
          const authUser = useAuthStore.getState().user
          if (authUser) {
            useAuthStore.setState({
              user: {
                ...authUser,
                name: updatedProfile.name,
                avatarUrl: updatedProfile.avatarUrl,
              }
            })
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

import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  userMenuOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleUserMenu: () => void
  setUserMenuOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  userMenuOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleUserMenu: () => set((s) => ({ userMenuOpen: !s.userMenuOpen })),
  setUserMenuOpen: (userMenuOpen) => set({ userMenuOpen }),
}))

import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  userMenuOpen: boolean
  isChatPopupOpen: boolean
  initialChatMessage: string
  setSidebarOpen: (open: boolean) => void
  toggleUserMenu: () => void
  setUserMenuOpen: (open: boolean) => void
  setChatPopupOpen: (open: boolean) => void
  setInitialChatMessage: (message: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  userMenuOpen: false,
  isChatPopupOpen: false,
  initialChatMessage: '',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleUserMenu: () => set((s) => ({ userMenuOpen: !s.userMenuOpen })),
  setUserMenuOpen: (userMenuOpen) => set({ userMenuOpen }),
  setChatPopupOpen: (isChatPopupOpen) => set({ isChatPopupOpen }),
  setInitialChatMessage: (initialChatMessage) => set({ initialChatMessage }),
}))

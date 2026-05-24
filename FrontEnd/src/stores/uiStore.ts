import { create } from 'zustand'

interface UiState {
  sidebarOpen: boolean
  userMenuOpen: boolean
  isChatPopupOpen: boolean
  initialChatMessage: string
  isSidebarCollapsed: boolean
  setSidebarOpen: (open: boolean) => void
  toggleUserMenu: () => void
  setUserMenuOpen: (open: boolean) => void
  setChatPopupOpen: (open: boolean) => void
  setInitialChatMessage: (message: string) => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  userMenuOpen: false,
  isChatPopupOpen: false,
  initialChatMessage: '',
  isSidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebar-collapsed') === 'true' : false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleUserMenu: () => set((s) => ({ userMenuOpen: !s.userMenuOpen })),
  setUserMenuOpen: (userMenuOpen) => set({ userMenuOpen }),
  setChatPopupOpen: (isChatPopupOpen) => set({ isChatPopupOpen }),
  setInitialChatMessage: (initialChatMessage) => set({ initialChatMessage }),
  setSidebarCollapsed: (isSidebarCollapsed) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', isSidebarCollapsed ? 'true' : 'false')
    }
    set({ isSidebarCollapsed })
  },
}))

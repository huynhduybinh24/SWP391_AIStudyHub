import { create } from 'zustand'

export type WorkspaceTab = 'chat' | 'summary' | 'flashcards' | 'quiz' | 'faq'
export type DocumentSourceFilter = 'ALL' | 'MY_DOCS' | 'WORKSPACE'

interface AiWorkspaceState {
  selectedDocumentIds: number[]
  activeTab: WorkspaceTab
  activeSessionId: number | null
  language: string
  searchQuery: string
  selectedSubjectFilter: string
  sourceFilter: DocumentSourceFilter
  isSidebarOpen: boolean
  
  // Actions
  setSelectedDocumentIds: (ids: number[]) => void
  toggleDocumentId: (id: number) => void
  selectAllDocuments: (ids: number[]) => void
  clearSelectedDocuments: () => void
  setActiveTab: (tab: WorkspaceTab) => void
  setActiveSessionId: (id: number | null) => void
  setLanguage: (lang: string) => void
  setSearchQuery: (query: string) => void
  setSelectedSubjectFilter: (subject: string) => void
  setSourceFilter: (filter: DocumentSourceFilter) => void
  setIsSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
}

const normalizeDocIds = (ids: number[]): number[] => {
  return Array.from(new Set(ids.map(Number))).sort((a, b) => a - b)
}

export const useAiWorkspaceStore = create<AiWorkspaceState>((set) => ({
  selectedDocumentIds: [],
  activeTab: 'chat',
  activeSessionId: null,
  language: 'vi',
  searchQuery: '',
  selectedSubjectFilter: 'ALL',
  sourceFilter: 'ALL',
  isSidebarOpen: true,

  setSelectedDocumentIds: (ids) => set({ selectedDocumentIds: ids.length > 0 ? [normalizeDocIds(ids)[0]] : [] }),
  toggleDocumentId: (id) =>
    set((state) => {
      const targetId = Number(id)
      const isAlreadySelected = state.selectedDocumentIds.length === 1 && state.selectedDocumentIds[0] === targetId
      return { selectedDocumentIds: isAlreadySelected ? [] : [targetId] }
    }),
  selectAllDocuments: (ids) => set({ selectedDocumentIds: ids.length > 0 ? [normalizeDocIds(ids)[0]] : [] }),
  clearSelectedDocuments: () => set({ selectedDocumentIds: [] }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),
  setLanguage: (language) => set({ language }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedSubjectFilter: (selectedSubjectFilter) => set({ selectedSubjectFilter }),
  setSourceFilter: (sourceFilter) => set({ sourceFilter }),
  setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

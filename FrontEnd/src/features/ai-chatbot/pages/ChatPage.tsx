import { useState, useEffect } from 'react'
import {
  MessageSquare, FileText, Layers, HelpCircle, BookOpen,
  Sparkles, Plus, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useAiWorkspaceStore, WorkspaceTab } from '@/stores/aiWorkspaceStore'
import { useUserDocuments, useUserChatSessions } from '@/hooks/useAiStudioQueries'
import { useQueryClient } from '@tanstack/react-query'
import { aiService } from '@/services/aiService'
import { useToast } from '@/components/ui/Toast'
import { DocumentSelectionSidebar } from '../components/DocumentSelectionSidebar'
import { TabChatbot } from '../components/tabs/TabChatbot'
import { TabSummary } from '../components/tabs/TabSummary'
import { TabFlashcards } from '../components/tabs/TabFlashcards'
import { TabQuiz } from '../components/tabs/TabQuiz'
import { TabFaq } from '../components/tabs/TabFaq'
import { ConfirmModal } from '@/features/shared-files/components/ConfirmModal'
import { cn } from '@/lib/utils'

export function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-1.5 w-full">
      {lines.map((line, idx) => {
        const trimmed = line.trim()

        // Bullet point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const itemText = trimmed.substring(2)
          return (
            <ul key={idx} className="list-disc pl-5 space-y-1 my-1">
              <li className="text-slate-700 dark:text-slate-300 font-medium">
                {renderTextWithBold(itemText)}
              </li>
            </ul>
          )
        }

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="text-sm font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5 tracking-tight"
            >
              {renderTextWithBold(trimmed.substring(4))}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={idx}
              className="text-base font-black text-slate-900 dark:text-white mt-4.5 mb-2 tracking-tight"
            >
              {renderTextWithBold(trimmed.substring(3))}
            </h3>
          )
        }

        if (!trimmed) return <div key={idx} className="h-1.5" />

        return (
          <p key={idx} className="text-slate-750 dark:text-slate-250 leading-relaxed font-medium">
            {renderTextWithBold(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function renderTextWithBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={i}
          className="font-extrabold text-slate-900 dark:text-white bg-slate-100/60 dark:bg-slate-800/80 px-1 py-0.5 rounded border border-slate-200/40 dark:border-slate-700/30"
        >
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

export function ChatPage() {
  const user = useAuthStore((state) => state.user)
  const userId = Number(user?.id || 0)
  const queryClient = useQueryClient()
  const toast = useToast()

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const {
    activeTab,
    setActiveTab,
    activeSessionId,
    setActiveSessionId,
    selectedDocumentIds,
    setSelectedDocumentIds,
  } = useAiWorkspaceStore()

  // Fetch Documents & Chat Sessions using React Query
  const {
    data: documents = [],
    isLoading: isLoadingDocs,
    isError: isErrorDocs,
  } = useUserDocuments(userId)

  const { data: sessions = [] } = useUserChatSessions(userId)

  // Auto-select valid remaining document if previous selection was deleted or none selected
  useEffect(() => {
    if (documents.length > 0) {
      const validDocIds = documents.map((d) => Number(d.id))
      const currentSelected = selectedDocumentIds[0]
      if (currentSelected && !validDocIds.includes(currentSelected)) {
        setSelectedDocumentIds([validDocIds[0]])
      } else if (selectedDocumentIds.length === 0) {
        setSelectedDocumentIds([validDocIds[0]])
      }
    } else if (selectedDocumentIds.length > 0) {
      setSelectedDocumentIds([])
    }
  }, [documents, selectedDocumentIds, setSelectedDocumentIds])

  const tabs: { id: WorkspaceTab; label: string; icon: any }[] = [
    { id: 'chat', label: 'AI Chatbot', icon: MessageSquare },
    { id: 'summary', label: 'Tổng quan', icon: FileText },
    { id: 'flashcards', label: 'Thẻ ghi nhớ', icon: Layers },
    { id: 'quiz', label: 'Bài kiểm tra', icon: HelpCircle },
    { id: 'faq', label: 'FAQ', icon: Sparkles },
  ]

  const handleSelectSession = (sessionId: number) => {
    setActiveSessionId(sessionId)
    setActiveTab('chat')
  }

  const handleNewChat = () => {
    setActiveSessionId(null)
    setActiveTab('chat')
  }

  const handleDeleteSession = (sessionId: number) => {
    const targetSession = sessions.find((s) => s.id === sessionId)
    const title = targetSession?.title || `Hội thoại #${sessionId}`
    setConfirmModal({
      isOpen: true,
      title: 'Xóa cuộc trò chuyện',
      message: `Bạn có chắc chắn muốn xóa cuộc trò chuyện "${title}"? Thao tác này không thể hoàn tác.`,
      onConfirm: async () => {
        try {
          await aiService.deleteChatSession(sessionId)
          if (activeSessionId === sessionId) {
            setActiveSessionId(null)
          }
          queryClient.invalidateQueries({ queryKey: ['userChatSessions', userId] })
          toast.success(`Đã xóa cuộc trò chuyện "${title}"!`)
        } catch (err) {
          console.error('Failed to delete chat session:', err)
          toast.error('Có lỗi xảy ra khi xóa cuộc trò chuyện.')
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
  }

  const handleClearAllSessions = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tất cả lịch sử hội thoại',
      message: 'Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử cuộc trò chuyện? Thao tác này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          await aiService.clearAllChatSessions(userId)
          setActiveSessionId(null)
          queryClient.invalidateQueries({ queryKey: ['userChatSessions', userId] })
          toast.success('Đã xóa tất cả lịch sử trò chuyện!')
        } catch (err) {
          console.error('Failed to clear chat sessions:', err)
          toast.error('Có lỗi xảy ra khi xóa lịch sử trò chuyện.')
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }))
        }
      },
    })
  }

  const handleTogglePinSession = async (sessionId: number) => {
    const targetSession = sessions.find((s) => s.id === sessionId)
    const currentPinned = targetSession?.isPinned
    try {
      await aiService.togglePinChatSession(sessionId)
      queryClient.invalidateQueries({ queryKey: ['userChatSessions', userId] })
      toast.success(currentPinned ? 'Đã bỏ ghim cuộc trò chuyện!' : 'Đã ghim cuộc trò chuyện lên đầu!')
    } catch (err) {
      console.error('Failed to toggle pin session:', err)
      toast.error('Có lỗi xảy ra khi tháo/ghim cuộc trò chuyện.')
    }
  }

  return (
    <div className="flex h-[calc(100vh-110px)] overflow-hidden font-sans select-none relative bg-slate-100/40 dark:bg-slate-950">
      {/* ── Left Sidebar: Document Selection ── */}
      <DocumentSelectionSidebar
        documents={documents}
        isLoadingDocs={isLoadingDocs}
        isErrorDocs={isErrorDocs}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onClearAllSessions={handleClearAllSessions}
        onNewChat={handleNewChat}
      />

      {/* ── Right Main Workspace Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900">
        {/* ── Top Nav Bar: 5 Workspace Tabs ── */}
        <div className="px-4 pt-3 pb-0 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {tabs.map((t) => {
              const Icon = t.icon
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap',
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-2xs'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/40 rounded-t-xl'
                  )}
                >
                  <Icon className="size-4" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              {selectedDocumentIds.length > 0 ? '1 tài liệu được chọn' : 'Chưa chọn tài liệu'}
            </span>
          </div>
        </div>

        {/* ── Tab View Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {activeTab === 'chat' && <TabChatbot />}
              {activeTab === 'summary' && <TabSummary />}
              {activeTab === 'flashcards' && <TabFlashcards />}
              {activeTab === 'quiz' && <TabQuiz />}
              {activeTab === 'faq' && <TabFaq />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Synchronized Confirmation Modal ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  )
}

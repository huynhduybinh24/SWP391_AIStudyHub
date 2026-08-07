import { useState, useEffect } from 'react'
import {
  MessageSquare, FileText, Layers, HelpCircle, BookOpen,
  Sparkles, Plus, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { useAiWorkspaceStore, WorkspaceTab } from '@/stores/aiWorkspaceStore'
import { useUserDocuments, useUserChatSessions } from '@/hooks/useAiStudioQueries'
import { DocumentSelectionSidebar } from '../components/DocumentSelectionSidebar'
import { TabChatbot } from '../components/tabs/TabChatbot'
import { TabSummary } from '../components/tabs/TabSummary'
import { TabFlashcards } from '../components/tabs/TabFlashcards'
import { TabQuiz } from '../components/tabs/TabQuiz'
import { TabFaq } from '../components/tabs/TabFaq'
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

  const {
    activeTab,
    setActiveTab,
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

  // Auto-select first document if non selected initially
  useEffect(() => {
    if (documents.length > 0 && selectedDocumentIds.length === 0) {
      setSelectedDocumentIds([documents[0].id])
    }
  }, [documents])

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

  return (
    <div className="flex h-[calc(100vh-110px)] overflow-hidden font-sans select-none relative bg-slate-100/40 dark:bg-slate-950">
      {/* ── Left Sidebar: Document Selection ── */}
      <DocumentSelectionSidebar
        documents={documents}
        isLoadingDocs={isLoadingDocs}
        isErrorDocs={isErrorDocs}
        sessions={sessions}
        onSelectSession={handleSelectSession}
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
    </div>
  )
}

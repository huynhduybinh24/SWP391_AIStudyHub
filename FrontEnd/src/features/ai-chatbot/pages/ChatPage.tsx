import { useState, useRef, useEffect } from 'react'
import {
  FileText, FlaskConical, FileQuestion, Paperclip, Send,
  Loader2, User, X, Plus, Search, Copy, RefreshCw, MoreVertical,
  Trash2, Edit2, Pin, MessageSquare, Check, Sparkles, BookOpen,
  FolderOpen, ArrowLeft, Zap, BrainCircuit, ChevronDown, Reply, Share2, CornerDownRight, Link
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { logActivity } from '@/services/activityLogService'
import { useAuthStore } from '@/stores/authStore'
import { aiService } from '@/services/aiService'
import { documentService, DocumentResponse } from '@/services/documentService'
import { StudioPanel } from '../components/StudioPanel'
import { AIChatbotIcon } from '@/components/layout/FloatingAssistantButton'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useLocation, useNavigate } from 'react-router-dom'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  thought?: string
  createdAt: string
  files?: Array<{ name: string; size: string }>
}

interface ChatConversation {
  id: string
  title: string
  preview: string
  updatedAt: string
  messages: ChatMessage[]
  documentIds: number[]
}

export function ChatPage() {
  const { language, t } = useTranslation()
  const toast = useToast()
  const user = useAuthStore(state => state.user)
  const userId = user?.id || 1
  const location = useLocation()
  const navigate = useNavigate()

  // --- States ---
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'Instant' | 'Thinking'>('Instant')
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  const [isChatStarted, setIsChatStarted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Consume initialPrompt from location state (e.g. from Dashboard Quick Ask)
  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null
    if (state?.initialPrompt) {
      setInput(state.initialPrompt)
      // Clear/replace location state to prevent repopulating on reload
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  // Document management states
  const [allDocuments, setAllDocuments] = useState<DocumentResponse[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentResponse[]>([])
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Studio and search states
  const [isStudioOpen, setIsStudioOpen] = useState(true)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pinnedConvIds, setPinnedConvIds] = useState<string[]>([])

  // UI control states
  const [activeDropdownConvId, setActiveDropdownConvId] = useState<string | null>(null)
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [replyingToMessage, setReplyingToMessage] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [sharingMessage, setSharingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load user documents and previous chat sessions from database on mount
  useEffect(() => {
    const fetchUserDocsAndSessions = async () => {
      setLoadingDocs(true)
      try {
        const docs = await documentService.getAllDocuments(Number(userId))
        setAllDocuments(docs)

        const sessions = await aiService.getUserSessions(Number(userId))
        const mappedConv: ChatConversation[] = sessions.map(session => {
          const docIds = session.documents ? session.documents.map((d: any) => d.id) : (session.documentId ? [session.documentId] : []);
          return {
            id: `session-${session.id}`,
            title: session.title || docs.filter(d => docIds.includes(d.id)).map(d => d.title).join(', ') || "Thảo luận tài liệu",
            preview: "Xem lịch sử trò chuyện...",
            updatedAt: new Date(session.updatedAt || session.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            messages: [], // load lazily on click
            documentIds: docIds
          }
        })
        setConversations(mappedConv)
      } catch (err) {
        console.error('Failed to load user documents or sessions', err)
        toast.error('Không thể tải danh sách tài liệu hoặc lịch sử trò chuyện.')
      } finally {
        setLoadingDocs(false)
      }
    }
    fetchUserDocsAndSessions()
  }, [userId])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false)
      }
      if (activeDropdownConvId) {
        const target = e.target as HTMLElement
        if (!target.closest('.history-dots-container')) {
          setActiveDropdownConvId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [activeDropdownConvId])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // --- Document Selection Logic ---
  const handleToggleDocSelect = (doc: DocumentResponse) => {
    setSelectedDocuments(prev => {
      const exists = prev.some(d => d.id === doc.id)
      if (exists) {
        return prev.filter(d => d.id !== doc.id)
      } else {
        return [...prev, doc]
      }
    })
  }

  const handleStartStudy = async () => {
    if (selectedDocuments.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một tài liệu nguồn.')
      return
    }

    const docIds = selectedDocuments.map(d => d.id)

    try {
      setIsTyping(true)
      const session = await aiService.createOrGetChatSession(docIds, Number(userId))
      const history = await aiService.getChatHistory(session.id)

      const mappedHistory: ChatMessage[] = history.map(msg => ({
        id: String(msg.id),
        role: msg.sender.toLowerCase() === 'user' ? 'user' : 'assistant',
        content: msg.messageText,
        thought: msg.thought,
        createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }))

      setMessages(mappedHistory)
      setIsChatStarted(true)

      const sessionConv: ChatConversation = {
        id: `session-${session.id}`,
        title: session.title || selectedDocuments.map(d => d.title).join(', '),
        preview: mappedHistory[mappedHistory.length - 1]?.content || "Bắt đầu cuộc trò chuyện...",
        updatedAt: t.common.justNow || "Just now",
        messages: mappedHistory,
        documentIds: docIds
      }

      setConversations(prev => {
        const exists = prev.some(c => c.id === `session-${session.id}`)
        if (exists) {
          return prev.map(c => c.id === `session-${session.id}` ? sessionConv : c)
        } else {
          return [sessionConv, ...prev]
        }
      })
      setActiveConversationId(`session-${session.id}`)
      setIsDocModalOpen(false)
    } catch (err) {
      console.error('Failed to initialize chat session', err)
      toast.error('Lỗi khởi tạo phiên học tập.')
    } finally {
      setIsTyping(false)
    }
  }

  // --- Send Message Handler ---
  const handleSend = async (textToSend?: string) => {
    let text = (textToSend || input).trim()
    if (replyingToMessage && !textToSend) {
      text = `> ${replyingToMessage}\n\n` + text
    }

    if (!text) return
    if (selectedDocuments.length === 0) {
      toast.warning('Bạn phải đính kèm ít nhất một tài liệu nguồn trước khi gửi câu hỏi.')
      return
    }

    // Log query activity
    logActivity({
      eventKey: 'aiChatAssistant',
      category: 'ai-audit',
      status: 'success',
      eventTextEn: 'AI Chatbot query',
      eventTextVi: 'Truy vấn chatbot AI',
      detailsTextEn: `Queried global AI Chatbot: '${text.length > 60 ? text.substring(0, 57) + '...' : text}'.`,
      detailsTextVi: `Đã gửi câu hỏi chatbot AI toàn cục: '${text.length > 60 ? text.substring(0, 57) + '...' : text}'.`
    })

    const userMsgId = Date.now().toString()
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      createdAt: t.common.justNow || "Just now",
    }

    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)
    setInput('')
    setReplyingToMessage(null)

    let targetConvId = activeConversationId
    setIsTyping(true)

    try {
      const docIds = selectedDocuments.map(d => d.id)
      const session = await aiService.createOrGetChatSession(docIds, Number(userId))
      const reply = await aiService.sendMessage(session.id, text, selectedMode === 'Thinking')

      const botMsgId = String(reply.id || Date.now() + 1)
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: reply.messageText,
        thought: reply.thought,
        createdAt: t.common.justNow || "Just now",
      }

      setMessages((prev) => {
        const finalMsgs = [...prev, newBotMsg]
        if (!targetConvId) {
          targetConvId = `session-${session.id}`
          const newConv: ChatConversation = {
            id: targetConvId,
            title: session.title || selectedDocuments.map(d => d.title).join(', '),
            preview: text.length > 35 ? text.substring(0, 35) + '...' : text,
            updatedAt: t.common.justNow || "Just now",
            messages: finalMsgs,
            documentIds: docIds
          }
          setConversations((cList) => [newConv, ...cList])
          setActiveConversationId(targetConvId)
        } else {
          setConversations((cList) =>
            cList.map((c) => {
              if (c.id === targetConvId) {
                return {
                  ...c,
                  preview: text.length > 35 ? text.substring(0, 35) + '...' : text,
                  updatedAt: t.common.justNow || "Just now",
                  messages: finalMsgs
                }
              }
              return c
            })
          )
        }
        return finalMsgs
      })
    } catch (err) {
      console.error('Failed to send chatbot message', err)
      const botMsgId = (Date.now() + 1).toString()
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: 'Xin lỗi, có lỗi xảy ra khi kết nối với máy chủ AI.',
        createdAt: t.common.justNow || "Just now",
      }
      setMessages((prev) => [...prev, newBotMsg])
    } finally {
      setIsTyping(false)
    }
  }

  // --- Button Actions ---
  const handleStartNewChat = () => {
    setSelectedDocuments([])
    setMessages([])
    setInput('')
    setIsChatStarted(false)
    setActiveConversationId(null)
  }

  const handleOpenConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      setActiveConversationId(conv.id)
      setIsChatStarted(true)
      setInput('')

      // Load corresponding documents from database for this session
      const docsToSelect = allDocuments.filter(d => conv.documentIds.includes(d.id))
      setSelectedDocuments(docsToSelect)

      // Lazy load chat history from database if it's empty
      if (conv.messages.length === 0 && id.startsWith('session-')) {
        setIsTyping(true)
        try {
          const dbSessionId = Number(id.replace('session-', ''))
          const history = await aiService.getChatHistory(dbSessionId)
          const mappedHistory: ChatMessage[] = history.map(msg => ({
            id: String(msg.id),
            role: msg.sender.toLowerCase() === 'user' ? 'user' : 'assistant',
            content: msg.messageText,
            thought: msg.thought,
            createdAt: new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }))
          setMessages(mappedHistory)
          // Store it in the local state so we don't refetch
          setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: mappedHistory } : c))
        } catch (err) {
          console.error('Failed to load chat history', err)
          toast.error('Không thể tải lịch sử trò chuyện.')
        } finally {
          setIsTyping(false)
        }
      } else {
        setMessages(conv.messages)
      }
    }
  }

  const handleCopyResponse = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success(t.common.copied || "Copied!")
  }

  const handleShareResponse = (content: string) => {
    setSharingMessage(content)
    setShareModalOpen(true)
  }

  const handleReplyMessage = (content: string) => {
    setReplyingToMessage(content)
  }

  const handleRegenerateResponse = async (index: number) => {
    if (index === 0) return
    const userMsg = messages[index - 1]
    if (userMsg && userMsg.role === 'user') {
      setIsTyping(true)
      const slicedMsgs = messages.slice(0, index)
      setMessages(slicedMsgs)

      try {
        const docIds = selectedDocuments.map(d => d.id)
        const session = await aiService.createOrGetChatSession(docIds, Number(userId))
        const reply = await aiService.sendMessage(session.id, userMsg.content, selectedMode === 'Thinking')

        const botMsgId = String(reply.id || Date.now() + 1)
        const newBotMsg: ChatMessage = {
          id: botMsgId,
          role: 'assistant',
          content: reply.messageText,
          thought: reply.thought,
          createdAt: t.common.justNow || "Just now",
        }
        const finalMsgs = [...slicedMsgs, newBotMsg]
        setMessages(finalMsgs)

        if (activeConversationId) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return { ...c, messages: finalMsgs }
              }
              return c
            })
          )
        }
      } catch (err) {
        console.error('Failed to regenerate response', err)
        const botMsgId = (Date.now() + 1).toString()
        const newBotMsg: ChatMessage = {
          id: botMsgId,
          role: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra khi kết nối với máy chủ AI.',
          createdAt: t.common.justNow || "Just now",
        }
        setMessages([...slicedMsgs, newBotMsg])
      } finally {
        setIsTyping(false)
      }
    }
  }

  // --- Conversation Actions ---
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPinnedConvIds((prev) => {
      const isPinned = prev.includes(id)
      const updated = isPinned ? prev.filter((pId) => pId !== id) : [...prev, id]
      toast.success(isPinned ? "Unpinned chat" : "Pinned chat")
      return updated
    })
    setActiveDropdownConvId(null)
  }

  const handleDeleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations((prev) => prev.filter((c) => c.id !== id))
    setPinnedConvIds((prev) => prev.filter((pId) => pId !== id))
    toast.success("Deleted chat")
    setActiveDropdownConvId(null)
    if (activeConversationId === id) {
      setMessages([])
      setActiveConversationId(null)
      setIsChatStarted(false)
      setSelectedDocuments([])
    }
  }

  const handleRenameConvClick = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConvId(id)
    setEditingTitle(currentTitle)
    setActiveDropdownConvId(null)
  }

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTitle.trim()) return
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, title: editingTitle }
        }
        return c
      })
    )
    setEditingConvId(null)
    toast.success(t.toasts.renameSuccess || "Renamed successfully")
  }

  // Sort history: pinned first, then by latest updated
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedConvIds.includes(a.id)
    const bPinned = pinnedConvIds.includes(b.id)
    if (aPinned && !bPinned) return -1
    if (!aPinned && bPinned) return 1
    return 0
  })

  // Realtime search filter
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] justify-between select-none font-sans relative">
      <AnimatePresence mode="wait">

        {/* ==================================================
            1. INITIAL DOCUMENT SELECTION START SCREEN
           ================================================== */}
        {!isChatStarted && activeConversationId === null ? (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center py-4 px-4 max-w-4xl mx-auto w-full"
          >
            <div className="w-full flex flex-col items-center">
              {/* Logo area */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-md">
                  <AIChatbotIcon className="size-8 animate-float" />
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-heading font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                    {t.aiChatbot.title}
                  </h1>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                    {t.aiChatbot.startSubtitle}
                  </p>
                </div>
              </div>

              {/* Central Panel for Selection */}
              <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 flex flex-col gap-6 transition-colors duration-300">
                <div className="text-left">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="size-5 text-[#2563eb]" />
                    <span>Chọn tài liệu nguồn để bắt đầu học tập</span>
                  </h2>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    Hãy lựa chọn các tài liệu mà bạn đã tải lên. AI sẽ đồng hành trả lời và phân tích thông tin dựa trên các nguồn này.
                  </p>
                </div>

                {/* Documents Grid */}
                {loadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="size-8 text-[#2563eb] animate-spin" />
                    <span className="text-xs text-slate-400 font-bold mt-2">Đang tải tài liệu từ thư viện...</span>
                  </div>
                ) : allDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20">
                    <FolderOpen className="size-10 text-slate-350 dark:text-slate-650" />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-3">Thư viện tài liệu của bạn đang trống</span>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px] text-center">Vui lòng tải lên tài liệu ở trang tài liệu trước khi bắt đầu hội thoại AI.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[260px] overflow-y-auto pr-1">
                    {allDocuments.map((doc) => {
                      const isSelected = selectedDocuments.some(d => d.id === doc.id)
                      return (
                        <div
                          key={doc.id}
                          onClick={() => handleToggleDocSelect(doc)}
                          className={cn(
                            "flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-blue-50/40 border-[#2563eb] dark:bg-blue-950/20 dark:border-blue-700/80 shadow-xs"
                              : "bg-slate-50/30 border-slate-150 hover:bg-slate-50 dark:bg-slate-950/10 dark:border-slate-800"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // handled by parent onClick
                            className="size-4.5 accent-[#2563eb] rounded mt-0.5 pointer-events-none"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{doc.title}</h4>
                            <span className="text-[10px] font-bold text-[#2563eb] bg-blue-50 dark:bg-blue-950/30 border border-blue-100/10 px-2 py-0.5 rounded-md inline-block mt-2">
                              {doc.subject || doc.fileType || 'Tài liệu'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block mt-2 font-medium">
                              {formatFileSize(doc.fileSize)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={handleStartStudy}
                    disabled={selectedDocuments.length === 0}
                    className="flex items-center justify-center gap-2.5 h-12 rounded-2xl text-white font-extrabold bg-gradient-to-r from-[#2563eb] to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98 transition-all cursor-pointer"
                  >
                    <Plus className="size-5" />
                    <span>Bắt đầu học ({selectedDocuments.length} tài liệu)</span>
                  </button>
                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200/50 dark:border-slate-800 active:scale-98 transition-all cursor-pointer"
                  >
                    <Search className="size-4.5" />
                    <span>Tìm đoạn chat cũ</span>
                  </button>
                </div>

                {/* History Section */}
                {conversations.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <MessageSquare className="size-4 text-slate-400 dark:text-slate-500" />
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {t.aiChatbot.chatHistory}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                      {sortedConversations.map((conv) => {
                        const isPinned = pinnedConvIds.includes(conv.id)
                        const isEditing = editingConvId === conv.id

                        return (
                          <div
                            key={conv.id}
                            onClick={() => !isEditing && handleOpenConversation(conv.id)}
                            className="group relative flex items-start gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md cursor-pointer transition-all duration-200"
                          >
                            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/30 dark:border-blue-900/20 rounded-xl text-blue-500 dark:text-blue-400 shrink-0">
                              <MessageSquare className="size-4" />
                            </div>

                            <div className="flex-1 min-w-0 pr-6 text-left">
                              {isEditing ? (
                                <form
                                  onSubmit={(e) => handleSaveRename(conv.id, e)}
                                  className="flex items-center gap-2 mt-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full h-8 px-2 text-sm bg-white dark:bg-slate-900 border border-blue-500/40 rounded-lg outline-none text-slate-800 dark:text-slate-100"
                                    autoFocus
                                  />
                                  <button type="submit" className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">
                                    <Check className="size-3.5" />
                                  </button>
                                  <button type="button" onClick={() => setEditingConvId(null)} className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700">
                                    <X className="size-3.5" />
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                      {conv.title}
                                    </h4>
                                    {isPinned && (
                                      <Pin className="size-3 text-blue-500 rotate-45 shrink-0" fill="currentColor" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                                    {conv.preview}
                                  </p>
                                </>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="absolute top-3.5 right-3.5 history-dots-container" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => setActiveDropdownConvId(activeDropdownConvId === conv.id ? null : conv.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                                >
                                  <MoreVertical className="size-4" />
                                </button>

                                {activeDropdownConvId === conv.id && (
                                  <div className="absolute right-0 mt-1 z-20 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={(e) => handleTogglePin(conv.id, e)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg w-full text-left cursor-pointer"
                                    >
                                      <Pin className="size-3.5 text-slate-400" />
                                      <span>{isPinned ? "Unpin" : "Pin"}</span>
                                    </button>
                                    <button
                                      onClick={(e) => handleRenameConvClick(conv.id, conv.title, e)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-lg w-full text-left cursor-pointer"
                                    >
                                      <Edit2 className="size-3.5 text-slate-400" />
                                      <span>Rename</span>
                                    </button>
                                    <hr className="border-slate-100 dark:border-slate-800 my-1" />
                                    <button
                                      onClick={(e) => handleDeleteConv(conv.id, e)}
                                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 rounded-lg w-full text-left cursor-pointer"
                                    >
                                      <Trash2 className="size-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (

          /* ==================================================
              2. CHAT LAYOUT WORKSPACE (SPLIT SCREEN WITH STUDIO)
             ================================================== */
          <motion.div
            key="chat-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex overflow-hidden h-full gap-0 bg-[#f8fafc] dark:bg-slate-950"
          >
            {/* Left Column: Nguồn (Sources) */}
            <div className="w-[280px] shrink-0 border-r border-slate-200/85 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden select-none">
              {/* Header */}
              <div className="p-4 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-sm font-bold text-slate-850 dark:text-slate-100">Nguồn</span>
                </div>
              </div>

              {/* Add Source Button */}
              <div className="p-3 shrink-0">
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="w-full h-10 border border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2563eb] rounded-xl flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-blue-50/20 dark:bg-slate-900/30 text-slate-600 hover:text-[#2563eb] dark:text-slate-450 dark:hover:text-blue-400 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="size-4" />
                  <span>Thêm nguồn</span>
                </button>
              </div>

              {/* Sources List */}
              <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                {selectedDocuments.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-4 py-8">
                    <FolderOpen className="size-9 text-slate-300 dark:text-slate-600" />
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
                      Các nguồn đã đính kèm sẽ xuất hiện ở đây.
                    </span>
                  </div>
                ) : (
                  selectedDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 hover:bg-slate-50 dark:bg-slate-950/20 dark:hover:bg-slate-900/40 relative animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      {/* File Icon */}
                      <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-[#2563eb] dark:text-blue-400 border border-blue-100/10">
                        <FileText className="size-3.5" />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-[11px] font-bold text-slate-850 dark:text-slate-200 block truncate" title={doc.title}>
                          {doc.title}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 block">
                          {doc.subject || doc.fileType || 'Tài liệu'}
                        </span>
                      </div>

                      {/* Remove source button */}
                      <button
                        onClick={() => handleToggleDocSelect(doc)}
                        className="absolute right-2 top-2.5 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Middle Column: Chat Workspace */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden pr-0 bg-slate-50/30 dark:bg-slate-950/10">

              {/* Header / Top bar */}
              <div className="sticky top-0 z-20 bg-[#f5f7fb] dark:bg-slate-950 pt-2 -mt-2 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-4 mb-4 select-none">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsChatStarted(false)
                      setActiveConversationId(null)
                      setSelectedDocuments([])
                    }}
                    className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-900 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                    title="Trở về danh sách chọn"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div className="text-left">
                    <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                      {activeConversationId
                        ? conversations.find(c => c.id === activeConversationId)?.title
                        : t.aiChatbot.newChat
                      }
                    </h1>
                    <span className="text-[10.5px] font-semibold font-mono tracking-widest text-[#2563eb] uppercase block mt-0.5">
                      {selectedDocuments.length} tài liệu nguồn được đính kèm
                    </span>
                  </div>
                </div>

                {/* Chat action controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsStudioOpen(!isStudioOpen)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs border transition-colors cursor-pointer shadow-2xs",
                      isStudioOpen
                        ? "bg-indigo-50 border-indigo-150/40 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/30"
                        : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <Sparkles className="size-3.5" />
                    <span>AI Studio</span>
                  </button>

                  <button
                    onClick={() => setSearchModalOpen(true)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Tìm đoạn chat"
                  >
                    <Search className="size-4.5" />
                  </button>
                  <button
                    onClick={handleStartNewChat}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/60 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 font-bold text-xs border border-blue-100/50 dark:border-blue-900/30 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Chat mới</span>
                  </button>
                </div>
              </div>

              {/* Chat Area Container */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden">

                {/* ==================================================
                    2A. EMPTY CHAT STATE
                   ================================================== */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center max-w-[620px] mx-auto w-full overflow-y-auto">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl shadow-sm mb-5">
                      <AIChatbotIcon className="size-9 animate-float drop-shadow-sm" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-heading font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-tight mb-4">
                      Bạn đã liên kết {selectedDocuments.length} tài liệu thành công!
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-8 max-w-sm">
                      Đặt câu hỏi hoặc chọn các thẻ gợi ý dưới đây để AI phân tích tài liệu nguồn ngay lập tức.
                    </p>

                    {/* Suggestion Prompt Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => handleSend(t.aiChatbot.summarizeRecentNotes)}
                        className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-slate-600 dark:text-slate-350 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                      >
                        <span className="truncate">{t.aiChatbot.summarizeRecentNotes}</span>
                        <FileText className="size-4 opacity-70 shrink-0 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSend("Phân tích cấu trúc cốt lõi của tài liệu này.")}
                        className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-slate-600 dark:text-slate-350 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                      >
                        <span className="truncate">Cấu trúc cốt lõi</span>
                        <BrainCircuit className="size-4 opacity-70 shrink-0 text-blue-500" />
                      </button>
                    </div>
                  </div>
                ) : (

                  /* ==================================================
                      2B. ACTIVE MESSAGES LIST
                     ================================================== */
                  <div className="flex-1 overflow-y-auto pl-2 pr-3 flex flex-col gap-6 pt-4 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                    {messages.map((msg, index) => {
                      const isUser = msg.role === 'user'

                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "flex items-start gap-2.5 transition-all duration-300 w-full group max-w-[92%]",
                            isUser ? "flex-row-reverse ml-auto" : "flex-row"
                          )}
                        >
                          {isUser ? (
                            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 border border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)] text-white">
                              <User className="size-4" />
                            </div>
                          ) : (
                            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                              <AIChatbotIcon className="size-4" />
                            </div>
                          )}

                          <div className="flex-1 flex flex-col gap-1.5 items-stretch min-w-0">
                            <div
                              className={cn(
                                "rounded-[20px] p-4 text-[14px] font-semibold leading-relaxed shadow-sm border whitespace-pre-line text-left flex flex-col gap-3",
                                isUser
                                  ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white border-transparent rounded-tr-sm"
                                  : "bg-white dark:bg-slate-900 text-slate-750 dark:text-slate-250 border-slate-200/55 dark:border-slate-800/80 rounded-tl-sm"
                              )}
                            >
                              {!isUser && msg.thought && (
                                <div className="mb-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 text-[12px] text-slate-500 dark:text-slate-400">
                                  <div className="flex items-center gap-1 font-bold mb-1 select-none text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[9.5px]">
                                    <BrainCircuit className="size-3.5" />
                                    <span>Reasoning Process</span>
                                  </div>
                                  <div className="italic font-mono whitespace-pre-wrap">{msg.thought}</div>
                                </div>
                              )}
                              {msg.content && <div>{msg.content}</div>}
                            </div>

                            <div className={cn(
                              "flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1",
                              isUser ? "mr-3 justify-end" : "ml-2"
                            )}>
                              <button
                                onClick={() => handleCopyResponse(msg.content)}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              >
                                <Copy className="size-3" />
                                <span>Copy</span>
                              </button>

                              {!isUser && (
                                <>
                                  <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                                  <button
                                    onClick={() => handleRegenerateResponse(index)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                  >
                                    <RefreshCw className="size-3" />
                                    <span>Tái tạo</span>
                                  </button>
                                </>
                              )}

                              <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                              <button
                                onClick={() => handleReplyMessage(msg.content)}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              >
                                <Reply className="size-3" />
                                <span>Trích dẫn</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-start gap-2.5 w-full flex-row max-w-[92%]"
                      >
                        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                          <AIChatbotIcon className="size-4" />
                        </div>
                        <div className="max-w-[80%] rounded-[20px] rounded-tl-sm px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 flex items-center gap-1.5 h-[42px] shadow-sm mt-0.5">
                          <div className="size-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                          <div className="size-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                          <div className="size-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* ==================================================
                    2C. COMPOSER BAR
                   ================================================== */}
                <div className="mt-2 border-t border-slate-200/50 dark:border-slate-800 pt-4 shrink-0 bg-[#f5f7fb] dark:bg-slate-950 z-20 sticky bottom-0 pb-2 flex flex-col gap-2">

                  {/* Linked source document chips list */}
                  <div className="flex flex-wrap gap-1.5 items-center mb-1.5">
                    {selectedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-[#e5eeff]/50 dark:border-blue-900/40 dark:bg-blue-950/20 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                      >
                        <FileText className="size-3 text-blue-500" />
                        <span className="truncate max-w-[120px]">{doc.title}</span>
                        <button
                          onClick={() => handleToggleDocSelect(doc)}
                          className="ml-1 rounded-full hover:bg-blue-150 p-0.5 text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setIsDocModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="size-3" />
                      <span>Chọn nguồn</span>
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 px-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500/85 focus-within:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.12)] z-10 relative flex flex-col gap-2">

                    {replyingToMessage && (
                      <div className="mb-1 flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <CornerDownRight className="size-4 shrink-0 text-slate-400" />
                          <span className="text-xs truncate font-semibold">"{replyingToMessage}"</span>
                        </div>
                        <button onClick={() => setReplyingToMessage(null)} className="shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600">
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}

                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={selectedDocuments.length === 0}
                      className="min-h-[24px] max-h-[160px] w-full resize-none bg-transparent text-[14px] font-medium leading-relaxed text-slate-800 dark:text-slate-150 outline-none placeholder:text-slate-450 dark:placeholder:text-slate-550 border-none p-0 focus:ring-0 disabled:cursor-not-allowed"
                      placeholder={
                        selectedDocuments.length === 0
                          ? "Hãy chọn ít nhất một tài liệu nguồn để bắt đầu..."
                          : "Hỏi AI về các tài liệu nguồn đã đính kèm..."
                      }
                      rows={1}
                    />

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 relative" ref={modeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors text-xs font-bold text-slate-750 dark:text-slate-250 cursor-pointer shadow-sm"
                        >
                          {selectedMode === 'Instant' ? <Zap className="size-3.5 text-amber-500" /> : <BrainCircuit className="size-3.5 text-indigo-500" />}
                          <span>{selectedMode === 'Instant' ? 'Tức Thì' : 'Deep Thinking'}</span>
                          <ChevronDown className="size-3.5 opacity-60" />
                        </button>

                        {isModeDropdownOpen && (
                          <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => { setSelectedMode('Instant'); setIsModeDropdownOpen(false) }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors",
                                selectedMode === 'Instant' ? "bg-slate-50 dark:bg-slate-850" : "hover:bg-slate-50 dark:hover:bg-slate-850"
                              )}
                            >
                              <div className="size-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Tức Thì</span>
                                <span className="text-[10px] text-slate-400">Tốc độ siêu nhanh</span>
                              </div>
                            </button>
                            <button
                              onClick={() => { setSelectedMode('Thinking'); setIsModeDropdownOpen(false) }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors",
                                selectedMode === 'Thinking' ? "bg-slate-50 dark:bg-slate-850" : "hover:bg-slate-50 dark:hover:bg-slate-850"
                              )}
                            >
                              <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <BrainCircuit className="size-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Deep Thinking</span>
                                <span className="text-[10px] text-slate-400">Suy nghĩ lập luận</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Source count badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100/10 text-xs font-bold text-[#2563eb] dark:text-blue-400 select-none">
                          <BookOpen className="size-3.5" />
                          <span>{selectedDocuments.length} nguồn</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSend()}
                          className={cn(
                            "size-9 shrink-0 flex items-center justify-center rounded-full transition-all cursor-pointer",
                            (input.trim() && selectedDocuments.length > 0)
                              ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                          )}
                          disabled={!input.trim() || selectedDocuments.length === 0}
                        >
                          <Send className="size-4 ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side AI Studio Panel (1/3 width) */}
            {isStudioOpen && (
              <StudioPanel
                documentIds={selectedDocuments.map(d => d.id)}
                language={language}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================
          3. MULTI-SELECT DOCUMENT ATTACHMENT MODAL
         ================================================== */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title="Quản lý tài liệu nguồn"
        className="max-w-2xl"
      >
        <div className="flex flex-col gap-4 py-2 text-left">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Chọn một hoặc nhiều tài liệu để tạo kho ngữ cảnh ôn tập. AI sẽ chỉ tham chiếu và trích xuất dữ liệu từ các tệp này để đảm bảo độ chính xác.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
            {allDocuments.map((doc) => {
              const isSelected = selectedDocuments.some(d => d.id === doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => handleToggleDocSelect(doc)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none",
                    isSelected
                      ? "bg-blue-50/40 border-[#2563eb] dark:bg-blue-950/20 dark:border-blue-700/80 shadow-xs"
                      : "bg-slate-50/30 border-slate-150 hover:bg-slate-50 dark:bg-slate-950/10 dark:border-slate-800"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="size-4.5 accent-[#2563eb] rounded mt-0.5"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{doc.title}</h4>
                    <span className="text-[10px] font-bold text-[#2563eb] bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-md inline-block mt-2">
                      {doc.subject || doc.fileType || 'Tài liệu'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-slate-100 dark:border-slate-850 pt-4">
            <button
              onClick={() => setIsDocModalOpen(false)}
              className="px-4.5 h-10 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-100"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => {
                setIsDocModalOpen(false)
                toast.success('Cập nhật tài liệu nguồn thành công.')
              }}
              className="px-4.5 h-10 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-extrabold text-xs cursor-pointer shadow-md"
            >
              Xác nhận ({selectedDocuments.length} tài liệu)
            </button>
          </div>
        </div>
      </Modal>

      {/* Search Conversations Modal */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setSearchQuery("")
        }}
        title="Tìm đoạn chat cũ"
        className="max-w-lg"
      >
        <div className="flex flex-col gap-5 py-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Nhập tiêu đề hoặc từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500/40 focus:ring-1"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-semibold">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    handleOpenConversation(conv.id)
                    setSearchModalOpen(false)
                    setSearchQuery("")
                  }}
                  className="flex items-start gap-3 p-3.5 rounded-xl border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-left w-full cursor-pointer transition-all"
                >
                  <MessageSquare className="size-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                      {conv.title}
                    </h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5 font-medium">
                      {conv.preview}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={t.common.share || "Chia sẻ"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-8 py-6">
          <p className="text-sm text-slate-650 dark:text-slate-300 text-center px-4 leading-relaxed font-semibold">
            {sharingMessage && sharingMessage.length > 120 ? sharingMessage.substring(0, 120) + '...' : sharingMessage}
          </p>

          <div className="flex items-center justify-center gap-6">
            <button className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => {
              navigator.clipboard.writeText(sharingMessage || "")
              toast.success("Đã sao chép liên kết!")
              setShareModalOpen(false)
            }}>
              <div className="size-14 rounded-full bg-slate-950 dark:bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Link className="size-6 text-white dark:text-slate-950" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sao chép link</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

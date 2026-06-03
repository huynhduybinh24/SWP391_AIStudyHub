import { useState, useRef, useEffect } from 'react'
import {
  FileText, FlaskConical, FileQuestion, Paperclip, Mic, Send,
  Loader2, User, X, Plus, Search, Copy, RefreshCw, MoreVertical,
  Trash2, Edit2, Pin, MessageSquare, Check, FolderOpen, ArrowLeft,
  Zap, BrainCircuit, ChevronDown, Reply, Share2, CornerDownRight, Link
} from 'lucide-react'

// --- Custom Social Icons ---
const IconX = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
)

const IconLinkedIn = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { logActivity } from '@/services/activityLogService'

import { AIChatbotIcon } from '@/components/layout/FloatingAssistantButton'

import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  files?: Array<{ name: string; size: string }>
}

interface ChatConversation {
  id: string
  title: string
  preview: string
  updatedAt: string
  messages: ChatMessage[]
}

export function ChatPage() {
  const { language, t } = useTranslation()
  const toast = useToast()

  // --- Initial Mock Conversations Data ---
  const initialConversations: ChatConversation[] = [
    {
      id: "chat-1",
      title: "Biology summary help",
      preview: "Summarize chapter 3 about cell biology...",
      updatedAt: t.common.justNow || "Just now",
      messages: [
        {
          id: "m1",
          role: "user",
          content: "Summarize chapter 3 about cell biology.",
          createdAt: t.common.twoHoursAgo || "2h ago",
        },
        {
          id: "m2",
          role: "assistant",
          content: "This document explains cell biology concepts, ATP production, and DNA replication stages.",
          createdAt: t.common.twoHoursAgo || "2h ago",
        },
      ]
    },
    {
      id: "chat-2",
      title: "Generate quiz from PDF",
      preview: "Create 10 multiple-choice questions...",
      updatedAt: t.common.yesterday || "Yesterday",
      messages: [
        {
          id: "m3",
          role: "user",
          content: "Create 10 multiple-choice questions from the PDF.",
          createdAt: t.common.yesterday || "Yesterday",
        },
        {
          id: "m4",
          role: "assistant",
          content: "Here are some multiple-choice questions:\n\n1. What is the powerhouse of the cell?\nA) Nucleus\nB) Mitochondria\nC) Ribosome\nD) Golgi apparatus",
          createdAt: t.common.yesterday || "Yesterday",
        }
      ]
    },
    {
      id: "chat-3",
      title: "Study plan for finals",
      preview: "Plan a 7-day study schedule...",
      updatedAt: t.common.may20 || "May 20",
      messages: [
        {
          id: "m5",
          role: "user",
          content: "Plan a 7-day study schedule for finals.",
          createdAt: t.common.may20 || "May 20",
        },
        {
          id: "m6",
          role: "assistant",
          content: "Day 1: Review CS101 lecture slides.\nDay 2: Take practice quizzes for Math.\nDay 3: Focus on biology flashcards.",
          createdAt: t.common.may20 || "May 20",
        }
      ]
    },
    {
      id: "chat-4",
      title: "Physics lab analysis",
      preview: "Explain the lab result and variables...",
      updatedAt: t.common.may18 || "May 18",
      messages: [
        {
          id: "m7",
          role: "user",
          content: "Explain the physics lab result and variables.",
          createdAt: t.common.may18 || "May 18",
        },
        {
          id: "m8",
          role: "assistant",
          content: "The independent variable is the mass of the pendulum. The dependent variable is the period of oscillation.",
          createdAt: t.common.may18 || "May 18",
        }
      ]
    },
  ]

  // --- States ---
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState<'Instant' | 'Thinking'>('Instant')
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  
  // Ref for the model selector dropdown to close on click outside
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  const [isChatStarted, setIsChatStarted] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [pinnedConvIds, setPinnedConvIds] = useState<string[]>([])

  // --- Selected Files State ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Voice Input State ---
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  // --- UI Control States ---
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false)
  const [activeDropdownConvId, setActiveDropdownConvId] = useState<string | null>(null)
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [replyingToMessage, setReplyingToMessage] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [sharingMessage, setSharingMessage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const attachDropdownRef = useRef<HTMLDivElement>(null)

  // Auto-clear file errors after 3 seconds
  useEffect(() => {
    if (fileError) {
      const timer = setTimeout(() => setFileError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [fileError])

  // Auto-clear voice errors after 3 seconds
  useEffect(() => {
    if (voiceError) {
      const timer = setTimeout(() => setVoiceError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [voiceError])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target as Node)) {
        setAttachDropdownOpen(false)
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false)
      }
      if (activeDropdownConvId) {
        // If clicking outside history menu dots, close it
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

  // --- Voice Input Handlers ---
  const startListening = () => {
    setVoiceError(null)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Fallback: Simulate voice recording
      setIsListening(true)
      toast.info(t.aiChatbot.recordingStarted)
      setTimeout(() => {
        setIsListening(false)
        setInput((prev) => prev + (prev ? ' ' : '') + "Explain this biology document in detail.")
        toast.info(t.aiChatbot.recordingStopped)
      }, 1500)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = language === 'vi' ? 'vi-VN' : (language === 'ja' ? 'ja-JP' : (language === 'ko' ? 'ko-KR' : 'en-US'))

      recognition.onstart = () => {
        setIsListening(true)
        toast.info(t.aiChatbot.recordingStarted)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
        setVoiceError("Voice recognition error: " + event.error)
      }

      recognition.onend = () => {
        setIsListening(false)
        toast.info(t.aiChatbot.recordingStopped)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInput((prev) => prev + (prev ? ' ' : '') + transcript)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error(err)
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  // --- File Upload Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    e.target.value = ''
    setFileError(null)

    if (selectedFiles.length + filesArray.length > 3) {
      setFileError(t.aiChatbot.maxFilesLimit)
      return
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.png', '.jpg', '.jpeg']
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB

    for (const file of filesArray) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(extension)) {
        setFileError(t.aiChatbot.unsupportedFileType)
        return
      }
      if (file.size > maxSizeBytes) {
        setFileError(t.aiChatbot.maxFileSizeLimit)
        return
      }
    }

    setSelectedFiles((prev) => [...prev, ...filesArray])
    toast.success(`${t.toasts.uploadSuccess || "File attached successfully"}`)
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
    setAttachDropdownOpen(false)
  }

  const handleAttachFromDocs = () => {
    // Simulate attaching a document from My Documents
    const mockFile = { name: "Lecture_Notes_Neuroscience.pdf", size: "2.8 MB" }
    toast.success(`${t.aiChatbot.promptAdded || "Prompt added"}: ${mockFile.name}`)
    setSelectedFiles((prev) => [...prev, new File([""], mockFile.name, { type: "application/pdf" })])
    setAttachDropdownOpen(false)
  }

  const handleAttachFromShared = () => {
    // Simulate attaching a document from Shared Files
    const mockFile = { name: "SWE_Lab_Requirements.docx", size: "1.4 MB" }
    toast.success(`${t.aiChatbot.promptAdded || "Prompt added"}: ${mockFile.name}`)
    setSelectedFiles((prev) => [...prev, new File([""], mockFile.name, { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })])
    setAttachDropdownOpen(false)
  }

  // --- Send Message Handler ---
  const handleSend = (textToSend?: string) => {
    let text = (textToSend || input).trim()
    if (replyingToMessage && !textToSend) {
      text = `> ${replyingToMessage}\n\n` + text
    }
    const filesToSend = textToSend ? [] : selectedFiles

    if (!text && filesToSend.length === 0) return

    // Log AI Chatbot query activity
    logActivity({
      eventKey: 'aiChatAssistant',
      category: 'ai-audit',
      status: 'success',
      eventTextEn: 'AI Chatbot query',
      eventTextVi: 'Truy vấn chatbot AI',
      detailsTextEn: `Queried global AI Chatbot: '${text.length > 60 ? text.substring(0, 57) + '...' : text}'.`,
      detailsTextVi: `Đã gửi câu hỏi chatbot AI toàn cục: '${text.length > 60 ? text.substring(0, 57) + '...' : text}'.`
    })

    // Create user message object
    const userMsgId = Date.now().toString()
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      createdAt: t.common.justNow || "Just now",
      files: filesToSend.map((file) => ({
        name: file.name,
        size: formatFileSize(file.size),
      })),
    }

    const updatedMessages = [...messages, newUserMsg]
    setMessages(updatedMessages)
    setInput('')
    setReplyingToMessage(null)
    setSelectedFiles([])
    setFileError(null)

    // Save active conversation state
    let targetConvId = activeConversationId

    if (!targetConvId) {
      // First message in a new chat: Create a new conversation
      targetConvId = `chat-${Date.now()}`
      const newTitle = text.length > 25 ? text.substring(0, 25) + '...' : text
      const newConv: ChatConversation = {
        id: targetConvId,
        title: newTitle,
        preview: text.length > 35 ? text.substring(0, 35) + '...' : text,
        updatedAt: t.common.justNow || "Just now",
        messages: updatedMessages
      }
      setConversations((prev) => [newConv, ...prev])
      setActiveConversationId(targetConvId)
    } else {
      // Update existing conversation
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              preview: text.length > 35 ? text.substring(0, 35) + '...' : text,
              updatedAt: t.common.justNow || "Just now",
              messages: updatedMessages
            }
          }
          return c
        })
      )
    }

    // Simulate bot response after 800ms
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      let botResponse = t.aiChatbot.botResponseDefault

      const lowerText = text.toLowerCase()
      if (lowerText.includes('summarize') || lowerText.includes('notes') || lowerText.includes('tóm tắt') || lowerText.includes('요약') || lowerText.includes('要約')) {
        botResponse = t.aiChatbot.botResponseNotes
      } else if (lowerText.includes('quantum') || lowerText.includes('mechanics') || lowerText.includes('lượng tử') || lowerText.includes('양자') || lowerText.includes('量子')) {
        botResponse = t.aiChatbot.botResponseQuantum
      } else if (lowerText.includes('quiz') || lowerText.includes('generate') || lowerText.includes('kiểm tra') || lowerText.includes('퀴즈') || lowerText.includes('クイズ')) {
        botResponse = t.aiChatbot.botResponseQuiz
      }

      const botMsgId = (Date.now() + 1).toString()
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: botResponse,
        createdAt: t.common.justNow || "Just now",
      }

      setMessages((prev) => {
        const finalMsgs = [...prev, newBotMsg]
        // Save to conversation
        setConversations((convList) =>
          convList.map((c) => {
            if (c.id === targetConvId) {
              return { ...c, messages: finalMsgs }
            }
            return c
          })
        )
        return finalMsgs
      })
    }, 800)
  }

  // --- Button Actions ---
  const handleStartNewChat = () => {
    setMessages([])
    setInput('')
    setSelectedFiles([])
    setIsChatStarted(true)
    setActiveConversationId(null)
  }

  const handleOpenConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      setMessages(conv.messages)
      setActiveConversationId(conv.id)
      setIsChatStarted(true)
      setInput('')
      setSelectedFiles([])
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

  const handleRegenerateResponse = (index: number) => {
    // Regenerate from the previous user message
    if (index === 0) return
    const userMsg = messages[index - 1]
    if (userMsg && userMsg.role === 'user') {
      setIsTyping(true)
      // Temporarily remove assistant message from this point
      const slicedMsgs = messages.slice(0, index)
      setMessages(slicedMsgs)

      setTimeout(() => {
        setIsTyping(false)
        const botResponse = t.aiChatbot.botResponseDefault
        const newBotMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botResponse,
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
      }, 800)
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
            1. INITIAL START SCREEN
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-md">
                <AIChatbotIcon className="size-6 animate-float" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {t.aiChatbot.title}
                </h1>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  {t.aiChatbot.startSubtitle}
                </p>
              </div>
            </div>

            {/* Central Panel */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-5 md:p-6 flex flex-col gap-5 transition-colors duration-300">

              {/* Primary Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center justify-center gap-2 h-12 rounded-2xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="size-5" />
                  <span>{t.aiChatbot.newChat}</span>
                </button>
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border border-slate-200/50 dark:border-slate-800 active:scale-98 transition-all cursor-pointer"
                >
                  <Search className="size-4.5" />
                  <span>{t.aiChatbot.searchChats}</span>
                </button>
              </div>

              {/* History Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <MessageSquare className="size-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.aiChatbot.chatHistory}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {sortedConversations.map((conv) => {
                    const isPinned = pinnedConvIds.includes(conv.id)
                    const isEditing = editingConvId === conv.id

                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && handleOpenConversation(conv.id)}
                        className="group relative flex items-start gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md cursor-pointer transition-all duration-200"
                      >
                        {/* Icon */}
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/30 dark:border-blue-900/20 rounded-xl text-blue-500 dark:text-blue-400 shrink-0">
                          <MessageSquare className="size-4" />
                        </div>

                        {/* Middle Details */}
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
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase mt-2.5 block">
                                {conv.updatedAt}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Three dots actions */}
                        {!isEditing && (
                          <div className="absolute top-3.5 right-3.5 history-dots-container" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveDropdownConvId(activeDropdownConvId === conv.id ? null : conv.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                            >
                              <MoreVertical className="size-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeDropdownConvId === conv.id && (
                              <div className="absolute right-0 mt-1 z-20 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5">
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
            </div>
            </div>
          </motion.div>
        ) : (

          /* ==================================================
              2. CHAT LAYOUT WORKSPACE
             ================================================== */
          <motion.div
            key="chat-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Header / Top bar */}
            <div className="sticky top-0 z-20 bg-[#f5f7fb] dark:bg-slate-950 pt-2 -mt-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsChatStarted(false)
                    setActiveConversationId(null)
                  }}
                  className="p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-900 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                  title="Back to start menu"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    {activeConversationId
                      ? conversations.find(c => c.id === activeConversationId)?.title
                      : t.aiChatbot.newChat
                    }
                  </h1>
                  <span className="text-[10.5px] font-semibold font-mono tracking-widest text-[#2563eb] uppercase block mt-0.5">
                    {t.aiChatbot.aiAssistant}
                  </span>
                </div>
              </div>

              {/* Chat action controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Search old chats"
                >
                  <Search className="size-4.5" />
                </button>
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/60 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 text-[#2563eb] dark:text-blue-400 font-bold text-xs border border-blue-100/50 dark:border-blue-900/30 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="size-3.5" />
                  <span>{t.aiChatbot.newChat}</span>
                </button>
              </div>
            </div>

            {/* Chat Area Container */}
            <div className="flex-1 flex flex-col justify-between">

              {/* ==================================================
                  2A. EMPTY CHAT STATE
                 ================================================== */}
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center max-w-[620px] mx-auto w-full">
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl shadow-sm mb-5">
                    <AIChatbotIcon className="size-9 animate-float drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-800 dark:text-slate-100 leading-tight tracking-tight mb-8">
                    {t.aiChatbot.emptyTitle}
                  </h2>

                  {/* Suggestion Prompt Chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.summarizeRecentNotes)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="truncate">{t.aiChatbot.summarizeRecentNotes}</span>
                      <FileText className="size-4 opacity-70 shrink-0 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.explainQuantum)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="truncate">{t.aiChatbot.explainQuantum}</span>
                      <FlaskConical className="size-4 opacity-70 shrink-0 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.generateQuiz)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="truncate">{t.aiChatbot.generateQuiz}</span>
                      <FileQuestion className="size-4 opacity-70 shrink-0 text-blue-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend("Create a study plan")}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-[16px] border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm px-4 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 cursor-pointer active:scale-[0.98]"
                    >
                      <span className="truncate">Create a study plan</span>
                      <Loader2 className="size-4 opacity-70 shrink-0 text-blue-500" />
                    </button>
                  </div>
                </div>
              ) : (

                /* ==================================================
                    2B. ACTIVE MESSAGES LIST
                   ================================================== */
                <div className="flex-1 overflow-y-auto pl-2 pr-3 flex flex-col gap-6 pt-4 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                        {/* Avatar */}
                        {isUser ? (
                          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 border border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.4)] text-white">
                            <User className="size-4" />
                          </div>
                        ) : (
                          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                            <AIChatbotIcon className="size-4" />
                          </div>
                        )}

                        {/* Content Container */}
                        <div className="flex-1 flex flex-col gap-1.5 items-stretch min-w-0">
                          {/* Chat Bubble */}
                          <div
                            className={cn(
                              "rounded-[20px] p-4 text-[14.5px] leading-relaxed shadow-sm border whitespace-pre-line text-left flex flex-col gap-3",
                              isUser
                                ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white border-transparent rounded-tr-sm"
                                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700/50 rounded-tl-sm"
                            )}
                          >
                            {msg.content && <div>{msg.content}</div>}

                            {/* Attached files */}
                            {msg.files && msg.files.length > 0 && (
                              <div className="flex flex-col gap-2 mt-2 border-t border-slate-200 dark:border-slate-700/50 pt-3 shrink-0">
                                {msg.files.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex items-center gap-2.5 rounded-xl p-3 text-[12.5px] font-medium border shadow-sm",
                                      isUser ? "bg-white/10 border-white/20 text-white" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                                    )}
                                  >
                                    <FileText className="size-4 shrink-0 opacity-80" />
                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-[11px] opacity-70 shrink-0 ml-auto">{file.size}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Actions */}
                          <div className={cn(
                            "flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-1",
                            isUser ? "mr-3 justify-end" : "ml-2"
                          )}>
                            <button
                              onClick={() => handleCopyResponse(msg.content)}
                              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              title={t.aiChatbot.copy || "Copy"}
                            >
                              <Copy className="size-3" />
                              <span>{t.aiChatbot.copy || "Copy"}</span>
                            </button>
                            
                            {!isUser && (
                              <>
                                <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                                <button
                                  onClick={() => handleRegenerateResponse(index)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                  title={t.aiChatbot.regenerate || "Regenerate"}
                                >
                                  <RefreshCw className="size-3" />
                                  <span>{t.aiChatbot.regenerate || "Regenerate"}</span>
                                </button>
                              </>
                            )}

                            <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                            <button
                              onClick={() => handleReplyMessage(msg.content)}
                              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              title={t.common.reply || "Reply"}
                            >
                              <Reply className="size-3" />
                              <span>{t.common.reply || "Reply"}</span>
                            </button>

                            <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                            <button
                              onClick={() => handleShareResponse(msg.content)}
                              className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                              title={t.common.share || "Share"}
                            >
                              <Share2 className="size-3" />
                              <span>{t.common.share || "Share"}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Thinking status */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-start gap-2.5 w-full flex-row max-w-[92%]"
                    >
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50">
                        <AIChatbotIcon className="size-4" />
                      </div>
                      <div className="max-w-[80%] rounded-[20px] rounded-tl-sm px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 h-[42px] shadow-sm mt-0.5">
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
              <div className="mt-2 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0 bg-[#f5f7fb] dark:bg-slate-950 z-20 sticky bottom-0 pb-2">
                {/* Attached files ready to upload */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2 justify-start items-center">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-blue-200/50 bg-[#e5eeff]/50 dark:border-blue-900/30 dark:bg-blue-950/30 px-3 py-1.5 text-xs text-blue-600 dark:text-blue-300 shadow-2xs"
                      >
                        <FileText className="size-3.5 shrink-0 text-blue-500" />
                        <span className="truncate max-w-[150px] font-semibold">{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-400 hover:text-blue-700 transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Errors display */}
                {fileError && (
                  <div className="mb-2 text-left text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <X className="size-3" />
                    <span>{fileError}</span>
                  </div>
                )}
                {voiceError && (
                  <div className="mb-2 text-left text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <X className="size-3" />
                    <span>{voiceError}</span>
                  </div>
                )}

                {/* Main input composer box */}
                <div className="rounded-[24px] border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 p-4 px-5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500/80 focus-within:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] z-10 relative flex flex-col gap-2">
                  
                  {/* Replying To preview block */}
                  {replyingToMessage && (
                    <div className="mb-1 flex items-center justify-between gap-3 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <CornerDownRight className="size-4 shrink-0 text-slate-400" />
                        <span className="text-sm truncate font-medium">"{replyingToMessage}"</span>
                      </div>
                      <button onClick={() => setReplyingToMessage(null)} className="shrink-0 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[24px] max-h-[160px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none p-0 focus:ring-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
                    placeholder={t.aiChatbot.askAnything || "Ask anything..."}
                    rows={1}
                  />

                  {/* Actions inside composer */}
                  <div className="flex items-center justify-between pt-2">
                    
                    {/* Left Actions */}
                    <div className="flex items-center gap-1.5 relative">
                      
                      {/* Plus Dropdown button */}
                      <div ref={attachDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          title={t.aiChatbot.attachFiles}
                        >
                          <Plus className={cn("size-5 transition-transform", attachDropdownOpen && "rotate-45")} />
                        </button>

                        {/* Plus Attach dropdown contents */}
                        {attachDropdownOpen && (
                          <div className="absolute left-0 bottom-full mb-2 z-20 w-52 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5">
                            <button
                              onClick={handleAttachClick}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl w-full text-left cursor-pointer transition-colors"
                            >
                              <Paperclip className="size-4 text-slate-400" />
                              <span>{t.aiChatbot.uploadFile || "Upload File"}</span>
                            </button>
                            <button
                              onClick={handleAttachFromDocs}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl w-full text-left cursor-pointer transition-colors"
                            >
                              <FileText className="size-4 text-slate-400" />
                              <span>{t.aiChatbot.addFromMyDocuments || "Add from My Documents"}</span>
                            </button>
                            <button
                              onClick={handleAttachFromShared}
                              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-xl w-full text-left cursor-pointer transition-colors"
                            >
                              <FolderOpen className="size-4 text-slate-400" />
                              <span>{t.aiChatbot.addFromSharedFiles || "Add from Shared Files"}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Hidden File input */}
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />

                      {/* Mic recorder button */}
                      <button
                        type="button"
                        onClick={handleMicClick}
                        className={cn(
                          "size-9 rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isListening
                            ? "bg-rose-50 text-rose-500 dark:bg-rose-500/20"
                            : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                        title={isListening ? "Stop listening" : "Start voice input"}
                      >
                        <Mic className={cn("size-5", isListening && "animate-pulse")} />
                      </button>

                      {/* Tức Thì / Mode Selector */}
                      <div className="relative ml-2" ref={modeDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm"
                        >
                          {selectedMode === 'Instant' ? <Zap className="size-3.5 text-amber-500" /> : <BrainCircuit className="size-3.5 text-indigo-500" />}
                          <span>{selectedMode === 'Instant' ? (t.aiChatbot.instant || 'Instant') : (t.aiChatbot.thinkingMode || 'Thinking')}</span>
                          <ChevronDown className="size-3.5 opacity-60" />
                        </button>

                        {isModeDropdownOpen && (
                          <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 flex flex-col gap-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => { setSelectedMode('Instant'); setIsModeDropdownOpen(false) }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors",
                                selectedMode === 'Instant' ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <div className="size-7 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{t.aiChatbot.instant || "Instant"}</span>
                                <span className="text-[11px] text-slate-500">{t.aiChatbot.instantDesc || "Fast & Basic"}</span>
                              </div>
                            </button>
                            <button
                              onClick={() => { setSelectedMode('Thinking'); setIsModeDropdownOpen(false) }}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-colors",
                                selectedMode === 'Thinking' ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              )}
                            >
                              <div className="size-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <BrainCircuit className="size-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[13px] font-semibold text-slate-900 dark:text-white">{t.aiChatbot.thinkingMode || "Thinking"}</span>
                                <span className="text-[11px] text-slate-500">{t.aiChatbot.thinkingDesc || "Latest • Deep Reasoning"}</span>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mode selector + Send Button (Hidden old mode badge since moved to left) */}
                    <div className="flex items-center gap-3">
                      {/* Send button */}
                      <button
                        type="button"
                        onClick={() => handleSend()}
                        className={cn(
                          "size-9 shrink-0 flex items-center justify-center rounded-full transition-all cursor-pointer",
                          (input.trim() || selectedFiles.length > 0)
                            ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                        disabled={!input.trim() && selectedFiles.length === 0}
                        title={t.aiChatbot.sendMessage}
                      >
                        <Send className="size-4 ml-0.5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================
          3. SEARCH CONVERSATION MODAL
         ================================================== */}
      <Modal
        isOpen={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false)
          setSearchQuery("")
        }}
        title={t.aiChatbot.searchModalTitle || "Search Chats"}
        className="max-w-lg"
      >
        <div className="flex flex-col gap-5 py-2">
          {/* Search bar inside modal */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={t.aiChatbot.searchPlaceholder || "Search by title or content..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/40 font-medium transition-all"
              autoFocus
            />
          </div>

          {/* Searched chats results list */}
          <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-semibold">
                {t.aiChatbot.noChatsFound || "No chats found"}
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
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                      {conv.preview}
                    </p>
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase shrink-0 self-center">
                    {conv.updatedAt}
                  </span>
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
        title={t.common.share || "Share"}
        className="max-w-md"
      >
        <div className="flex flex-col gap-8 py-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center px-4 leading-relaxed font-medium">
            {sharingMessage && sharingMessage.length > 120 ? sharingMessage.substring(0, 120) + '...' : sharingMessage}
          </p>
          
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            <button className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => {
              navigator.clipboard.writeText(sharingMessage || "")
              toast.success(t.common.shareSuccess || "Copied link!")
              setShareModalOpen(false)
            }}>
              <div className="size-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <Link className="size-6 text-white dark:text-black" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Copy link</span>
            </button>

            <button className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(sharingMessage || ""))}>
              <div className="size-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <IconX className="size-5 text-white dark:text-black" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">X</span>
            </button>

            <button className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => window.open('https://linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(window.location.href))}>
              <div className="size-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <IconLinkedIn className="size-5 text-white dark:text-black" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">LinkedIn</span>
            </button>

            <button className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => window.open('https://reddit.com/submit?url=' + encodeURIComponent(window.location.href) + '&title=' + encodeURIComponent('Check out this response'))}>
              <div className="size-14 rounded-full bg-black dark:bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-6 text-white dark:text-black">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.073 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.562 8 13.25c0 .687.56 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.562-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.688-.561-1.25-1.25-1.25zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .466c.843.84 2.484.911 2.961.911.477 0 2.105-.072 2.961-.911a.327.327 0 0 0 0-.466.327.327 0 0 0-.466 0c-.461.46-1.633.686-2.495.686-.85 0-2.022-.226-2.499-.686a.328.328 0 0 0-.231-.094z"/>
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Reddit</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

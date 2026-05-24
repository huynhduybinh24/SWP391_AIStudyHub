import { useState, useRef, useEffect } from 'react'
import { 
  Bot, FileText, FlaskConical, FileQuestion, Paperclip, Mic, Send, 
  Loader2, User, X, Plus, Search, Copy, RefreshCw, MoreVertical, 
  Trash2, Edit2, Pin, MessageSquare, Check, Sparkles, FolderOpen, ArrowLeft
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
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
      updatedAt: "2h ago",
      messages: [
        {
          id: "m1",
          role: "user",
          content: "Summarize this biology document.",
          createdAt: "2h ago",
        },
        {
          id: "m2",
          role: "assistant",
          content: "This document explains cell biology concepts, ATP production, and DNA replication stages.",
          createdAt: "2h ago",
        },
      ]
    },
    {
      id: "chat-2",
      title: "Generate quiz from PDF",
      preview: "Create 10 multiple-choice questions...",
      updatedAt: "Yesterday",
      messages: [
        {
          id: "m3",
          role: "user",
          content: "Create 10 multiple-choice questions from the PDF.",
          createdAt: "Yesterday",
        },
        {
          id: "m4",
          role: "assistant",
          content: "Here are some multiple-choice questions:\n\n1. What is the powerhouse of the cell?\nA) Nucleus\nB) Mitochondria\nC) Ribosome\nD) Golgi apparatus",
          createdAt: "Yesterday",
        }
      ]
    },
    {
      id: "chat-3",
      title: "Study plan for finals",
      preview: "Plan a 7-day study schedule...",
      updatedAt: "May 20",
      messages: [
        {
          id: "m5",
          role: "user",
          content: "Plan a 7-day study schedule for finals.",
          createdAt: "May 20",
        },
        {
          id: "m6",
          role: "assistant",
          content: "Day 1: Review CS101 lecture slides.\nDay 2: Take practice quizzes for Math.\nDay 3: Focus on biology flashcards.",
          createdAt: "May 20",
        }
      ]
    },
    {
      id: "chat-4",
      title: "Physics lab analysis",
      preview: "Explain the lab result and variables...",
      updatedAt: "May 18",
      messages: [
        {
          id: "m7",
          role: "user",
          content: "Explain the physics lab result and variables.",
          createdAt: "May 18",
        },
        {
          id: "m8",
          role: "assistant",
          content: "The independent variable is the mass of the pendulum. The dependent variable is the period of oscillation.",
          createdAt: "May 18",
        }
      ]
    },
  ]

  // --- States ---
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
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
    const text = (textToSend || input).trim()
    const filesToSend = textToSend ? [] : selectedFiles

    if (!text && filesToSend.length === 0) return

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
    toast.success(t.aiChatbot.newChatStarted || "New chat started")
  }

  const handleOpenConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id)
    if (conv) {
      setMessages(conv.messages)
      setActiveConversationId(conv.id)
      setIsChatStarted(true)
      setInput('')
      setSelectedFiles([])
      toast.success(t.aiChatbot.chatOpened || "Chat opened")
    }
  }

  const handleCopyResponse = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success(t.common.copied || "Copied!")
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
    <div className="flex flex-col min-h-[calc(100vh-220px)] justify-between select-none font-sans relative">
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
            className="flex-1 flex flex-col items-center justify-center py-10 px-4 max-w-4xl mx-auto w-full"
          >
            {/* Logo area */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 shadow-md">
                <Bot className="size-8 animate-float" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                  {t.aiChatbot.title}
                </h1>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                  {t.aiChatbot.startSubtitle}
                </p>
              </div>
            </div>

            {/* Central Panel */}
            <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 md:p-8 flex flex-col gap-8 transition-colors duration-300">
              
              {/* Primary Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleStartNewChat}
                  className="flex items-center justify-center gap-3 h-14 rounded-2xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="size-5.5" />
                  <span>{t.aiChatbot.newChat}</span>
                </button>
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="flex items-center justify-center gap-3 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold border border-slate-200/50 dark:border-slate-800 active:scale-98 transition-all cursor-pointer"
                >
                  <Search className="size-5" />
                  <span>{t.aiChatbot.searchChats}</span>
                </button>
              </div>

              {/* History Section */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <MessageSquare className="size-4.5 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.aiChatbot.chatHistory}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {sortedConversations.map((conv) => {
                    const isPinned = pinnedConvIds.includes(conv.id)
                    const isEditing = editingConvId === conv.id

                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && handleOpenConversation(conv.id)}
                        className="group relative flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:shadow-md cursor-pointer transition-all duration-200"
                      >
                        {/* Icon */}
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/30 dark:border-blue-900/20 rounded-xl text-blue-500 dark:text-blue-400 shrink-0">
                          <MessageSquare className="size-4.5" />
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
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 select-none">
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
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100/30 dark:border-blue-900/20 rounded-2xl text-blue-500 dark:text-blue-400 shadow-inner mb-5">
                    <Bot className="size-9 animate-float" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-800 dark:text-white leading-tight tracking-tight mb-8">
                    {t.aiChatbot.emptyTitle}
                  </h2>

                  {/* Suggestion Prompt Chips */}
                  <div className="flex flex-col gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.summarizeRecentNotes)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-sm font-bold text-[#434655] dark:text-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/45 dark:hover:border-blue-500/40 hover:shadow-md cursor-pointer"
                    >
                      <span className="truncate">{t.aiChatbot.summarizeRecentNotes}</span>
                      <FileText className="size-4 text-slate-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.explainQuantum)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-sm font-bold text-[#434655] dark:text-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/45 dark:hover:border-blue-500/40 hover:shadow-md cursor-pointer"
                    >
                      <span className="truncate">{t.aiChatbot.explainQuantum}</span>
                      <FlaskConical className="size-4 text-slate-400 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend(t.aiChatbot.generateQuiz)}
                      className="flex items-center justify-between gap-3 text-left w-full rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-sm font-bold text-[#434655] dark:text-slate-300 shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/45 dark:hover:border-blue-500/40 hover:shadow-md cursor-pointer"
                    >
                      <span className="truncate">{t.aiChatbot.generateQuiz}</span>
                      <FileQuestion className="size-4 text-slate-400 shrink-0" />
                    </button>
                  </div>
                </div>
              ) : (

                /* ==================================================
                    2B. ACTIVE MESSAGES LIST
                   ================================================== */
                <div className="flex-1 overflow-y-auto max-h-[500px] pr-1 flex flex-col gap-6 pt-4">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === 'user'

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex items-start gap-3.5 transition-all duration-300 w-full group",
                          isUser ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        {/* Avatar */}
                        {isUser ? (
                          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3155F6] dark:bg-blue-600 border border-[#3155f6]/20 dark:border-blue-700 shadow-sm text-white">
                            <User className="size-4" />
                          </div>
                        ) : (
                          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30 shadow-sm text-[#3155F6] dark:text-blue-400">
                            <Bot className="size-4" />
                          </div>
                        )}

                        {/* Content Container */}
                        <div className="max-w-[80%] flex flex-col gap-1.5 items-stretch">
                          {/* Chat Bubble */}
                          <div
                            className={cn(
                              "rounded-2xl p-4 text-[14.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.015)] border whitespace-pre-line text-left flex flex-col gap-3",
                              isUser
                                ? "bg-[#3155F6] dark:bg-blue-600 text-white border-transparent rounded-tr-none"
                                : "bg-white dark:bg-slate-900 text-[#434655] dark:text-slate-200 border-slate-200/60 dark:border-slate-800 rounded-tl-none"
                            )}
                          >
                            {msg.content && <div>{msg.content}</div>}
                            
                            {/* Attached files inside user message */}
                            {msg.files && msg.files.length > 0 && (
                              <div className="flex flex-col gap-1.5 mt-1 border-t border-white/20 pt-2 shrink-0">
                                {msg.files.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border",
                                      isUser
                                        ? "bg-white/10 border-white/15 text-white"
                                        : "bg-slate-50 border-slate-100 text-slate-700"
                                    )}
                                  >
                                    <FileText className="size-3.5 shrink-0 opacity-80" />
                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                    <span className="text-[10px] opacity-70 shrink-0">({file.size})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Message Actions (AI only) */}
                          {!isUser && (
                            <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleCopyResponse(msg.content)}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                title={t.aiChatbot.copy || "Copy response"}
                              >
                                <Copy className="size-3" />
                                <span>Copy</span>
                              </button>
                              <span className="text-slate-200 dark:text-slate-800 text-[10px] font-bold">•</span>
                              <button
                                onClick={() => handleRegenerateResponse(index)}
                                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                                title={t.aiChatbot.regenerate || "Regenerate"}
                              >
                                <RefreshCw className="size-3" />
                                <span>Regenerate</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}

                  {/* Thinking status */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-start gap-3.5 w-full flex-row"
                    >
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30 shadow-sm text-[#3155F6] dark:text-blue-400">
                        <Bot className="size-4" />
                      </div>
                      <div className="max-w-[80%] rounded-2xl rounded-tl-none p-4 text-[14.5px] bg-white dark:bg-slate-900 text-[#737686] dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-[#3155F6] dark:text-blue-400" />
                        <span>{t.aiChatbot.thinking}</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* ==================================================
                  2C. COMPOSER BAR
                 ================================================== */}
              <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
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
                <div className="rounded-2xl border-2 border-[#e5eeff] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all focus-within:border-[#3155F6]/40 dark:focus-within:border-blue-500/40 focus-within:shadow-[0_2px_16px_rgba(49,85,246,0.04)] dark:focus-within:shadow-[0_2px_16px_rgba(59,130,246,0.08)]">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[48px] max-h-[160px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0b1c30] dark:text-white outline-none placeholder:text-[#737686]/60 dark:placeholder:text-slate-500 border-none p-0 focus:ring-0"
                    placeholder={t.aiChatbot.askAnything || "Ask anything..."}
                    rows={2}
                  />

                  {/* Actions inside composer */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100/50 dark:border-slate-800/50 pt-3">
                    
                    {/* Add attachment & microphone */}
                    <div className="flex items-center gap-1.5 relative">
                      
                      {/* Plus Dropdown button */}
                      <div ref={attachDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setAttachDropdownOpen(!attachDropdownOpen)}
                          className="text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center"
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
                          "p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isListening
                            ? "bg-rose-50 border border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30"
                            : "text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                        title={t.aiChatbot.voiceInput}
                      >
                        <Mic className={cn("size-5", isListening && "animate-pulse")} />
                        {isListening && <span className="text-[10px] font-bold uppercase tracking-wider">{t.aiChatbot.listening}</span>}
                      </button>
                    </div>

                    {/* Mode selector + Send Button */}
                    <div className="flex items-center gap-3">
                      {/* Instant mode badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100/50 dark:bg-blue-950/30 dark:border-blue-900/20 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest select-none">
                        <Sparkles className="size-3" />
                        <span>{t.aiChatbot.instant || "Instant"}</span>
                      </span>

                      {/* Send button */}
                      <button
                        type="button"
                        onClick={() => handleSend()}
                        className="flex size-10 items-center justify-center rounded-xl bg-[#3155F6] dark:bg-blue-600 text-white shadow-sm transition-all hover:bg-[#2563eb] dark:hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer disabled:pointer-events-none disabled:opacity-40"
                        disabled={!input.trim() && selectedFiles.length === 0}
                        title={t.aiChatbot.sendMessage}
                      >
                        <Send className="size-4.5" />
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
    </div>
  )
}

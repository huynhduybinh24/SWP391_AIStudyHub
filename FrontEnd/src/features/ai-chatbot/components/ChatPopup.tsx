import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X, Paperclip, FileIcon, Zap, BrainCircuit, ChevronDown, Mic, CloudUpload, Library, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { AIChatbotIcon } from '@/components/layout/FloatingAssistantButton'
import { motion } from 'framer-motion'
import { useTranslation } from '@/context/LanguageContext'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/authStore'
import { aiService } from '@/services/aiService'
import { documentService } from '@/services/documentService'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  attachment?: {
    name: string
  }
  thought?: string
}

interface ChatPopupProps {
  onClose: () => void
}

export function ChatPopup({ onClose }: ChatPopupProps) {
  const { t } = useTranslation()
  const toast = useToast()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [attachedDocIds, setAttachedDocIds] = useState<number[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const user = useAuthStore((s) => s.user)
  const [sessionId, setSessionId] = useState<number | null>(null)

  useEffect(() => {
    if (user?.id) {
      aiService.createOrGetChatSession([], Number(user.id))
        .then((session) => {
          setSessionId(session.id)
          return aiService.getChatHistory(session.id)
        })
        .then((history) => {
          const formatted = history.map((m) => ({
            id: m.id.toString(),
            sender: m.sender === 'USER' ? 'user' as const : 'bot' as const,
            text: m.messageText,
            thought: m.thought || undefined
          }))
          setMessages(formatted)
        })
        .catch((err) => {
          console.error("Failed to initialize global chatbot session", err)
        })
    }
  }, [user?.id])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const modeDropdownRef = useRef<HTMLDivElement>(null)
  const attachDropdownRef = useRef<HTMLDivElement>(null)

  const [selectedMode, setSelectedMode] = useState<'Instant' | 'Thinking'>('Instant')
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  const [isAttachDropdownOpen, setIsAttachDropdownOpen] = useState(false)

  // Voice Input Speech Recognition Setup
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Thinking Process Steps
  const [thinkingStep, setThinkingStep] = useState(0)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = t.aiChatbot.listening === 'Đang nghe...' ? 'vi-VN' : 'en-US'
      
      rec.onstart = () => {
        setIsListening(true)
        toast.info(t.aiChatbot.recordingStarted || "Recording started")
      }

      rec.onend = () => {
        setIsListening(false)
      }

      rec.onerror = (e: any) => {
        console.error(e)
        setIsListening(false)
      }

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript))
        toast.success(t.aiChatbot.promptAdded || "Voice input parsed!")
      }

      recognitionRef.current = rec
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.aiChatbot.listening])

  useEffect(() => {
    if (isTyping && selectedMode === 'Thinking') {
      setThinkingStep(0)
      const t1 = setTimeout(() => setThinkingStep(1), 800)
      const t2 = setTimeout(() => setThinkingStep(2), 1600)
      const t3 = setTimeout(() => setThinkingStep(3), 2400)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
  }, [isTyping, selectedMode])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false)
      }
      if (attachDropdownRef.current && !attachDropdownRef.current.contains(e.target as Node)) {
        setIsAttachDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const initialChatMessage = useUiStore((s) => s.initialChatMessage)
  const setInitialChatMessage = useUiStore((s) => s.setInitialChatMessage)

  useEffect(() => {
    if (initialChatMessage) {
      handleSend(initialChatMessage)
      setInitialChatMessage('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attachment Handlers
  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!user?.id) {
        toast.error("Vui lòng đăng nhập để gửi tệp.")
        return
      }
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'pdf') {
        toast.error(t.toasts.onlyPdfAllowed || "Hệ thống chỉ hỗ trợ tải tệp tin PDF.")
        return
      }
      if (selectedFiles.length >= 3) {
        toast.error(t.aiChatbot.maxFilesLimit || "You can attach up to 3 files.")
        return
      }
      setIsUploading(true)
      documentService.uploadDocument(
        file,
        file.name,
        'Attached from Global Chat',
        'General',
        'private',
        Number(user.id),
        []
      )
      .then((uploadedDoc) => {
        setSelectedFiles((prev) => [...prev, file])
        setAttachedDocIds((prev) => [...prev, uploadedDoc.id])
        setIsUploading(false)
        toast.success(t.toasts.uploadSuccess || "File attached successfully!")
      })
      .catch((err) => {
        console.error("Failed to upload document from chat", err)
        setIsUploading(false)
        toast.error("Không thể tải tệp lên hệ thống.")
      })
    }
    e.target.value = ''
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast.error(t.aiChatbot.voiceNotSupported || "Voice input is not supported in this browser.")
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text && selectedFiles.length === 0) return

    const userMsgId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      { 
        id: userMsgId, 
        sender: 'user', 
        text,
        ...(selectedFiles.length > 0 ? { attachment: { name: selectedFiles.map(f => f.name).join(', ') } } : {})
      },
    ])
    setInputText('')
    
    const docIds = [...attachedDocIds]
    setSelectedFiles([])
    setAttachedDocIds([])

    setIsTyping(true)

    if (user?.id) {
      aiService.createOrGetChatSession(docIds, Number(user.id))
        .then((session) => {
          return aiService.sendMessage(session.id, text, selectedMode === 'Thinking')
        })
        .then((reply) => {
          setIsTyping(false)
          setMessages((prev) => [
            ...prev,
            {
              id: reply.id.toString(),
              sender: 'bot',
              text: reply.messageText,
              thought: reply.thought || undefined
            }
          ])
        })
        .catch((err) => {
          console.error("Failed to send message", err)
          setIsTyping(false)
          toast.error("Không thể kết nối với dịch vụ AI.")
        })
    } else {
      const delay = selectedMode === 'Thinking' ? 3200 : 1000

      setTimeout(() => {
        setIsTyping(false)
        let botResponse = t.aiChatbot.botResponseDefault
        
        const lowerText = text.toLowerCase()
        if (docIds.length > 0) {
          botResponse = `${t.aiChatbot.deepAnalysisRunning || "Neural Analyzer active!"}\n\nI have successfully scanned and indexed the attached file. I am ready to summarize, generate quiz questions, or answer deep-dive questions based on this material!`
        } else if (lowerText.includes('summarize') || lowerText.includes('notes') || lowerText.includes('tóm tắt') || lowerText.includes('요약') || lowerText.includes('要約')) {
          botResponse = t.aiChatbot.botResponseNotes
        } else if (lowerText.includes('quantum') || lowerText.includes('mechanics') || lowerText.includes('lượng tử') || lowerText.includes('양자') || lowerText.includes('量子')) {
          botResponse = t.aiChatbot.botResponseQuantum
        } else if (lowerText.includes('quiz') || lowerText.includes('generate') || lowerText.includes('kiểm tra') || lowerText.includes('퀴즈') || lowerText.includes('クイズ')) {
          botResponse = t.aiChatbot.botResponseQuiz
        }

        // Thinking log structure
        let thought: string | undefined = undefined
        if (selectedMode === 'Thinking') {
          thought = t.aiChatbot.listening === 'Đang nghe...' 
            ? `[1] Đang kích hoạt bộ suy luận Lumi Reasoning Engine...
[2] Đang phân tích ngữ cảnh người dùng: "${text}"
[3] Đang tìm kiếm tài liệu đối chiếu liên quan trong cơ sở dữ liệu...
[4] Đang tổng hợp các liên kết nhận thức để xây dựng phản hồi đầy đủ nhất.`
            : `[1] Triggering Lumi Reasoning Engine...
[2] Analyzing user query intent: "${text}"
[3] Querying relevant study modules and documents...
[4] Constructing optimized mental model and final reasoning response.`
        }

        setMessages((prev) => [
          ...prev,
          { 
            id: (Date.now() + 1).toString(), 
            sender: 'bot', 
            text: botResponse,
            thought 
          },
        ])
      }, delay)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, x: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-[90px] right-6 z-50 flex h-[600px] max-h-[calc(100vh-180px)] w-[calc(100vw-40px)] sm:w-[500px] flex-col overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-slate-800 dark:text-slate-100"
    >
      {/* Background Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 dark:from-blue-900/20 via-transparent to-transparent -z-10 pointer-events-none" />
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-4 text-slate-800 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm">
            <AIChatbotIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] tracking-tight">{t.aiChatbot.title}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 duration-1000"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">{t.admin.activeAdminGlow || "Online"}</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pl-5 pr-2 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex flex-col gap-5 pr-3 min-h-full">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-2 mt-2 text-center">
              <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center mb-5 shadow-sm">
                <AIChatbotIcon className="size-6 animate-float drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-[18px] mb-2 text-slate-800 dark:text-slate-100">{t.aiChatbot.title}</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 max-w-[280px]">
                {t.aiChatbot.selectSuggestion}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[420px]">
              {[
                { label: t.aiChatbot.summarizeRecentNotes, icon: <FileIcon className="size-3.5" /> },
                { label: t.aiChatbot.explainQuantum, icon: <Loader2 className="size-3.5" /> },
                { label: t.aiChatbot.generateQuiz, icon: <Loader2 className="size-3.5" /> },
                { label: t.sidebar.studyPlans || "Create my study plan", icon: <Loader2 className="size-3.5" /> }
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt.label)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-sm transition-all active:scale-[0.98]"
                >
                  <div className="text-blue-500 opacity-70">
                    {prompt.icon}
                  </div>
                  <span className="truncate">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
              {messages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-start gap-2 max-w-[92%]",
                      msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    {msg.sender === 'bot' && (
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 mt-0.5">
                        <AIChatbotIcon className="size-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-[20px] p-3.5 px-4 text-[14.5px] leading-relaxed shadow-sm border",
                        msg.sender === 'user'
                          ? "bg-gradient-to-tr from-blue-600 to-blue-500 text-white border-transparent rounded-tr-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700/50 rounded-tl-sm"
                      )}
                    >
                    {msg.attachment && (
                      <div className={cn(
                        "mb-2.5 flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold border",
                        msg.sender === 'user' ? "bg-white/10 border-white/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      )}>
                        <FileIcon className="size-4 shrink-0 text-blue-500" />
                        <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                      </div>
                    )}
                    
                    {/* Collapsible Deep Thinking Process Block */}
                    {msg.thought && (
                      <div className="mb-2.5 border-l-2 border-indigo-500/60 dark:border-indigo-500/40 pl-3 py-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-900/30 rounded-r-xl">
                        <details className="cursor-pointer group" open>
                          <summary className="flex items-center gap-2 list-none outline-none select-none text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-750 dark:hover:text-indigo-300">
                            <BrainCircuit className="size-3.5 text-indigo-500 animate-pulse shrink-0" />
                            <span>{t.aiChatbot.thinking || "Thinking Process"}</span>
                          </summary>
                          <div className="mt-2 text-[10.5px] leading-relaxed whitespace-pre-line text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800 pt-2 font-mono">
                            {msg.thought}
                          </div>
                        </details>
                      </div>
                    )}

                    <div className="whitespace-pre-line">{msg.text}</div>
                  </div>
                </motion.div>
              </div>
            ))}
            
            {/* Dynamic Typing & Reasoning Indicators */}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 max-w-[92%]">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 mt-0.5">
                  <AIChatbotIcon className="size-4" />
                </div>
                <div className="rounded-[20px] rounded-tl-sm p-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 shadow-sm min-w-[200px]">
                  {selectedMode === 'Thinking' ? (
                    <div className="flex flex-col gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="size-4 animate-pulse text-indigo-500" />
                        <span>{t.aiChatbot.thinking || "Thinking..."}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal italic">
                        {t.aiChatbot.listening === 'Đang nghe...' ? (
                          thinkingStep === 0 ? "Đang quét cơ sở dữ liệu tri thức..." :
                          thinkingStep === 1 ? "Đang đối chiếu các khái niệm học tập..." :
                          thinkingStep === 2 ? "Đang tổng hợp sơ đồ tư duy..." :
                          "Đang hoàn thiện phản hồi..."
                        ) : (
                          thinkingStep === 0 ? "Scanning knowledge base..." :
                          thinkingStep === 1 ? "Matching study concepts..." :
                          thinkingStep === 2 ? "Synthesizing mental map..." :
                          "Finalizing deep response..."
                        )}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 h-[18px]">
                      <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                      <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                      <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>
      </div>


      {/* Bottom Composer and Attachments */}
      <div className="bg-transparent p-4 pt-0 z-10 shrink-0">
        <div className="rounded-[24px] border border-slate-200 dark:border-slate-700/80 bg-white/60 dark:bg-slate-900/60 p-3 px-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-300 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-blue-400 dark:focus-within:border-blue-500/80 focus-within:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] z-10 relative flex flex-col gap-2">
          
          {/* Multiple Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800 text-xs font-semibold text-blue-600 dark:text-blue-400 max-w-[220px]">
                  <FileIcon className="size-3.5 shrink-0 text-blue-500" />
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
                      setAttachedDocIds((prev) => prev.filter((_, i) => i !== idx))
                    }}
                    className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload loading indicator */}
          {isUploading && (
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1 text-xs font-semibold text-blue-500 animate-pulse">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Scanning document vector chunks...</span>
            </div>
          )}
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? (t.aiChatbot.listening || "Listening...") : (t.aiChatbot.askAnything || "Ask anything...")}
            className="max-h-[120px] min-h-[24px] w-full resize-none bg-transparent px-1 py-1 text-[14px] leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
            rows={1}
          />

          {/* Actions inside composer */}
          <div className="flex items-center justify-between pt-2">
            
            {/* Left Actions */}
            <div className="flex items-center gap-1.5">
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleLocalFileChange}
                accept=".pdf"
              />
              
              {/* Direct file upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title={t.aiChatbot.attachFiles || "Attach File"}
              >
                <Paperclip className="size-4.5" />
              </button>

              {/* Fully functional Mic audio voice input */}
              <button
                type="button"
                onClick={handleMicClick}
                className={cn(
                  "size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer border border-transparent",
                  isListening 
                    ? "text-rose-500 bg-rose-500/10 animate-pulse border-rose-500/30 hover:bg-rose-500/20" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
                title={t.aiChatbot.voiceInput || "Voice input"}
              >
                <Mic className="size-4.5" />
              </button>

              {/* Tức Thì / Mode Selector */}
              <div className="relative ml-1" ref={modeDropdownRef}>
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
                      type="button"
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
                      type="button"
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

            {/* Right Action: Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() && selectedFiles.length === 0}
              className={cn(
                "size-8 shrink-0 flex items-center justify-center rounded-full transition-all cursor-pointer",
                (inputText.trim() || selectedFiles.length > 0)
                  ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-650 cursor-not-allowed border dark:border-slate-800"
              )}
            >
              <Send className="size-3.5 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

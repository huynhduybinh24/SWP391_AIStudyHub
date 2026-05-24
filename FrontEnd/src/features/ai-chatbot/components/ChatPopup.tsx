import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X, Paperclip, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'

const AIChatbotIcon = ({ className, ...props }: any) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
    <defs>
      <linearGradient id="ai-bot-body" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="1" stopColor="#e0e7ff" />
      </linearGradient>
      <linearGradient id="ai-bot-face" x1="6" y1="8" x2="18" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="1" stopColor="#1e293b" />
      </linearGradient>
      <filter id="ai-bot-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="ai-bot-shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
      </filter>
    </defs>
    <rect x="3" y="6" width="18" height="14" rx="5" fill="url(#ai-bot-body)" filter="url(#ai-bot-shadow)" />
    <rect x="5.5" y="8.5" width="13" height="9" rx="3" fill="url(#ai-bot-face)" />
    <circle cx="9.5" cy="13" r="1.8" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <circle cx="14.5" cy="13" r="1.8" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <path d="M7.5 10.5h1.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M15 10.5h1.5" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M12 6V2.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="2" r="1.2" fill="#38bdf8" filter="url(#ai-bot-glow)" />
    <path d="M3 11c-1 0-1.5 1-1.5 2s.5 2 1.5 2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M21 11c1 0 1.5 1 1.5 2s-.5 2-1.5 2" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  attachment?: {
    name: string
  }
}

interface ChatPopupProps {
  onClose: () => void
}

export function ChatPopup({ onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm your AI Study Assistant. How can I help you today?",
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text && !selectedFile) return

    const userMsgId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      { 
        id: userMsgId, 
        sender: 'user', 
        text,
        ...(selectedFile ? { attachment: { name: selectedFile.name } } : {})
      },
    ])
    setInputText('')
    const hasFile = !!selectedFile;
    setSelectedFile(null)

    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      let botResponse = "I've analyzed your query. Let's break this down together!"
      
      const lowerText = text.toLowerCase()
      if (hasFile) {
        botResponse = "I've received your file. I am analyzing it now. Let me know if you have specific questions about its contents!"
      } else if (lowerText.includes('summarize')) {
        botResponse = "Here is a structured summary of your recent notes:\n\n1. Point 1\n2. Point 2\n3. Point 3"
      } else if (lowerText.includes('quantum')) {
        botResponse = "Quantum Mechanics is the branch of physics dealing with atomic scales..."
      } else if (lowerText.includes('quiz')) {
        botResponse = "Here is a quick quiz to test your understanding:\n\nWhat is X?\nA) Y\nB) Z"
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: botResponse },
      ])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-[85px] right-[20px] z-50 flex h-[450px] max-h-[calc(100vh-115px)] w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all duration-300 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[#3155F6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <AIChatbotIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px]">AI Assistant</h3>
            <p className="text-xs text-white/80">Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-2 max-w-[85%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {msg.sender === 'bot' && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30">
                <AIChatbotIcon className="size-4 text-[#3155F6]" />
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl p-3 text-[14px] leading-relaxed shadow-sm whitespace-pre-line",
                msg.sender === 'user'
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none"
              )}
            >
              {msg.attachment && (
                <div className={cn(
                  "mb-2 flex items-center gap-2 rounded-lg p-2 text-xs font-medium",
                  msg.sender === 'user' ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                )}>
                  <FileIcon className="size-4 shrink-0" />
                  <span className="truncate">{msg.attachment.name}</span>
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30">
              <AIChatbotIcon className="size-4 text-[#3155F6]" />
            </div>
            <div className="rounded-2xl rounded-tl-none p-3 text-[14px] bg-slate-100 dark:bg-slate-800 text-[#737686] dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#3155F6]" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        {selectedFile && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-[#3155F6]/20 dark:border-blue-900/30 bg-[#e5eeff]/50 dark:bg-blue-950/30 px-3 py-2 text-sm text-[#3155F6] dark:text-blue-400">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileIcon className="size-4 shrink-0" />
              <span className="truncate font-medium">{selectedFile.name}</span>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="ml-2 rounded-full p-1 hover:bg-[#3155F6]/10"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 focus-within:border-[#3155F6]/40 focus-within:ring-1 focus-within:ring-[#3155F6]/40">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0])
              }
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Attach File"
          >
            <Paperclip className="size-4.5" />
          </button>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-[100px] min-h-[36px] w-full resize-none bg-transparent py-1.5 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim() && !selectedFile}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3155F6] text-white transition-all hover:bg-[#2563eb] disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

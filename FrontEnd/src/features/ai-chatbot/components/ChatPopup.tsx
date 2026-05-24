import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X, Paperclip, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'
import { AIChatbotIcon } from '@/components/layout/FloatingAssistantButton'
import { motion } from 'framer-motion'

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
    <motion.div 
      initial={{ opacity: 0, y: 30, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, x: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-[85px] right-[20px] z-50 flex h-[480px] max-h-[calc(100vh-115px)] w-[380px] flex-col overflow-hidden rounded-[24px] border border-white/40 dark:border-slate-700/50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] text-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-white/20 shadow-inner">
            <AIChatbotIcon className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] tracking-tight">AI Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <p className="text-[11px] font-medium text-white/90">Online</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/20 transition-colors"
        >
          <X className="size-4.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={cn(
              "flex items-end gap-2.5 max-w-[85%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {msg.sender === 'bot' && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                <AIChatbotIcon className="size-4" />
              </div>
            )}
            <div
              className={cn(
                "rounded-[20px] p-3.5 text-[14px] leading-relaxed shadow-sm whitespace-pre-line border",
                msg.sender === 'user'
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent rounded-br-sm"
                  : "bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-200 border-slate-200/50 dark:border-slate-700/50 rounded-bl-sm"
              )}
            >
              {msg.attachment && (
                <div className={cn(
                  "mb-2.5 flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold",
                  msg.sender === 'user' ? "bg-white/15 border border-white/20" : "bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                )}>
                  <FileIcon className="size-4 shrink-0" />
                  <span className="truncate">{msg.attachment.name}</span>
                </div>
              )}
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2.5 max-w-[85%]">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
              <AIChatbotIcon className="size-4" />
            </div>
            <div className="rounded-[20px] rounded-bl-sm p-3.5 px-4 text-[14px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 shadow-sm">
              <Loader2 className="size-4 animate-spin text-blue-500" />
              <span className="text-slate-500 dark:text-slate-400 font-medium">Thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="bg-transparent p-4 pt-0">
        <div className="relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          {selectedFile && (
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2 text-xs font-medium bg-blue-50/50 dark:bg-blue-900/20 rounded-t-2xl">
              <div className="flex items-center gap-2 overflow-hidden text-blue-600 dark:text-blue-400">
                <FileIcon className="size-3.5 shrink-0" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="ml-2 rounded-full p-1 hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end px-2 py-2">
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
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-0.5"
              title="Attach File"
            >
              <Paperclip className="size-4.5" />
            </button>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Assistant..."
              className="max-h-[120px] min-h-[40px] w-full resize-none bg-transparent px-2 py-2.5 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none scrollbar-thin scrollbar-thumb-slate-200"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !selectedFile}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none mb-0.5"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

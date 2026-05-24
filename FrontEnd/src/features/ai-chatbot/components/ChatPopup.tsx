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
  const [messages, setMessages] = useState<Message[]>([])
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
      className="fixed bottom-[90px] right-6 z-50 flex h-[600px] max-h-[calc(100vh-100px)] w-[calc(100vw-40px)] sm:w-[500px] flex-col overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] text-slate-800 dark:text-slate-100"
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
            <h3 className="font-semibold text-[15px] tracking-tight">AI Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 duration-1000"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">Online</p>
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
              <h3 className="font-bold text-[18px] mb-2 text-slate-800 dark:text-slate-100">How can I help you today?</h3>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mb-8 max-w-[280px]">
                Ask me anything about your studies, or choose a prompt below to get started.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[420px]">
              {[
                { label: "Create my study plan", icon: <Loader2 className="size-3.5" /> }, // Replace with FileText if available
                { label: "Summarize my files", icon: <FileIcon className="size-3.5" /> },
                { label: "Generate quiz questions", icon: <Loader2 className="size-3.5" /> },
                { label: "Explain this topic", icon: <Loader2 className="size-3.5" /> }
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(prompt.label)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm text-[12.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-sm transition-all"
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
                        "rounded-[20px] p-3.5 px-4 text-[14.5px] leading-relaxed shadow-sm whitespace-pre-line border",
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
                        <FileIcon className="size-4 shrink-0" />
                        <span className="truncate">{msg.attachment.name}</span>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              </div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 max-w-[92%]">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/50 mt-0.5">
                  <AIChatbotIcon className="size-4" />
                </div>
                <div className="rounded-[20px] rounded-tl-sm px-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 h-[42px] shadow-sm">
                  <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                  <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                  <div className="size-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>
      </div>


      {/* Input */}
      <div className="bg-transparent p-4 pt-0 z-10">
        <div className="relative flex flex-col rounded-[20px] border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shadow-inner focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all duration-300">
          {selectedFile && (
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
              <div className="flex items-center gap-2 overflow-hidden text-blue-600 dark:text-blue-400">
                <FileIcon className="size-3.5 shrink-0" />
                <span className="truncate">{selectedFile.name}</span>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="ml-2 rounded-full p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-0.5"
              title="Attach File"
            >
              <Paperclip className="size-4.5" />
            </button>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AI Assistant..."
              className="max-h-[120px] min-h-[40px] w-full resize-none bg-transparent px-2 py-2.5 text-[14px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() && !selectedFile}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:bg-blue-600 mb-0.5"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

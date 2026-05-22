import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, X, Paperclip, FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/uiStore'

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
    <div className="fixed bottom-[90px] right-[20px] z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[#3155F6] p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-white/20">
            <Bot className="size-5" />
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
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-2 max-w-[85%]",
              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            {msg.sender === 'bot' && (
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] border border-[#3155f6]/10">
                <Bot className="size-4 text-[#3155F6]" />
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl p-3 text-[14px] leading-relaxed shadow-sm whitespace-pre-line",
                msg.sender === 'user'
                  ? "bg-[#3155F6] text-white rounded-tr-none"
                  : "bg-white text-[#434655] border border-border/60 rounded-tl-none"
              )}
            >
              {msg.attachment && (
                <div className={cn(
                  "mb-2 flex items-center gap-2 rounded-lg p-2 text-xs font-medium",
                  msg.sender === 'user' ? "bg-white/20" : "bg-slate-100"
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
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] border border-[#3155f6]/10">
              <Bot className="size-4 text-[#3155F6]" />
            </div>
            <div className="rounded-2xl rounded-tl-none p-3 text-[14px] bg-white text-[#737686] border border-border/60 flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-[#3155F6]" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-white p-3">
        {selectedFile && (
          <div className="mb-2 flex items-center justify-between rounded-lg border border-[#3155F6]/20 bg-[#e5eeff]/50 px-3 py-2 text-sm text-[#3155F6]">
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
        <div className="flex items-end gap-2 rounded-xl border border-border/60 bg-slate-50 p-2 focus-within:border-[#3155F6]/40 focus-within:ring-1 focus-within:ring-[#3155F6]/40">
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
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            title="Attach File"
          >
            <Paperclip className="size-4.5" />
          </button>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-[100px] min-h-[36px] w-full resize-none bg-transparent py-1.5 text-[14px] outline-none"
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

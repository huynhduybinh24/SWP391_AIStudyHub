import React, { useRef, useEffect } from 'react'
import { Bot, Send, Sparkle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface ChatMessage {
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

interface AskAIAssistantPanelProps {
  fileName: string
  chatLog: ChatMessage[]
  onSendMessage: (text: string) => void
  isAiResponding: boolean
  aiTypingText: string
  isScanning: boolean
  scanProgress: number
  scanStep: string
  onDeepAnalysis: () => void
  suggestedPrompt?: string
}

export function AskAIAssistantPanel({
  fileName,
  chatLog,
  onSendMessage,
  isAiResponding,
  aiTypingText,
  isScanning,
  scanProgress,
  scanStep,
  onDeepAnalysis,
  suggestedPrompt = 'Explain the key summary and objectives of this document.'
}: AskAIAssistantPanelProps) {
  const [chatInput, setChatInput] = React.useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)
  const { t } = useTranslation()

  // Scroll chat to bottom when logs update
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog, aiTypingText])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isAiResponding || isScanning) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  const handleChipClick = () => {
    if (isAiResponding || isScanning) return
    onSendMessage(suggestedPrompt)
  }

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6 flex flex-col relative overflow-hidden"
      aria-label="AI Assistant"
    >
      {/* Header titles */}
      <div className="flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 dark:bg-slate-800 p-2 rounded-xl text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/20 dark:border-slate-700">
            <Bot className="h-4 w-4" />
          </div>
          <h3 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm tracking-wide">
            {t.fileViewer.askAI || "Ask AI Assistant"}
          </h3>
        </div>
        <Sparkle className="h-4 w-4 text-blue-500 animate-pulse" />
      </div>

      {/* Deep scanning analysis banner & progress */}
      {isScanning ? (
        <div className="bg-blue-50/70 border border-blue-100 dark:bg-slate-800/40 dark:border-slate-750 p-4 rounded-2xl space-y-3 animate-fade-in">
          <div className="flex justify-between items-center text-xs font-bold text-blue-800 dark:text-blue-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" />
              {t.fileViewer.neuralAnalyzerRunning || "Running Neural Analyzer..."}
            </span>
            <span>{scanProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          <p className="text-[10px] text-blue-600/90 dark:text-blue-450 font-medium italic truncate">
            {scanStep}
          </p>
        </div>
      ) : (
        /* Static Prompt Suggestion Chip */
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleChipClick}
            disabled={isAiResponding || isScanning}
            className="w-full text-left bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-200 hover:bg-blue-50/40 dark:hover:border-blue-800/50 dark:hover:bg-slate-700 p-3.5 rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-750 dark:hover:text-blue-400 transition-all duration-200 shadow-sm leading-normal flex items-start gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="truncate">{suggestedPrompt}</span>
          </button>
        </div>
      )}

      {/* Chat Response Area container */}
      <div className="border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-4 h-[210px] overflow-y-auto space-y-3.5 scrollbar-thin">
        {chatLog.map((chat, idx) => (
          <div
            key={idx}
            className={cn(
              "flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-normal shadow-sm",
              chat.sender === 'user'
                ? "bg-blue-600 text-white ml-auto rounded-tr-none"
                : "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-200 border border-slate-100 dark:border-slate-800 mr-auto rounded-tl-none"
            )}
          >
            <p className="whitespace-pre-line font-medium break-words">{chat.text}</p>
            <span className={cn(
              "text-[8px] mt-1.5 self-end opacity-70",
              chat.sender === 'user' ? "text-blue-100" : "text-slate-400 dark:text-slate-500"
            )}>
              {chat.timestamp}
            </span>
          </div>
        ))}

        {/* Typing simulation view */}
        {isAiResponding && aiTypingText && (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 flex flex-col max-w-[85%] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs mr-auto shadow-sm animate-pulse">
            <p className="whitespace-pre-line font-medium break-words">{aiTypingText}</p>
            <span className="text-[8px] mt-1.5 text-slate-400 dark:text-slate-500 self-end">{t.aiChatbot.typing}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat message form input */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder={t.aiChatbot.placeholder || "Ask AI anything..."}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          disabled={isAiResponding || isScanning}
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!chatInput.trim() || isAiResponding || isScanning}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shrink-0 flex items-center justify-center cursor-pointer"
          aria-label="Send Message to AI"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* Lightning Primary Scanner Button */}
      <Button
        variant="secondary"
        onClick={onDeepAnalysis}
        disabled={isScanning || isAiResponding}
        className="w-full bg-blue-50 border border-blue-100 dark:bg-slate-800 dark:border-slate-700 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-650 dark:text-blue-450 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm text-xs transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4 animate-pulse" />
        {t.fileViewer.analyzeDoc}
      </Button>
    </div>
  )
}

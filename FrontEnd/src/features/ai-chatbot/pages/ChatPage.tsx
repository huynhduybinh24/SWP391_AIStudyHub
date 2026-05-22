import { useState, useRef, useEffect } from 'react'
import { Bot, FileText, FlaskConical, FileQuestion, Paperclip, Mic, Send, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  time?: string
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hello! I'm your AI Study Assistant. How can I help you with your studies today?",
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text) return

    // Add user message
    const userMsgId = Date.now().toString()
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text,
      },
    ])
    setInputText('')

    // Simulate bot response
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      let botResponse = "I've analyzed your query. Let's break this down together to master the concept!"
      
      const lowerText = text.toLowerCase()
      if (lowerText.includes('summarize') || lowerText.includes('notes')) {
        botResponse = "Here is a structured summary of your recent notes:\n\n**Topic: Quantum Physics Foundations**\n\n1. **Wave-Particle Duality**: Matter and light exhibit both wave-like and particle-like properties (e.g., photo-electric effect).\n2. **Quantization of Energy**: Energy is emitted or absorbed in discrete packets called quanta ($E = hf$).\n3. **Schrödinger Equation**: Describes how the quantum state of a physical system changes with time.\n\n*Would you like me to generate a quick practice quiz based on these points?*"
      } else if (lowerText.includes('quantum') || lowerText.includes('mechanics')) {
        botResponse = "Quantum Mechanics is the branch of physics dealing with the behavior of matter and light on the atomic and subatomic scale. It attempts to describe and account for the properties of molecules and atoms and their constituents—electrons, protons, neutrons, and other more esoteric particles.\n\n**Key Postulates:**\n- **Superposition**: A system can exist in multiple states simultaneously until it is measured.\n- **Entanglement**: Particles can become correlated such that the state of one instantaneously influences the other, regardless of distance.\n- **Heisenberg Uncertainty Principle**: It is impossible to simultaneously know both the precise position and momentum of a particle."
      } else if (lowerText.includes('quiz') || lowerText.includes('generate')) {
        botResponse = "Here is a quick quiz to test your understanding:\n\n**Question**: Which principle states that it is impossible to simultaneously know both the exact position and momentum of a particle?\n\n- **A)** Wave-particle duality\n- **B)** Heisenberg Uncertainty Principle\n- **C)** Quantum Superposition\n- **D)** Quantum Entanglement\n\n*Reply with A, B, C, or D to check your answer!*"
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
        },
      ])
    }, 1200)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-220px)] justify-between select-none">
      {/* Top Header section */}
      <div>
        <h1 className="text-[26px] font-bold text-[#0b1c30] dark:text-white tracking-tight mb-1">
          AI Study Assistant
        </h1>
        <p className="text-[15px] font-medium text-[#737686] dark:text-slate-400">
          Select a suggestion or type your question below.
        </p>

        {/* Chat Workspace */}
        <div className="mt-8 flex flex-col gap-6">
          {/* New Chat Started Badge */}
          <div className="flex justify-center">
            <span className="rounded-full bg-[#e5eeff] dark:bg-blue-950/40 px-4 py-1.5 text-xs font-semibold text-[#3155F6] dark:text-blue-400 tracking-wide shadow-[0_1px_2px_rgba(49,85,246,0.05)]">
              New Chat Started
            </span>
          </div>

          {/* Messages List */}
          <div className="flex flex-col gap-5 overflow-y-auto max-h-[480px] pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-start gap-3.5 transition-all duration-300",
                  msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar Icon */}
                {msg.sender === 'bot' ? (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30 shadow-sm">
                    <Bot className="size-4.5 text-[#3155F6] dark:text-blue-400" />
                  </div>
                ) : (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3155F6] dark:bg-blue-600 border border-[#3155f6]/20 dark:border-blue-700 shadow-sm">
                    <User className="size-4.5 text-white" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl p-4 text-[14.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] border whitespace-pre-line",
                    msg.sender === 'user'
                      ? "bg-[#3155F6] dark:bg-blue-600 text-white border-transparent rounded-tr-none"
                      : "bg-white dark:bg-slate-900 text-[#434655] dark:text-slate-200 border-border/60 dark:border-slate-800 rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Thinking / Typing State Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] dark:bg-blue-950/40 border border-[#3155f6]/10 dark:border-blue-900/30 shadow-sm">
                  <Bot className="size-4.5 text-[#3155F6] dark:text-blue-400" />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tl-none p-4 text-[14.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] border bg-white dark:bg-slate-900 text-[#737686] dark:text-slate-400 border-border/60 dark:border-slate-800 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-[#3155F6] dark:text-blue-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Suggestion Buttons & Chat Input */}
      <div className="mt-8">
        {/* Suggestion Buttons */}
        <div className="mb-5 flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => handleSend("Summarize recent notes")}
            className="flex items-center gap-2 rounded-full border border-border/70 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#434655] dark:text-slate-350 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/30 dark:hover:border-blue-500/30 hover:shadow-sm cursor-pointer"
          >
            <FileText className="size-4 text-[#737686] dark:text-slate-400" />
            Summarize recent notes
          </button>
          <button
            type="button"
            onClick={() => handleSend("Explain Quantum Mechanics")}
            className="flex items-center gap-2 rounded-full border border-border/70 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#434655] dark:text-slate-350 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/30 dark:hover:border-blue-500/30 hover:shadow-sm cursor-pointer"
          >
            <FlaskConical className="size-4 text-[#737686] dark:text-slate-400" />
            Explain Quantum Mechanics
          </button>
          <button
            type="button"
            onClick={() => handleSend("Generate Quiz")}
            className="flex items-center gap-2 rounded-full border border-border/70 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-[#434655] dark:text-slate-350 shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#3155F6]/30 dark:hover:border-blue-500/30 hover:shadow-sm cursor-pointer"
          >
            <FileQuestion className="size-4 text-[#737686] dark:text-slate-400" />
            Generate Quiz
          </button>
        </div>

        {/* Sleek Chat Input Container */}
        <div className="rounded-2xl border-2 border-[#e5eeff] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#3155F6]/40 dark:focus-within:border-blue-500/40 focus-within:shadow-[0_2px_16px_rgba(49,85,246,0.06)] dark:focus-within:shadow-[0_2px_16px_rgba(59,130,246,0.1)]">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0b1c30] dark:text-white outline-none placeholder:text-[#737686]/60 dark:placeholder:text-slate-500"
            placeholder="Ask your study assistant anything..."
          />
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100/50 dark:border-slate-800/50 pt-2.5">
            {/* Attachment and Mic Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Attach Files"
              >
                <Paperclip className="size-5" />
              </button>
              <button
                type="button"
                className="text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Voice Input"
              >
                <Mic className="size-5" />
              </button>
            </div>

            {/* Circular Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              className="flex size-10 items-center justify-center rounded-xl bg-[#3155F6] dark:bg-blue-600 text-white shadow-sm transition-all hover:bg-[#2563eb] dark:hover:bg-blue-500 hover:scale-105 active:scale-95 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              disabled={!inputText.trim()}
              title="Send Message"
            >
              <Send className="size-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

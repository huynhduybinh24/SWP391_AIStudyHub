import { useState, useRef, useEffect } from 'react'
import { Bot, FileText, FlaskConical, FileQuestion, Paperclip, Mic, Send, Loader2, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  time?: string
  files?: Array<{ name: string; size: string }>
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

  // --- Selected Files State ---
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // --- Voice Input State ---
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

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
      setVoiceError("Voice input is not supported in this browser.")
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        if (transcript) {
          setInputText((prev) => prev + (prev ? ' ' : '') + transcript)
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
      setFileError("You can attach up to 3 files.")
      return
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.png', '.jpg', '.jpeg']
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB

    for (const file of filesArray) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!allowedExtensions.includes(extension)) {
        setFileError("Unsupported file type.")
        return
      }
      if (file.size > maxSizeBytes) {
        setFileError("File size must be less than 10MB.")
        return
      }
    }

    setSelectedFiles((prev) => [...prev, ...filesArray])
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    const filesToSend = textToSend ? [] : selectedFiles

    if (!text && filesToSend.length === 0) return

    // Add user message
    const userMsgId = Date.now().toString()
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      files: filesToSend.map((file) => ({
        name: file.name,
        size: formatFileSize(file.size),
      })),
    }

    setMessages((prev) => [...prev, newUserMsg])
    setInputText('')
    setSelectedFiles([])
    setFileError(null)

    // Simulate bot response after 500ms
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      let botResponse = "I received your message. How else can I help with your studies?"

      if (newUserMsg.files && newUserMsg.files.length > 0) {
        botResponse = "I've received your attached file(s). I can help summarize, explain, or create a quiz from them."
      } else {
        const lowerText = text.toLowerCase()
        if (lowerText.includes('summarize') || lowerText.includes('notes')) {
          botResponse = "Here is a structured summary of your recent notes:\n\n**Topic: Quantum Physics Foundations**\n\n1. **Wave-Particle Duality**: Matter and light exhibit both wave-like and particle-like properties (e.g., photo-electric effect).\n2. **Quantization of Energy**: Energy is emitted or absorbed in discrete packets called quanta ($E = hf$).\n3. **Schrödinger Equation**: Describes how the quantum state of a physical system changes with time.\n\n*Would you like me to generate a quick practice quiz based on these points?*"
        } else if (lowerText.includes('quantum') || lowerText.includes('mechanics')) {
          botResponse = "Quantum Mechanics is the branch of physics dealing with the behavior of matter and light on the atomic and subatomic scale. It attempts to describe and account for the properties of molecules and atoms and their constituents—electrons, protons, neutrons, and other more esoteric particles.\n\n**Key Postulates:**\n- **Superposition**: A system can exist in multiple states simultaneously until it is measured.\n- **Entanglement**: Particles can become correlated such that the state of one instantaneously influences the other, regardless of distance.\n- **Heisenberg Uncertainty Principle**: It is impossible to simultaneously know both the precise position and momentum of a particle."
        } else if (lowerText.includes('quiz') || lowerText.includes('generate')) {
          botResponse = "Here is a quick quiz to test your understanding:\n\n**Question**: Which principle states that it is impossible to simultaneously know both the exact position and momentum of a particle?\n\n- **A)** Wave-particle duality\n- **B)** Heisenberg Uncertainty Principle\n- **C)** Quantum Superposition\n- **D)** Quantum Entanglement\n\n*Reply with A, B, C, or D to check your answer!*"
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: botResponse,
        },
      ])
    }, 500)
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
        <h1 className="text-[26px] font-bold text-[#0b1c30] tracking-tight mb-1">
          AI Study Assistant
        </h1>
        <p className="text-[15px] font-medium text-[#737686]">
          Select a suggestion or type your question below.
        </p>

        {/* Chat Workspace */}
        <div className="mt-8 flex flex-col gap-6">
          {/* New Chat Started Badge */}
          <div className="flex justify-center">
            <span className="rounded-full bg-[#e5eeff] px-4 py-1.5 text-xs font-semibold text-[#3155F6] tracking-wide shadow-[0_1px_2px_rgba(49,85,246,0.05)]">
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
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] border border-[#3155f6]/10 shadow-sm">
                    <Bot className="size-4.5 text-[#3155F6]" />
                  </div>
                ) : (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3155F6] border border-[#3155f6]/20 shadow-sm">
                    <User className="size-4.5 text-white" />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl p-4 text-[14.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] border whitespace-pre-line flex flex-col gap-2",
                    msg.sender === 'user'
                      ? "bg-[#3155F6] text-white border-transparent rounded-tr-none"
                      : "bg-white text-[#434655] border-border/60 rounded-tl-none"
                  )}
                >
                  {msg.text && <div>{msg.text}</div>}
                  {msg.files && msg.files.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1 border-t border-white/20 pt-2 shrink-0">
                      {msg.files.map((file, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium border",
                            msg.sender === 'user'
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
              </div>
            ))}

            {/* Thinking / Typing State Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3.5">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5eeff] border border-[#3155f6]/10 shadow-sm">
                  <Bot className="size-4.5 text-[#3155F6]" />
                </div>
                <div className="max-w-[75%] rounded-2xl rounded-tl-none p-4 text-[14.5px] leading-relaxed shadow-[0_2px_8px_rgba(0,0,0,0.02)] border bg-white text-[#737686] border-border/60 flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-[#3155F6]" />
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
            className="flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-2.5 text-sm font-medium text-[#434655] shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 hover:border-[#3155F6]/30 hover:shadow-sm cursor-pointer"
          >
            <FileText className="size-4 text-[#737686]" />
            Summarize recent notes
          </button>
          <button
            type="button"
            onClick={() => handleSend("Explain Quantum Mechanics")}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-2.5 text-sm font-medium text-[#434655] shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 hover:border-[#3155F6]/30 hover:shadow-sm cursor-pointer"
          >
            <FlaskConical className="size-4 text-[#737686]" />
            Explain Quantum Mechanics
          </button>
          <button
            type="button"
            onClick={() => handleSend("Generate Quiz")}
            className="flex items-center gap-2 rounded-full border border-border/70 bg-white px-4 py-2.5 text-sm font-medium text-[#434655] shadow-[0_2px_6px_rgba(0,0,0,0.02)] transition-all hover:bg-slate-50 hover:border-[#3155F6]/30 hover:shadow-sm cursor-pointer"
          >
            <FileQuestion className="size-4 text-[#737686]" />
            Generate Quiz
          </button>
        </div>

        {/* Sleek Chat Input Container */}
        <div className="rounded-2xl border-2 border-[#e5eeff] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all focus-within:border-[#3155F6]/40 focus-within:shadow-[0_2px_16px_rgba(49,85,246,0.06)]">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.png,.jpg,.jpeg"
            className="hidden"
          />

          {/* File/Voice Error display */}
          {fileError && (
            <div className="mb-2 text-xs font-semibold text-red-500">
              {fileError}
            </div>
          )}
          {voiceError && (
            <div className="mb-2 text-xs font-semibold text-red-500">
              {voiceError}
            </div>
          )}

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  <FileText className="size-3.5 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">({formatFileSize(file.size)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-200/50 transition-colors cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0b1c30] outline-none placeholder:text-[#737686]/60"
            placeholder="Ask your study assistant anything..."
          />
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-100/50 pt-2.5">
            {/* Attachment and Mic Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAttachClick}
                className="text-[#737686] hover:text-[#3155F6] p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                title="Attach Files"
              >
                <Paperclip className="size-5" />
              </button>
              <button
                type="button"
                onClick={handleMicClick}
                className={cn(
                  "text-[#737686] hover:text-[#3155F6] p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer relative flex items-center gap-1.5",
                  isListening && "text-red-500 hover:text-red-650 bg-red-50 hover:bg-red-100"
                )}
                title="Voice Input"
              >
                <Mic className={cn("size-5", isListening && "animate-pulse")} />
                {isListening && <span className="text-xs font-semibold">Listening...</span>}
              </button>
            </div>

            {/* Circular Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              className="flex size-10 items-center justify-center rounded-xl bg-[#3155F6] text-white shadow-sm transition-all hover:bg-[#2563eb] hover:scale-105 active:scale-95 cursor-pointer disabled:pointer-events-none disabled:opacity-50"
              disabled={!inputText.trim() && selectedFiles.length === 0}
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

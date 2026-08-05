import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Send, Bot, User, Loader2, Copy, RefreshCw, Sparkles,
  FileText, Lightbulb, AlertTriangle, Plus, PanelLeftOpen
} from 'lucide-react'
import { motion } from 'framer-motion'
import { aiService, AiChatMessageResponse } from '@/services/aiService'
import { useAiWorkspaceStore } from '@/stores/aiWorkspaceStore'
import { useToast } from '@/components/ui/Toast'
import { mapAiErrorCodeToMessage } from '@/utils/aiErrorMapper'
import { SourceCitationsView } from '../SourceCitationsView'
import { MarkdownRenderer } from '../../pages/ChatPage'

// Helper to sanitize any raw XML thoughts or reasoning wrappers if returned by API
function sanitizeMessageText(text: string): string {
  if (!text) return ''
  return text.replace(/<thought>[\s\S]*?<\/thought>/gi, '').trim()
}

export function TabChatbot() {
  const toast = useToast()
  const {
    selectedDocumentIds,
    activeSessionId,
    setActiveSessionId,
    isSidebarOpen,
    toggleSidebar,
  } = useAiWorkspaceStore()

  const [messages, setMessages] = useState<AiChatMessageResponse[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionDocIdsSnapshot, setSessionDocIdsSnapshot] = useState<number[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Lazy load history if activeSessionId changes
  useEffect(() => {
    if (activeSessionId && activeSessionId > 0) {
      const fetchHistory = async () => {
        try {
          const history = await aiService.getChatHistory(activeSessionId)
          setMessages(history)
          // Store snapshot of currently selected documents for stale warning check
          setSessionDocIdsSnapshot([...selectedDocumentIds])
        } catch (err) {
          toast.error(mapAiErrorCodeToMessage(err))
        }
      }
      fetchHistory()
    } else {
      setMessages([])
    }
  }, [activeSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Check if session context is stale
  const isStaleContext = useMemo(() => {
    if (messages.length === 0 || sessionDocIdsSnapshot.length === 0) return false
    const currentSorted = [...selectedDocumentIds].sort().join(',')
    const snapshotSorted = [...sessionDocIdsSnapshot].sort().join(',')
    return currentSorted !== snapshotSorted
  }, [messages.length, selectedDocumentIds, sessionDocIdsSnapshot])

  const handleStartNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setSessionDocIdsSnapshot([...selectedDocumentIds])
  }

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim()
    if (!text) return

    if (selectedDocumentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 tài liệu để bắt đầu phân tích AI.')
      return
    }

    const tempUserMsg: AiChatMessageResponse = {
      id: Date.now(),
      sessionId: activeSessionId || 0,
      sender: 'USER',
      messageText: text,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, tempUserMsg])
    setInput('')
    setIsTyping(true)

    try {
      let currentSessionId = activeSessionId
      if (!currentSessionId) {
        const session = await aiService.createOrGetChatSession(selectedDocumentIds, 0)
        currentSessionId = session.id
        setActiveSessionId(currentSessionId)
        setSessionDocIdsSnapshot([...selectedDocumentIds])
      }

      const reply = await aiService.sendMessage(currentSessionId, text, false)
      setMessages((prev) => [...prev, reply])
    } catch (err: any) {
      console.error('Chat error:', err)
      toast.error(mapAiErrorCodeToMessage(err))
      const errorBotMsg: AiChatMessageResponse = {
        id: Date.now() + 1,
        sessionId: activeSessionId || 0,
        sender: 'AI',
        messageText: 'Rất tiếc, không thể phản hồi câu hỏi của bạn. Vui lòng kiểm tra lại tài liệu và thử lại.',
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorBotMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast.success('Đã sao chép nội dung!')
  }

  const handleRegenerate = async (idx: number) => {
    if (idx === 0) return
    const prevMsg = messages[idx - 1]
    if (prevMsg && prevMsg.sender === 'USER') {
      const sliced = messages.slice(0, idx)
      setMessages(sliced)
      setIsTyping(true)

      try {
        let currentSessionId = activeSessionId
        if (!currentSessionId) {
          const session = await aiService.createOrGetChatSession(selectedDocumentIds, 0)
          currentSessionId = session.id
          setActiveSessionId(currentSessionId)
          setSessionDocIdsSnapshot([...selectedDocumentIds])
        }
        const reply = await aiService.sendMessage(currentSessionId, prevMsg.messageText, false)
        setMessages((prev) => [...prev, reply])
      } catch (err) {
        toast.error(mapAiErrorCodeToMessage(err))
      } finally {
        setIsTyping(false)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/40 dark:bg-slate-950/20">
      {/* ── Subheader Controls ── */}
      <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between bg-white/60 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <button
              id="open-doc-sidebar-btn"
              onClick={toggleSidebar}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
              title="Mở chọn tài liệu"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          )}
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Trợ lý Trò chuyện AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">
            {selectedDocumentIds.length} tài liệu đang liên kết
          </span>
          {activeSessionId && (
            <button
              id="new-chat-session-btn"
              onClick={handleStartNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Hội thoại mới</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Stale Context Warning Banner ── */}
      {isStaleContext && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/40 px-4 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="size-4 text-amber-600 shrink-0" />
            <span>Danh sách tài liệu đã thay đổi. Kết quả này thuộc ngữ cảnh trước đó.</span>
          </div>
          <button
            id="stale-new-chat-btn"
            onClick={handleStartNewChat}
            className="px-2.5 py-1 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Tạo phiên chat mới
          </button>
        </div>
      )}

      {/* ── Message History Container ── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400 mb-3 border border-blue-100/50 dark:border-blue-900/30">
              <Sparkles className="size-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
              Bắt đầu hỏi đáp với Trợ lý AI
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              AI sẽ phân tích các tài liệu bạn đã chọn ở thanh bên trái để đưa ra câu trả lời chính xác có trích dẫn.
            </p>

            {/* Suggested Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
              <button
                id="suggested-chip-summary"
                onClick={() => handleSend('Hãy tóm tắt nội dung chính của tài liệu này.')}
                className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="size-4 text-blue-500 shrink-0" />
                <span>Tóm tắt các nội dung cốt lõi</span>
              </button>
              <button
                id="suggested-chip-key-concepts"
                onClick={() => handleSend('Liệt kê các khái niệm quan trọng cần ghi nhớ.')}
                className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
              >
                <Lightbulb className="size-4 text-amber-500 shrink-0" />
                <span>Các khái niệm quan trọng</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.sender === 'USER'
            const cleanText = sanitizeMessageText(msg.messageText)

            return (
              <motion.div
                key={msg.id}
                id={`chat-message-${msg.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`size-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
                    isUser
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                      : 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800'
                  }`}
                >
                  {isUser ? <User className="size-4" /> : <Bot className="size-4 text-blue-400" />}
                </div>

                {/* Bubble Content */}
                <div
                  className={`flex flex-col gap-1 text-left ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-sm'
                        : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{cleanText}</p>
                    ) : (
                      <MarkdownRenderer content={cleanText} />
                    )}

                    {/* Source Citations */}
                    {!isUser && <SourceCitationsView sources={msg.sources} />}
                  </div>

                  {/* Actions footer */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        id={`copy-msg-btn-${msg.id}`}
                        onClick={() => handleCopy(cleanText)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Sao chép"
                      >
                        <Copy className="size-3.5" />
                        <span>Sao chép</span>
                      </button>

                      <button
                        id={`regen-msg-btn-${msg.id}`}
                        onClick={() => handleRegenerate(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Tạo lại câu trả lời"
                      >
                        <RefreshCw className="size-3.5" />
                        <span>Tạo lại</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium pl-11">
            <Loader2 className="size-4 animate-spin text-blue-600" />
            <span>AI đang suy nghĩ và phân tích tài liệu...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Box Section ── */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2.5 max-w-4xl mx-auto"
        >
          <input
            id="chat-input-field"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt câu hỏi cho AI về các tài liệu đã chọn..."
            disabled={isTyping}
            className="flex-1 h-12 px-4 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 transition-colors"
          />
          <button
            id="chat-send-btn"
            type="submit"
            disabled={!input.trim() || isTyping}
            className="size-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

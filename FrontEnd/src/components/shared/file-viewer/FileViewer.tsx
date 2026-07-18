import { useState, useEffect, useRef } from 'react'
import { Download, Share2, Sparkles, CheckCircle2, Loader2, Printer, Minimize2, Maximize2 } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { PreviewToolbar } from './PreviewToolbar'
import { DocumentPreview } from './DocumentPreview'
import { FileMetadataPanel } from './FileMetadataPanel'
import { AskAIAssistantPanel } from './AskAIAssistantPanel'
import { ShareAccessModal } from '../share-access/ShareAccessModal'
import { useTranslation } from '@/context/LanguageContext'
import { aiService } from '@/services/aiService'
import { documentService } from '@/services/documentService'
import { useAuthStore } from '@/stores/authStore'

interface ChatMessage {
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

interface FileViewerProps {
  fileName: string
  fileType: string
  fileSize: string
  uploadedAt: string
  description: string
  tags: string[]
  totalPages?: number
  subject?: string
  previewContent?: string
  permission?: 'View Only' | 'Viewer' | 'Editor' | 'Owner'
  showToast: (msg: string) => void
  onDownload: () => void
  onBackLink: React.ReactNode
  fileUrl?: string
  onQuiz?: () => void
  initialPage?: number
  documentId?: string
}

export function FileViewer({
  fileName,
  fileType,
  fileSize,
  uploadedAt,
  description,
  tags,
  totalPages = 12,
  subject = 'GENERAL',
  previewContent,
  permission = 'View Only',
  showToast,
  onDownload,
  onBackLink,
  fileUrl,
  onQuiz,
  initialPage,
  documentId
}: FileViewerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Study Plan Progress Sync
  const planIdParam = searchParams.get('planId')
  const lessonIdParam = searchParams.get('lessonId')
  const [isLessonCompleted, setIsLessonCompleted] = useState(false)

  useEffect(() => {
    if (!planIdParam || !lessonIdParam) return
    const localKey = `study_plan_completed_lessons_${planIdParam}`
    // Immediately check localStorage
    const raw = localStorage.getItem(localKey)
    const local: string[] = raw ? JSON.parse(raw) : []
    if (local.includes(lessonIdParam)) {
      setIsLessonCompleted(true)
      return
    }
    // Then verify with API
    const planIdNum = Number(planIdParam)
    if (!isNaN(planIdNum) && planIdNum > 0) {
      aiService.getCompletedLessons(planIdNum).then((serverIds) => {
        const done = serverIds.includes(lessonIdParam)
        setIsLessonCompleted(done)
        if (done) {
          const merged = Array.from(new Set([...local, lessonIdParam]))
          localStorage.setItem(localKey, JSON.stringify(merged))
        }
      }).catch(() => {})
    }
  }, [planIdParam, lessonIdParam])

  // 1. Zoom and Page state
  const [zoomScale, setZoomScale] = useState(100)
  const [currentPage, setCurrentPage] = useState(initialPage || 1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const normType = fileType.toLowerCase()
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [pdfLoadError, setPdfLoadError] = useState(false)
  const [previewText, setPreviewText] = useState<string>(previewContent || '')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (previewContent) {
      setPreviewText(previewContent)
    }
  }, [previewContent])

  useEffect(() => {
    if (normType === 'pdf' && documentId) {
      setLoadingPdf(true)
      setPdfLoadError(false)
      documentService.downloadDocument(documentId)
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)
        })
        .catch((err) => {
          console.error("Failed to fetch PDF blob for viewer:", err)
          setPdfLoadError(true)
        })
        .finally(() => {
          setLoadingPdf(false)
        })
    }
  }, [documentId, normType])

  useEffect(() => {
    if (!documentId) return

    // If it's a PDF, we try to download and preview it in iframe.
    // If it's NOT a PDF, OR if it's a PDF but download failed (pdfLoadError is true), we fetch the text preview.
    const shouldFetchText = normType !== 'pdf' || pdfLoadError

    if (shouldFetchText) {
      setLoadingPreview(true)
      documentService.previewDocument(documentId)
        .then((content) => {
          if (content && !content.startsWith('%PDF') && content.length < 500000) {
            setPreviewText(content)
          } else if (!previewContent) {
            setPreviewText('')
          }
        })
        .catch((err) => {
          console.error("Failed to fetch document text preview:", err)
          if (!previewContent) {
            setPreviewText('')
          }
        })
        .finally(() => {
          setLoadingPreview(false)
        })
    }
  }, [documentId, normType, pdfLoadError])

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  useEffect(() => {
    if (initialPage) {
      setCurrentPage(initialPage)
    }
  }, [initialPage])

  useEffect(() => {
    if (documentId) {
      try {
        const stored = localStorage.getItem('aiStudyHubLastOpenedDocument')
        if (stored) {
          const item = JSON.parse(stored)
          if (item.id === documentId) {
            item.resumeLabel = `Resume from page ${currentPage}`
            const total = totalPages || 12
            item.progress = Math.round((currentPage / total) * 100)
            localStorage.setItem('aiStudyHubLastOpenedDocument', JSON.stringify(item))
            window.dispatchEvent(new Event('aiStudyHubLastOpenedDocumentUpdated'))
          }
        }
      } catch (e) {}
    }
  }, [currentPage, documentId, totalPages])

  // 2. AI Chat assistant state
  const user = useAuthStore((s) => s.user)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [aiTypingText, setAiTypingText] = useState('')

  // Dynamically initialize chat session and fetch history from backend
  useEffect(() => {
    if (documentId && user?.id) {
      aiService.createOrGetChatSession([Number(documentId)], Number(user.id))
        .then(session => {
          setSessionId(session.id)
          return aiService.getChatHistory(session.id)
        })
        .then(history => {
          if (history && history.length > 0) {
            const mappedHistory = history.map(msg => ({
              sender: msg.sender.toLowerCase() as 'user' | 'ai',
              text: msg.messageText,
              timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
            setChatLog(mappedHistory)
          } else {
            setChatLog([
              {
                sender: 'ai',
                text: t.fileViewer.welcomeMsg(fileName),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ])
          }
        })
        .catch(err => {
          console.error("Failed to load or create AI chat session:", err)
          setChatLog([
            {
              sender: 'ai',
              text: t.fileViewer.welcomeMsg(fileName),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ])
        })
    } else {
      setChatLog([
        {
          sender: 'ai',
          text: t.fileViewer.welcomeMsg(fileName),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    }
  }, [documentId, user?.id, fileName, t])

  // 3. Document AI deep analysis state
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStep, setScanStep] = useState('')

  // 4. Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Timer references for simulations
  const aiTimeoutRef = useRef<any>(null)
  const typingIntervalRef = useRef<any>(null)
  const scanIntervalRef = useRef<any>(null)
  const scanTimeoutRef = useRef<any>(null)

  // Reset scroll to top on mount, and cleanup timers on unmount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-auto"], .overflow-auto, [class*="overflow-auto"]')
      scrollableContainers.forEach((container) => {
        container.scrollTop = 0
      })
    }
    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
    }
  }, [])

  // Zoom handlers (zoom Scale between 50% and 200%)
  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(50, prev - 25))
  }

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(200, prev + 25))
  }

  // Print trigger
  const handlePrint = () => {
    if (isDownloadRestricted()) {
      showToast(t.fileViewer.printRestricted)
      return
    }
    if (normType === 'pdf' && iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.print()
      } catch (err) {
        window.print()
      }
    } else {
      showToast(t.fileViewer.printPreparing(fileName))
      setTimeout(() => {
        window.print()
      }, 800)
    }
  }

  // Fullscreen trigger
  const toggleFullscreen = () => {
    const nextVal = !isFullscreen
    setIsFullscreen(nextVal)
    showToast(t.fileViewer.fullscreenToast(nextVal ? 'enabled' : 'disabled'))
  }

  // Check download permission
  const isDownloadRestricted = () => {
    return permission === 'View Only' || permission === 'Viewer'
  }

  // Send AI Message handler
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    showToast(t.fileViewer.aiProcessingToast)

    // Add user message
    const userMsg: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setChatLog(prev => [...prev, userMsg])
    setIsAiResponding(true)
    setAiTypingText('...')

    try {
      let activeSessionId = sessionId
      if (!activeSessionId && documentId && user?.id) {
        const session = await aiService.createOrGetChatSession([Number(documentId)], Number(user.id))
        activeSessionId = session.id
        setSessionId(session.id)
      }

      if (!activeSessionId) {
        throw new Error("Chat session not available")
      }

      const aiReply = await aiService.sendMessage(activeSessionId, text)
      
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: aiReply.messageText,
        timestamp: new Date(aiReply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setChatLog(prev => [...prev, aiMsg])
    } catch (err) {
      console.error("Failed to send message to AI Assistant:", err)
      showToast("Gửi tin nhắn thất bại. Vui lòng thử lại.")
    } finally {
      setIsAiResponding(false)
      setAiTypingText('')
    }
  }

  // Deep AI Analysis (Calls real summary generation)
  const handleDeepAnalysis = async () => {
    if (isScanning || !documentId) return
    setIsScanning(true)
    setScanProgress(10)
    setScanStep(t.fileViewer.analyzingLayout)
    showToast(t.fileViewer.analyzingFile(fileName))

    let progress = 10
    const interval = setInterval(() => {
      progress = Math.min(progress + 15, 90)
      setScanProgress(progress)
      if (progress < 40) {
        setScanStep(t.fileViewer.extractingText)
      } else if (progress < 75) {
        setScanStep(t.fileViewer.runningConceptMatch)
      } else {
        setScanStep(t.fileViewer.syncingDb)
      }
    }, 200)

    try {
      const summary = await aiService.generateSummary(documentId, 'vi')
      
      clearInterval(interval)
      setScanProgress(100)
      setScanStep(t.fileViewer.syncingDb)
      
      setTimeout(() => {
        setIsScanning(false)
        showToast(t.fileViewer.analysisCompleted)

        let bulletsList: string[] = []
        try {
          if (summary.summaryBullets) {
            bulletsList = JSON.parse(summary.summaryBullets)
          }
        } catch (e) {
          console.warn("Failed to parse summary bullets JSON:", e)
        }

        let formattedText = `**Tóm tắt tài liệu "${fileName}":**\n\n${summary.summaryText}`
        if (bulletsList && bulletsList.length > 0) {
          formattedText += `\n\n**Các ý chính:**\n` + bulletsList.map(b => `- ${b}`).join('\n')
        }

        if (sessionId) {
          aiService.sendMessage(sessionId, `[Hệ thống] Đã thực hiện phân tích tài liệu và tạo tóm tắt.`)
            .catch(() => {})
        }

        setChatLog(prev => [...prev, {
          sender: 'ai',
          text: formattedText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
      }, 300)
    } catch (err) {
      clearInterval(interval)
      setIsScanning(false)
      console.error("Failed to analyze document:", err)
      showToast("Phân tích tài liệu thất bại. Vui lòng thử lại.")
    }
  }

  const handleDownloadClick = () => {
    if (isDownloadRestricted()) {
      showToast(t.fileViewer.downloadRestricted)
      return
    }
    showToast(t.fileViewer.downloadingFile(fileName))
    onDownload()
  }

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
        showToast(t.fileViewer.fullscreenDisabled)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-slate-100 bg-[#f5f7fb] dark:bg-slate-950 min-h-screen">
      {/* 1. Breadcrumbs Top Nav */}
      <div className="flex items-center gap-2 select-none">
        {onBackLink}
      </div>

      {/* Study Plan Lesson Completion Banner */}
      {planIdParam && lessonIdParam && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900/40 shadow-sm transition-all duration-305">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 tracking-wide uppercase">Bài học trong Lộ trình học tập</p>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Hãy đọc và hoàn thành nội dung tài liệu này để cập nhật tiến độ
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            {isLessonCompleted ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-900/30 w-full justify-center sm:w-auto">
                <CheckCircle2 className="size-4" />
                Đã hoàn thành
              </span>
            ) : (
              <Button
                onClick={async () => {
                  if (!planIdParam || !lessonIdParam) return
                  try {
                    const localKey = `study_plan_completed_lessons_${planIdParam}`
                    const raw = localStorage.getItem(localKey)
                    const local: string[] = raw ? JSON.parse(raw) : []
                    const merged = Array.from(new Set([...local, lessonIdParam]))
                    localStorage.setItem(localKey, JSON.stringify(merged))
                    setIsLessonCompleted(true)
                    showToast("Chúc mừng! Đã ghi nhận hoàn thành bài học.")
                    // Sync to database
                    const planIdNum = Number(planIdParam)
                    if (!isNaN(planIdNum) && planIdNum > 0) {
                      await aiService.updateCompletedLessons(planIdNum, merged)
                    }
                  } catch (e) {
                    console.error("Error setting lesson completed", e)
                  }
                }}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                Đánh dấu hoàn thành bài học
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. Main Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Document viewer canvas container */}
        <div
          className={cn(
            "lg:col-span-8 flex flex-col bg-slate-900/5 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-300",
            isFullscreen ? "fixed inset-4 z-50 bg-slate-955 shadow-2xl" : "relative shadow-xl"
          )}
        >
          {normType === 'pdf' && !pdfLoadError ? (
            <div className="flex flex-col h-full w-full">
              {/* PDF Toolbar */}
              <div className="flex items-center justify-between gap-4 border-b bg-blue-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 py-4 select-none">
                <span className="text-sm font-bold truncate text-slate-800 dark:text-slate-100 max-w-[300px]">
                  {fileName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-slate-250/40 dark:border-slate-700 transition-colors cursor-pointer"
                    title={t.fileViewer.printDoc(fileName)}
                    aria-label={t.fileViewer.print}
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2.5 rounded-xl border border-slate-250/40 dark:border-slate-700 transition-colors cursor-pointer"
                    title={isFullscreen ? (t.fileViewer.exitFullscreen || "Exit Fullscreen") : (t.fileViewer.fullscreenViewer || "Fullscreen Viewer")}
                    aria-label={isFullscreen ? (t.fileViewer.exitFullscreen || "Exit Fullscreen") : (t.fileViewer.fullscreenViewer || "Fullscreen Viewer")}
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* PDF Canvas area */}
              <div className={cn("w-full bg-white dark:bg-slate-900", isFullscreen ? "h-[calc(100vh-80px)]" : "h-[750px]")}>
                {pdfUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={pdfUrl}
                    className="w-full h-full border-none"
                    title={fileName}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                    <Loader2 className="animate-spin size-8 text-primary" />
                    <span className="text-sm font-semibold">Loading PDF...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Top toolbar */}
              <PreviewToolbar
                zoomScale={zoomScale}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPrint={handlePrint}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
                fileName={fileName}
              />

              {/* Canvas area */}
              <DocumentPreview
                fileType={pdfLoadError ? 'txt' : fileType}
                fileName={fileName}
                zoomScale={zoomScale}
                currentPage={currentPage}
                totalPages={totalPages}
                subject={subject}
                previewContent={previewText}
                isDownloadRestricted={isDownloadRestricted()}
                fileUrl={fileUrl}
              />
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar controls panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Metadata Info Card panel */}
          <FileMetadataPanel
            fileName={fileName}
            subject={subject}
            description={description}
            tags={tags}
            fileSize={fileSize}
            uploadedAt={uploadedAt}
          />

          {/* 2. AI Assistant chatbot panel */}
          <AskAIAssistantPanel
            fileName={fileName}
            chatLog={chatLog}
            onSendMessage={handleSendMessage}
            isAiResponding={isAiResponding}
            aiTypingText={aiTypingText}
            isScanning={isScanning}
            scanProgress={scanProgress}
            scanStep={scanStep}
            onDeepAnalysis={handleDeepAnalysis}
            suggestedPrompt={t.fileViewer.suggestedPrompt(fileName)}
          />

          {/* 3. Action Buttons Column */}
          <div className="space-y-3">
            {onQuiz && (
              <Button
                onClick={onQuiz}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5" />
                {t.actionMenu.practiceQuiz}
              </Button>
            )}

            {documentId && (
              <Button
                onClick={() => navigate(`/dashboard/study-plans?documentId=${documentId}&generate=true`)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5" />
                {t.actionMenu.generateStudyPlan}
              </Button>
            )}

            <Button
              onClick={handleDownloadClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Download className="h-4.5 w-4.5" />
              {t.fileViewer.downloadFile}
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 text-xs cursor-pointer"
            >
              <Share2 className="h-4.5 w-4.5 text-slate-550" />
              {t.fileViewer.shareAccess}
            </Button>
          </div>

        </div>
      </div>

      {/* Share Modal Overlay */}
      <ShareAccessModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileId={documentId}
        fileName={fileName}
        showToast={showToast}
      />
    </div>
  )
}
export default FileViewer

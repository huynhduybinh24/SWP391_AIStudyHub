import { useState, useEffect, useRef } from 'react'
import { Download, Share2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { PreviewToolbar } from './PreviewToolbar'
import { DocumentPreview } from './DocumentPreview'
import { FileMetadataPanel } from './FileMetadataPanel'
import { AskAIAssistantPanel } from './AskAIAssistantPanel'
import { ShareAccessModal } from '../share-access/ShareAccessModal'
import { useTranslation } from '@/context/LanguageContext'

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
  onQuiz
}: FileViewerProps) {
  const { t } = useTranslation()

  // 1. Zoom and Page state
  const [zoomScale, setZoomScale] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 2. AI Chat assistant state
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [aiTypingText, setAiTypingText] = useState('')

  // Dynamically initialize and update welcome message on language change
  useEffect(() => {
    setChatLog(prev => {
      const welcomeText = t.fileViewer.welcomeMsg(fileName)
      if (prev.length === 0) {
        return [
          {
            sender: 'ai',
            text: welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }
      return prev.map((msg, i) => {
        if (i === 0 && msg.sender === 'ai') {
          return { ...msg, text: welcomeText }
        }
        return msg
      })
    })
  }, [t, fileName])

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
    showToast(t.fileViewer.printPreparing(fileName))
    setTimeout(() => {
      window.print()
    }, 800)
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
  const handleSendMessage = (text: string) => {
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

    // Clear previous responses
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current)
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)

    // Simulate AI response response logic
    aiTimeoutRef.current = setTimeout(() => {
      let responseText = ''
      const lower = text.toLowerCase()

      if (lower.includes('summary') || lower.includes('tóm tắt') || lower.includes('overview') || lower.includes('quá trình')) {
        responseText = t.fileViewer.summaryResponse(fileName, subject)
      } else {
        responseText = t.fileViewer.defaultResponse(fileName)
      }

      let idx = 0
      setAiTypingText('')
      typingIntervalRef.current = setInterval(() => {
        if (idx < responseText.length) {
          setAiTypingText(responseText.substring(0, idx + 1))
          idx++
        } else {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current)
          setChatLog(prev => [...prev, {
            sender: 'ai',
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
          setAiTypingText('')
          setIsAiResponding(false)
        }
      }, 12)
    }, 1000)
  }

  // Deep AI Analysis scan simulator (1s loading)
  const handleDeepAnalysis = () => {
    if (isScanning) return
    setIsScanning(true)
    setScanProgress(10)
    setScanStep(t.fileViewer.analyzingLayout)
    showToast(t.fileViewer.analyzingFile(fileName))

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)

    const steps = [
      { progress: 40, step: t.fileViewer.extractingText },
      { progress: 75, step: t.fileViewer.runningConceptMatch },
      { progress: 100, step: t.fileViewer.syncingDb }
    ]

    let stepIdx = 0
    scanIntervalRef.current = setInterval(() => {
      if (stepIdx < steps.length) {
        setScanProgress(steps[stepIdx].progress)
        setScanStep(steps[stepIdx].step)
        stepIdx++
      } else {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        scanTimeoutRef.current = setTimeout(() => {
          setIsScanning(false)
          showToast(t.fileViewer.analysisCompleted)
          
          setChatLog(prev => [...prev, {
            sender: 'ai',
            text: t.fileViewer.analysisSuccessMsg(fileName),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        }, 300)
      }
    }, 300) // fast load to fit 1 second duration request
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

      {/* 2. Main Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Document viewer canvas container */}
        <div
          className={cn(
            "lg:col-span-8 flex flex-col bg-slate-900/5 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-300",
            isFullscreen ? "fixed inset-4 z-50 bg-slate-950 p-6 shadow-2xl border-slate-850" : "relative shadow-xl"
          )}
        >
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
            fileType={fileType}
            fileName={fileName}
            zoomScale={zoomScale}
            currentPage={currentPage}
            totalPages={totalPages}
            subject={subject}
            previewContent={previewContent}
            isDownloadRestricted={isDownloadRestricted()}
            fileUrl={fileUrl}
          />
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
                Làm trắc nghiệm AI
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
        fileName={fileName}
        showToast={showToast}
      />
    </div>
  )
}
export default FileViewer

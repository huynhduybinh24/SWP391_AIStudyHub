import { useState, useEffect, useRef } from 'react'
import { Download, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { PreviewToolbar } from './PreviewToolbar'
import { DocumentPreview } from './DocumentPreview'
import { FileMetadataPanel } from './FileMetadataPanel'
import { AskAIAssistantPanel } from './AskAIAssistantPanel'
import { ShareAccessModal } from '../share-access/ShareAccessModal'

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
  onBackLink
}: FileViewerProps) {
  // 1. Zoom and Page state
  const [zoomScale, setZoomScale] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 2. AI Chat assistant state
  const [chatLog, setChatLog] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: `Chào bạn! Tôi là Trợ lý học tập AI. Bạn cần tôi phân tích hay giải đáp câu hỏi nào về tài liệu "${fileName}" này không?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isAiResponding, setIsAiResponding] = useState(false)
  const [aiTypingText, setAiTypingText] = useState('')

  // 3. Document AI deep analysis state
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStep, setScanStep] = useState('')

  // 4. Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Timer references for simulations
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timers on unmount
  useEffect(() => {
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
      showToast('🔒 Chủ sở hữu tài liệu đã chặn quyền in ấn của người xem/nhận xét!')
      return
    }
    showToast(`Preparing ${fileName} for printing`)
    setTimeout(() => {
      window.print()
    }, 800)
  }

  // Fullscreen trigger
  const toggleFullscreen = () => {
    const nextVal = !isFullscreen
    setIsFullscreen(nextVal)
    showToast(`Fullscreen mode ${nextVal ? 'enabled' : 'disabled'}`)
  }

  // Check download permission
  const isDownloadRestricted = () => {
    return permission === 'View Only' || permission === 'Viewer'
  }

  // Send AI Message handler
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    showToast('AI assistant is processing your question')

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
        responseText = `Dựa trên nội dung tài liệu "${fileName}":\n\n• Tài liệu cung cấp kiến thức nền tảng về ${subject}.\n• Đề cập đến các phương pháp học tập kết hợp, phân tích các chỉ số đo lường hiệu suất thực tiễn.\n• Đề xuất quy trình 3 bước tối ưu để học sinh tự ôn tập và kiểm tra trí nhớ định kỳ.`
      } else {
        responseText = `Hệ thống AI nhận định đây là phần kiến thức quan trọng trong tài liệu "${fileName}". Các mục tiêu ôn tập đề xuất bao gồm:\n\n1. Hiểu rõ các định nghĩa cốt lõi.\n2. Phân tích các biểu đồ và số liệu thực nghiệm.\n3. Vận dụng kiến thức vào bài test đánh giá năng lực.\n\nBạn có muốn tôi làm rõ phần nào chi tiết hơn không?`
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
    setScanStep('Analyzing file layout...')
    showToast(`Analyzing ${fileName}`)

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)

    const steps = [
      { progress: 40, step: 'Extracting text elements...' },
      { progress: 75, step: 'Running key concept vector matching...' },
      { progress: 100, step: 'Syncing cognitive map database...' }
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
          showToast('AI analysis completed')
          
          setChatLog(prev => [...prev, {
            sender: 'ai',
            text: `⚡ Phân tích thông minh hoàn tất! Tôi đã quét toàn bộ tài liệu "${fileName}". Trạng thái tài liệu đã được cập nhật thành ANALYZED.\n\nBạn có thể bắt đầu các câu hỏi ôn tập chuyên sâu ngay bây giờ.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        }, 300)
      }
    }, 300) // fast load to fit 1 second duration request
  }

  const handleDownloadClick = () => {
    if (isDownloadRestricted()) {
      showToast('🔒 Chủ sở hữu tài liệu đã chặn quyền tải xuống của người xem/nhận xét!')
      return
    }
    showToast(`Downloading ${fileName}`)
    onDownload()
  }

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
        showToast('Fullscreen mode disabled')
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
            suggestedPrompt={`Explain the core concepts and summaries inside "${fileName}".`}
          />

          {/* 3. Action Buttons Column */}
          <div className="space-y-3">
            <Button
              onClick={handleDownloadClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Download className="h-4.5 w-4.5" />
              Download File
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 text-xs cursor-pointer"
            >
              <Share2 className="h-4.5 w-4.5 text-slate-500" />
              Share Access
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

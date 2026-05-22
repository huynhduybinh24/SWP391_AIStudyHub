import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import {
  ZoomIn,
  ZoomOut,
  Printer,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Bot,
  Send,
  Sparkles,
  Download,
  Share2,
  GraduationCap,
  Clock,
  ArrowLeft,
  AlertCircle,
  FileText,
  CheckCircle,
  BrainCircuit,
  MessageSquare,
  Sparkle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL' | 'NEUROSCIENCE' | 'PSYCHOLOGY'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

interface DocumentsContextType {
  documents: DocumentItem[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  openUploadModal: () => void
  openChatDrawer: (doc: DocumentItem) => void
  openPreviewModal: (doc: DocumentItem) => void
  openQuizModal: () => void
  showToast: (message: string) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => React.ReactNode
  renderStatusBadge: (status: string) => React.ReactNode
}

// Custom contents for each subject so details are extremely high-fidelity
const SUBJECT_DETAILS_MOCK: Record<
  string,
  {
    courseTitle: string
    courseCode: string
    overview: string
    objectives: string[]
    tags: string[]
    description: string
    pagesCount: number
  }
> = {
  NEUROSCIENCE: {
    courseTitle: 'Advanced Neuroscience',
    courseCode: 'NEURO-402 Syllabus 2024',
    overview:
      'This course explores the complex dynamics of neural networks and the molecular basis of synaptic plasticity. We examine how individual neuronal activities integrate into large-scale functional networks, utilizing advanced neuroimaging techniques to map the cognitive architecture of the human brain.',
    objectives: [
      'Understand functional connectivity in the human brain.',
      'Analyze fMRI data for resting-state networks.',
      'Explore molecular mechanisms of memory consolidation.'
    ],
    tags: ['#Neuro', '#2024', '#Syllabus'],
    description:
      'Comprehensive curriculum overview for the Fall 2024 semester, including weekly reading lists, lab schedules, and grading rubrics for NEURO-402.',
    pagesCount: 42
  },
  COMPSCI: {
    courseTitle: 'Advanced Software Engineering',
    courseCode: 'CS-402 Study Guide 2024',
    overview:
      'Deep dive into modern microservice architectures, enterprise design patterns, and cloud-native scaling strategies. This guide details how to build highly decoupled systems using event-driven telemetry and distributed caching models.',
    objectives: [
      'Implement thread-safe design patterns in high-concurrency environments.',
      'Design distributed pub/sub pipelines with automated failover handling.',
      'Optimize database indexing strategies and memory caching layers.'
    ],
    tags: ['#SoftwareEng', '#DesignPatterns', '#Microservices'],
    description:
      'Comprehensive syllabus overview detailing software engineering models, design pattern catalogs, weekly coding exercises, and grading policies.',
    pagesCount: 28
  },
  MATHEMATICS: {
    courseTitle: 'Multivariable Calculus & Linear Algebra',
    courseCode: 'MATH-202 Reference Sheet',
    overview:
      'A compact guide covering fundamental mathematical derivations in multivariable space, gradient descent vector mechanics, and matrix decomposition theorems used extensively inside neural network backpropagation models.',
    objectives: [
      'Formulate Taylor expansions in multivariable dimensions.',
      'Deconstruct high-dimensional matrices using Singular Value Decomposition.',
      'Compute vector gradients and Jacobians for complex cost functions.'
    ],
    tags: ['#Calculus', '#MathSheet', '#LinearAlgebra'],
    description:
      'High-fidelity quick reference sheet for complex multivariable equations, gradient computations, and matrix transformation rules.',
    pagesCount: 15
  },
  BIOLOGY: {
    courseTitle: 'Molecular Genetics & Cell Biology',
    courseCode: 'BIO-305 Lab Companion',
    overview:
      'Detailed overview of intracellular signaling pathways, CRISPR-Cas9 genetic editing mechanics, and mitochondrial DNA transcription processes in active eukaryotic organisms.',
    objectives: [
      'Trace chemical cascade dynamics inside ribosomal cell complexes.',
      'Diagram the double-helix replication loop with enzymatic boundaries.',
      'Evaluate evolutionary genetics in cellular metabolic cycles.'
    ],
    tags: ['#Genetics', '#CellBio', '#LabNotes'],
    description:
      'Laboratory notebook and synthesis manual outlining modern CRISPR gene modification systems, cellular signaling cascades, and transcription rules.',
    pagesCount: 34
  },
  PHYSICS: {
    courseTitle: 'Quantum Mechanics & Wave Theory',
    courseCode: 'PHY-301 Core Formulation',
    overview:
      'Exploring the mathematical formulations of wave-particle duality, potential barrier tunneling probabilities, and structural applications of the time-independent Schrödinger Equation.',
    objectives: [
      'Apply Planck constant scaling in De Broglie equations.',
      'Solve potential energy barrier states for tunneling values.',
      'Analyze spin mechanics and quantum entanglement models.'
    ],
    tags: ['#Quantum', '#WaveTheory', '#Formulas'],
    description:
      'Study notes outlining foundational quantum mechanical principles, wave equations, and photoelectric effect experiments.',
    pagesCount: 20
  },
  GENERAL: {
    courseTitle: 'Integrated Academic Study Methods',
    courseCode: 'GEN-101 Course Companion',
    overview:
      'A practical manual summarizing cognitive science techniques to maximize student recall, including detailed instructions for active recall routines, spaced repetition timers, and the Feynman technique.',
    objectives: [
      'Build active recall routines for conceptual examinations.',
      'Optimize long-term recall rates using spaced retention intervals.',
      'Simplify complex academic papers through systematic deconstruction.'
    ],
    tags: ['#StudySkills', '#RecallMethod', '#AIAssistant'],
    description:
      'Detailed cognitive study handbook outlining modern spacing algorithms, self-testing strategies, and structural planning systems.',
    pagesCount: 12
  }
}

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  
  const {
    documents,
    showToast,
    handleDownloadFile
  } = useOutletContext<DocumentsContextType>()

  // 1. Resolve active document or fallback
  const activeDoc = documents.find(d => d.id === documentId)
  
  // Resolve mockup info based on subject
  const subjectKey = (activeDoc?.subject || 'NEUROSCIENCE').toUpperCase()
  const mockDetails = SUBJECT_DETAILS_MOCK[subjectKey] || SUBJECT_DETAILS_MOCK.NEUROSCIENCE

  // 2. Local States
  const [zoomScale, setZoomScale] = useState<number>(100) // scale in percent (e.g. 50, 75, 100, 125, 150)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [aiTypingText, setAiTypingText] = useState<string>('')
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false)
  const [chatInput, setChatInput] = useState<string>('')
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanProgress, setScanProgress] = useState<number>(0)
  const [scanStep, setScanStep] = useState<string>('')

  // Chat message log state
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string; timestamp: string }>>([
    {
      sender: 'ai',
      text: `Chào bạn! Tôi là Trợ lý học tập AI. Bạn cần tôi phân tích hay giải đáp câu hỏi nào về tài liệu **${activeDoc?.title || mockDetails.courseTitle}** này không?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatLog, aiTypingText])

  // Zoom handlers
  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(50, prev - 25))
  }

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(200, prev + 25))
  }

  // Page index handlers
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(mockDetails.pagesCount, prev + 1))
  }

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val) && val >= 1 && val <= mockDetails.pagesCount) {
      setCurrentPage(val)
    }
  }

  // Fullscreen trigger handler
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Print simulation trigger
  const handlePrint = () => {
    showToast('Preparing document layout structure for printing...')
    setTimeout(() => {
      window.print()
    }, 800)
  }

  // Click prompt chip trigger
  const handleChipClick = (prompt: string) => {
    setChatInput(prompt)
    triggerAiResponse(prompt)
  }

  // Submit search / chat message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!chatInput.trim() || isAiResponding) return
    const prompt = chatInput.trim()
    setChatInput('')
    triggerAiResponse(prompt)
  }

  const triggerAiResponse = (prompt: string) => {
    // 1. Add user message
    const userMsg = {
      sender: 'user' as const,
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    
    setChatLog(prev => [...prev, userMsg])
    setIsAiResponding(true)

    // Simulating deep semantic response based on prompt matching
    setTimeout(() => {
      let fullResponse = ''
      const lower = prompt.toLowerCase()

      if (lower.includes('connectivity') || lower.includes('map') || lower.includes('brain')) {
        fullResponse = `Dựa trên phân tích hình ảnh và nội dung tài liệu về **Sơ đồ liên kết mạng thần kinh**:\n\n1. **Functional Connectivity**: Thể hiện các mối tương quan có tính chất thống kê giữa các tín hiệu hoạt động đo được từ các vùng não khác nhau (qua fMRI). Sơ đồ não 3D cho thấy các điểm hub phân tán chính tập trung ở Thùy Trán (Frontal Lobe) và Thùy Thái Dương (Temporal Lobe).\n\n2. **Synaptic Density**: Các đường sáng xanh tượng trưng cho các bó sợi trục dẫn truyền liên vùng tạo thành mạng lưới mặc định của não (Default Mode Network - DMN) hỗ trợ cho tư duy chiều sâu và tổng hợp ký ức.\n\n3. **Ứng dụng**: Sơ đồ này chứng minh sự tích hợp đồng bộ giữa các khu vực chức năng hỗ trợ đắc lực cho các cơ chế học tập tích cực (Active Learning).`
      } else if (lower.includes('summary') || lower.includes('tóm tắt') || lower.includes('overview')) {
        fullResponse = `Dưới đây là tóm tắt nhanh AI phục vụ ôn tập:\n\n• **Chủ đề chính**: ${mockDetails.courseTitle} (${mockDetails.courseCode})\n• **Nội dung cốt lõi**: Phân tích sâu các khái niệm quan trọng, hệ thống hóa mục tiêu thực nghiệm thực tiễn và liên kết liên môn.\n• **Ứng dụng ôn tập**: Phù hợp cho việc ôn tập chuẩn bị thi học kỳ nhờ cấu trúc mục tiêu rõ ràng và sơ đồ hệ thống hóa tối ưu.`
      } else {
        fullResponse = `Cảm ơn bạn đã hỏi về nội dung tài liệu **${activeDoc?.title || mockDetails.courseTitle}**.\n\nHệ thống AI của AI Study Hub nhận định đây là phần kiến thức quan trọng nằm trong chương trình học **${mockDetails.courseCode}**. Bạn nên tập trung ôn tập 3 mục tiêu cốt lõi sau:\n\n1. **${mockDetails.objectives[0]}**\n2. **${mockDetails.objectives[1]}**\n3. **${mockDetails.objectives[2]}**\n\nNếu bạn muốn tôi tạo một bộ quiz nhanh hoặc giải thích chi tiết hơn về bất kỳ ý nào trên đây, hãy yêu cầu ngay nhé!`
      }

      // Typing effect loop
      let index = 0
      setAiTypingText('')
      
      const interval = setInterval(() => {
        if (index < fullResponse.length) {
          setAiTypingText(fullResponse.substring(0, index + 1))
          index++
        } else {
          clearInterval(interval)
          setChatLog(prev => [...prev, {
            sender: 'ai',
            text: fullResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
          setAiTypingText('')
          setIsAiResponding(false)
        }
      }, 10)
    }, 1200)
  }

  // Deep AI Analysis scan simulator
  const handleDeepAnalysis = () => {
    if (isScanning) return
    setIsScanning(true)
    setScanProgress(5)
    setScanStep('Initializing document vector space...')

    const intervals = [
      { p: 25, msg: 'Extracting semantic textual nodes...' },
      { p: 55, msg: 'Comparing structures with neuroscience curriculum standard matrices...' },
      { p: 85, msg: 'Generating contextual flashcards & syllabus study questions...' },
      { p: 100, msg: 'Deep scan completed. AI Brain Knowledge base synced!' }
    ]

    let stepIndex = 0
    const scanTimer = setInterval(() => {
      if (stepIndex < intervals.length) {
        setScanProgress(intervals[stepIndex].p)
        setScanStep(intervals[stepIndex].msg)
        stepIndex++
      } else {
        clearInterval(scanTimer)
        setTimeout(() => {
          setIsScanning(false)
          showToast('⚡ Deep AI Document Analysis completed successfully! AI Assistant is fully synchronized.')
          
          // Add AI notification inside chat log
          setChatLog(prev => [...prev, {
            sender: 'ai',
            text: `⚡ **Phân tích thông minh hoàn tất!** Tôi đã quét toàn bộ tài liệu **${activeDoc?.title || mockDetails.courseTitle}**. Trạng thái tài liệu đã được chuyển sang **ANALYZED**.\n\n*Hệ thống đã tự động liên kết tài liệu này với sơ đồ năng lực Thần kinh học của bạn.* Bạn có thể đặt câu hỏi chuyên sâu ngay bây giờ!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }])
        }, 600)
      }
    }, 900)
  }

  const handleDownload = () => {
    if (activeDoc) {
      handleDownloadFile(activeDoc)
    } else {
      showToast(`Simulating download for: ${mockDetails.courseTitle}.pdf`)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Breadcrumbs Top Nav */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Documents</span>
        </button>
      </div>

      {/* 2. Main Two-Column Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: PDF-style Viewer container */}
        <div
          className={cn(
            "lg:col-span-8 flex flex-col bg-slate-900/5 border border-slate-200/80 rounded-3xl overflow-hidden transition-all duration-300",
            isFullscreen ? "fixed inset-4 z-50 bg-slate-950 p-6 shadow-2xl border-slate-800" : "relative shadow-xl"
          )}
        >
          
          {/* Document Toolbar header bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4">
            
            {/* Zoom Controls block */}
            <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-2xl">
              <button
                onClick={handleZoomOut}
                disabled={zoomScale <= 50}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 p-1.5 rounded-lg disabled:opacity-40 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 select-none min-w-[36px] text-center">
                {zoomScale}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomScale >= 200}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 p-1.5 rounded-lg disabled:opacity-40 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Page navigation block */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 p-2 rounded-xl border border-slate-200/60 bg-white transition-all shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={currentPage}
                  onChange={handlePageInputChange}
                  className="w-12 text-center font-bold text-slate-800 border border-slate-300 rounded-xl bg-white py-1 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-500 text-xs font-semibold select-none">
                  of {mockDetails.pagesCount}
                </span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === mockDetails.pagesCount}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 p-2 rounded-xl border border-slate-200/60 bg-white transition-all shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Actions block right-aligned */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200/40 transition-colors"
                title="Print Document"
              >
                <Printer className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200/40 transition-colors"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Viewer"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>

          </div>

          {/* Document Sheet Display body */}
          <div className="flex-1 overflow-auto bg-slate-700/10 dark:bg-slate-950/20 p-8 flex items-center justify-center min-h-[620px] max-h-[820px]">
            <div
              className="bg-white text-slate-900 shadow-2xl rounded-2xl p-10 max-w-[690px] w-full border border-slate-100 origin-top transition-all duration-300 relative overflow-hidden"
              style={{ transform: `scale(${zoomScale / 100})` }}
            >
              
              {/* Graduate Cap absolute badge */}
              <div className="absolute top-8 right-8 bg-blue-100/80 text-blue-600 p-2.5 rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5" />
              </div>

              {/* Title & metadata heading header */}
              <div className="space-y-2 border-b border-slate-100 pb-6 mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 font-serif leading-tight">
                  {mockDetails.courseTitle}
                </h1>
                <p className="text-sm font-semibold text-slate-400 font-mono tracking-wider">
                  {mockDetails.courseCode}
                </p>
              </div>

              {/* Course Overview Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-slate-800 font-sans tracking-wide">
                  Course Overview
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-sans text-justify">
                  {mockDetails.overview}
                </p>
              </div>

              {/* Learning Objectives Section */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-slate-800 font-sans tracking-wide">
                  Learning Objectives
                </h3>
                <ul className="space-y-3 pl-1">
                  {mockDetails.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-sm text-slate-600 font-sans leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Neural Brain Graphic block with glowing overlay */}
              <div className="mt-8 border border-slate-200/85 rounded-2xl overflow-hidden shadow-inner bg-slate-950 p-2.5 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none opacity-60 transition-opacity group-hover:opacity-85" />
                <img
                  src="/glowing_blue_brain.png"
                  alt="Glowing Brain Neural Network Network Graph"
                  className="w-full h-auto object-cover rounded-xl select-none"
                />
              </div>

              {/* Sheet page footer number */}
              <div className="border-t border-slate-100 pt-6 mt-10 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>© 2026 AI Study Hub. Empowering Deep Learning.</span>
                <span>Page {currentPage} of {mockDetails.pagesCount}</span>
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar controls panel */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Metadata Info Card panel */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-md space-y-5">
            
            {/* Subject badge label */}
            <div className="flex">
              <span className="text-[10px] tracking-widest font-black uppercase bg-blue-50 border border-blue-100 text-blue-600 px-3.5 py-1.5 rounded-full shadow-sm">
                {activeDoc?.subject || 'NEUROSCIENCE'}
              </span>
            </div>

            {/* Title / description info */}
            <div className="space-y-2.5">
              <h2 className="text-xl font-extrabold text-slate-800 leading-snug">
                {activeDoc?.title || mockDetails.courseTitle}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {mockDetails.description}
              </p>
            </div>

            {/* Tags Pills container */}
            <div className="flex flex-wrap gap-2 pt-1">
              {mockDetails.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors select-none"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* File telemetry grid */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">File Size</span>
                <p className="text-sm font-bold text-slate-700 select-all">
                  {activeDoc?.size || '1.2 MB'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Uploaded</span>
                <p className="text-sm font-bold text-slate-700 select-none">
                  {activeDoc?.uploadedAt ? activeDoc.uploadedAt.replace('Uploaded ', '') : 'Oct 12, 2024'}
                </p>
              </div>
            </div>

          </div>

          {/* 2. Interactive Ask AI Assistant panel */}
          <div className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-md space-y-6 flex flex-col relative overflow-hidden">
            
            {/* Header titles */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600 flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm tracking-wide">
                  Ask AI Assistant
                </h3>
              </div>
              <Sparkle className="h-4 w-4 text-blue-500 animate-pulse" />
            </div>

            {/* Deep scanning analysis banner & progress */}
            {isScanning ? (
              <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex justify-between items-center text-xs font-bold text-blue-800">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                    Running Neural Analyzer...
                  </span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-600/90 font-medium italic truncate">
                  {scanStep}
                </p>
              </div>
            ) : (
              /* Static Prompt Suggestion Chip */
              <div className="space-y-2">
                <button
                  onClick={() => handleChipClick('Explain the functional connectivity map and network hubs in this syllabus.')}
                  className="w-full text-left bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 p-3.5 rounded-2xl text-xs font-medium text-slate-600 hover:text-blue-700 transition-all duration-200 shadow-sm leading-normal flex items-start gap-2.5"
                >
                  <Sparkles className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>Explain the connectivity map...</span>
                </button>
              </div>
            )}

            {/* Chat Response Area container */}
            <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 h-[210px] overflow-y-auto space-y-3.5">
              {chatLog.map((chat, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-normal shadow-sm",
                    chat.sender === 'user'
                      ? "bg-blue-600 text-white ml-auto rounded-tr-none"
                      : "bg-white text-slate-700 border border-slate-100 mr-auto rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-line font-medium">{chat.text}</p>
                  <span className={cn(
                    "text-[8px] mt-1.5 self-end opacity-70",
                    chat.sender === 'user' ? "text-blue-100" : "text-slate-400"
                  )}>
                    {chat.timestamp}
                  </span>
                </div>
              ))}

              {/* Typing simulation view */}
              {isAiResponding && aiTypingText && (
                <div className="bg-white border border-slate-100 text-slate-700 flex flex-col max-w-[85%] rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs mr-auto shadow-sm animate-pulse">
                  <p className="whitespace-pre-line font-medium">{aiTypingText}</p>
                  <span className="text-[8px] mt-1.5 text-slate-400 self-end">Typing...</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat message form input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask AI anything..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiResponding}
                className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isAiResponding}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shrink-0 flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            {/* Lightning Primary Scanner Button */}
            <Button
              variant="secondary"
              onClick={handleDeepAnalysis}
              disabled={isScanning}
              className="w-full bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-sm text-xs transition-all duration-200"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              Analyze Document
            </Button>

          </div>

          {/* 3. Action Buttons Column */}
          <div className="space-y-3">
            <Button
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <Download className="h-4.5 w-4.5" />
              Download PDF
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                showToast('🔗 Document detail page link copied to clipboard!')
              }}
              className="w-full bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-100 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Share2 className="h-4.5 w-4.5" />
              Share Access
            </Button>
          </div>

        </div>

      </div>

    </div>
  )
}

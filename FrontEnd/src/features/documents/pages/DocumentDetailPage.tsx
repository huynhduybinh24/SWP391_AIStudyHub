import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
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
  ArrowLeft,
  Sparkle,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  Settings,
  Check,
  ChevronDown,
  Copy,
  X,
  Mail,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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

  // Collaborator interface for Google-style sharing
  interface Collaborator {
    id: string
    name: string
    email: string
    role: 'owner' | 'editor' | 'commenter' | 'viewer'
    avatarBg: string
  }

  // Google Drive Share states
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false)
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState<boolean>(false)
  const [editorsCanShare, setEditorsCanShare] = useState<boolean>(true)
  const [viewersCanDownload, setViewersCanDownload] = useState<boolean>(true)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: 'owner-1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'owner',
      avatarBg: 'bg-emerald-500/90 text-white font-bold'
    },
    {
      id: 'collab-1',
      name: 'Huynh Duy Binh',
      email: 'binh@example.com',
      role: 'editor',
      avatarBg: 'bg-indigo-500/90 text-white font-bold'
    },
    {
      id: 'collab-2',
      name: 'Ngoc Tan',
      email: 'tan@example.com',
      role: 'commenter',
      avatarBg: 'bg-amber-500/90 text-white font-bold'
    }
  ])
  const [newEmail, setNewEmail] = useState<string>('')
  const [newRole, setNewRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [generalAccess, setGeneralAccess] = useState<'restricted' | 'public'>('restricted')
  const [publicRole, setPublicRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [isGeneralDropdownOpen, setIsGeneralDropdownOpen] = useState<boolean>(false)
  const [isPublicRoleDropdownOpen, setIsPublicRoleDropdownOpen] = useState<boolean>(false)
  const [isNewRoleDropdownOpen, setIsNewRoleDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Escape key handler to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsShareModalOpen(false)
        setActiveDropdownId(null)
        setIsGeneralDropdownOpen(false)
        setIsPublicRoleDropdownOpen(false)
        setIsNewRoleDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close custom role dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null)
        setIsGeneralDropdownOpen(false)
        setIsPublicRoleDropdownOpen(false)
        setIsNewRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  // Check if active user is restricted from downloading/printing
  const isDownloadRestricted = () => {
    // If viewersCanDownload is false, viewers and commenters are restricted.
    // In our live preview, we simulate that since Ngoc Tan is the current user (tan@example.com),
    // we find Ngoc Tan's role in the collaborator list.
    const ngocTan = collaborators.find(c => c.email === 'tan@example.com')
    if (!viewersCanDownload && ngocTan && (ngocTan.role === 'viewer' || ngocTan.role === 'commenter')) {
      return true
    }
    return false
  }

  // Get current user role
  const getCurrentUserRole = () => {
    const currentUser = collaborators.find(c => c.email === 'tan@example.com')
    return currentUser ? currentUser.role : 'viewer'
  }

  // Can current user access settings
  const canCurrentUserAccessSettings = () => {
    const role = getCurrentUserRole()
    if (role === 'owner') return true
    if (role === 'editor' && editorsCanShare) return true
    return false
  }

  // Click handler for settings gear
  const handleGearClick = () => {
    if (!canCurrentUserAccessSettings()) {
      showToast('🔒 Chỉ chủ sở hữu và người chỉnh sửa mới có quyền truy cập cài đặt!')
      return
    }
    setIsSettingsViewOpen(true)
  }

  // Add Copy protection listener
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      if (isDownloadRestricted()) {
        e.preventDefault()
        showToast('🔒 Chủ sở hữu tài liệu đã chặn quyền sao chép nội dung!')
      }
    }
    document.addEventListener('copy', handleCopy)
    return () => document.removeEventListener('copy', handleCopy)
  }, [collaborators, viewersCanDownload])

  // Print simulation trigger
  const handlePrint = () => {
    if (isDownloadRestricted()) {
      showToast('🔒 Chủ sở hữu tài liệu đã chặn quyền in ấn của người xem/nhận xét!')
      return
    }
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
    if (isDownloadRestricted()) {
      showToast('🔒 Chủ sở hữu tài liệu đã chặn quyền tải xuống của người xem/nhận xét!')
      return
    }
    if (activeDoc) {
      handleDownloadFile(activeDoc)
    } else {
      showToast(`Simulating download for: ${mockDetails.courseTitle}.pdf`)
    }
  }

  // Google Drive sharing helper actions
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      showToast('❌ Vui lòng nhập địa chỉ email hợp lệ!')
      return
    }

    if (collaborators.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      showToast('⚠️ Email này đã có quyền truy cập!')
      return
    }

    const newCollabName = newEmail.split('@')[0]
    const formattedName = newCollabName.charAt(0).toUpperCase() + newCollabName.slice(1)

    const backgrounds = [
      'bg-blue-500/90 text-white',
      'bg-purple-500/90 text-white',
      'bg-pink-500/90 text-white',
      'bg-rose-500/90 text-white',
      'bg-teal-500/90 text-white',
      'bg-sky-500/90 text-white'
    ]
    const randomBg = backgrounds[Math.floor(Math.random() * backgrounds.length)]

    const newCollab: Collaborator = {
      id: `collab-${Date.now()}`,
      name: formattedName,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatarBg: randomBg + ' font-bold'
    }

    setCollaborators(prev => [...prev, newCollab])
    setNewEmail('')
    setIsNewRoleDropdownOpen(false)
    showToast(`✉️ Đã gửi lời mời truy cập tới ${newEmail.trim()} với vai trò ${newRole === 'editor' ? 'Người chỉnh sửa' : newRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}!`)
  }

  const handleRemoveCollaborator = (id: string, name: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
    showToast(`🗑️ Đã xóa quyền truy cập của ${name}`)
    setActiveDropdownId(null)
  }

  const handleChangeRole = (id: string, name: string, role: 'editor' | 'commenter' | 'viewer') => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))
    showToast(`✏️ Đã cập nhật quyền của ${name} thành ${role === 'editor' ? 'Người chỉnh sửa' : role === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
    setActiveDropdownId(null)
  }

  const handleGeneralAccessChange = (type: 'restricted' | 'public') => {
    setGeneralAccess(type)
    setIsGeneralDropdownOpen(false)
    if (type === 'restricted') {
      showToast('🔒 Đã hạn chế quyền truy cập liên kết (chỉ những người được thêm mới có thể xem).')
    } else {
      showToast('🌐 Bất kỳ ai có đường liên kết này đều có thể truy cập tài liệu.')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('🔗 Đã sao chép đường liên kết tài liệu vào bộ nhớ tạm!')
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
              className={cn(
                "bg-white text-slate-900 shadow-2xl rounded-2xl p-10 max-w-[690px] w-full border border-slate-100 origin-top transition-all duration-300 relative overflow-hidden",
                isDownloadRestricted() && "select-none"
              )}
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
              onClick={() => navigate(`/dashboard/documents/document/${activeDoc?.id}/edit`)}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Settings className="h-4.5 w-4.5" />
              Edit Details
            </Button>

            <Button
              variant="secondary"
              onClick={() => setIsShareModalOpen(true)}
              className="w-full bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-100 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Share2 className="h-4.5 w-4.5" />
              Share Access
            </Button>
          </div>

        </div>

      </div>

      {/* Google Drive-like Document Sharing Modal Overlay */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsShareModalOpen(false)
                setActiveDropdownId(null)
                setIsGeneralDropdownOpen(false)
                setIsPublicRoleDropdownOpen(false)
                setIsNewRoleDropdownOpen(false)
              }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
              className="bg-white text-slate-800 rounded-[28px] shadow-2xl border border-slate-200/80 w-full max-w-lg mx-4 overflow-hidden z-10 font-sans flex flex-col relative animate-fade-in"
              ref={dropdownRef}
            >
              {isSettingsViewOpen ? (
                /* Sharing Settings View */
                <div className="flex flex-col h-full animate-fade-in">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100 select-none shrink-0">
                    <button
                      onClick={() => setIsSettingsViewOpen(false)}
                      className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center"
                      title="Quay lại"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight select-none">
                      Cài đặt chia sẻ
                    </h2>
                  </div>

                  {/* Options Content */}
                  <div className="px-6 py-6 flex-1 space-y-6">
                    {/* Option 1: Editors share privilege */}
                    <label className="flex items-start gap-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editorsCanShare}
                        onChange={(e) => {
                          setEditorsCanShare(e.target.checked)
                          showToast(e.target.checked ? '✅ Người chỉnh sửa hiện có thể thay đổi quyền và chia sẻ.' : '🔒 Người chỉnh sửa không thể thay đổi quyền chia sẻ nữa.')
                        }}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 leading-normal">
                          Người chỉnh sửa có thể thay đổi quyền và chia sẻ
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                          Nếu tắt, chỉ chủ sở hữu tài liệu mới có quyền thay đổi cài đặt chia sẻ
                        </span>
                      </div>
                    </label>

                    {/* Option 2: Viewers/Commenters download protection */}
                    <label className="flex items-start gap-4 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={viewersCanDownload}
                        onChange={(e) => {
                          setViewersCanDownload(e.target.checked)
                          showToast(e.target.checked ? '✅ Người xem/nhận xét có thể tải xuống, in và sao chép.' : '🔒 Đã khóa tính năng tải xuống, in và sao chép đối với người xem/nhận xét.')
                        }}
                        className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-1 cursor-pointer"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800 leading-normal">
                          Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-0.5">
                          Nếu tắt, các nút tải xuống PDF và in tài liệu sẽ bị vô hiệu hóa đối với các tài khoản không phải Người chỉnh sửa
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-slate-50 flex justify-end shrink-0 border-t border-slate-100 select-none">
                    <Button
                      onClick={() => setIsSettingsViewOpen(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.03] active:scale-[0.98]"
                    >
                      Quay lại
                    </Button>
                  </div>
                </div>
              ) : (
                /* Standard Share Access View */
                <>
                  {/* Header */}
                  <div className="flex justify-between items-center px-6 pt-6 pb-2 shrink-0 select-none">
                    <h2 className="text-xl font-semibold text-slate-900 tracking-tight leading-normal">
                      Chia sẻ "{activeDoc?.title || mockDetails.courseTitle}"
                    </h2>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleGearClick}
                        className={cn(
                          "p-2 rounded-full transition-colors flex items-center justify-center",
                          canCurrentUserAccessSettings()
                            ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                            : "text-slate-300 cursor-not-allowed opacity-40"
                        )}
                        title="Cài đặt chia sẻ"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsShareModalOpen(false)
                          setActiveDropdownId(null)
                          setIsGeneralDropdownOpen(false)
                          setIsPublicRoleDropdownOpen(false)
                          setIsNewRoleDropdownOpen(false)
                        }}
                        className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center justify-center"
                        title="Đóng"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Add People Form */}
                  <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                    <form onSubmit={handleAddCollaborator} className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Thêm người, nhóm hoặc địa chỉ email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-355 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-xs font-semibold placeholder-slate-400 transition-all focus:outline-none"
                        />
                      </div>

                      {/* New user role switcher dropdown */}
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsNewRoleDropdownOpen(!isNewRoleDropdownOpen)}
                          className="flex items-center gap-1 px-3.5 py-3 border border-slate-200 hover:border-slate-300 bg-white rounded-2xl text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-all select-none"
                        >
                          <span className="capitalize">
                            {newRole === 'editor' ? 'Người chỉnh sửa' : newRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                        </button>

                        <AnimatePresence>
                          {isNewRoleDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute right-0 mt-1.5 bg-white border border-slate-250/90 shadow-xl rounded-2xl w-40 overflow-hidden z-30 py-1"
                            >
                              {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setNewRole(r)
                                    setIsNewRoleDropdownOpen(false)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between",
                                    newRole === r ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                                  )}
                                >
                                  <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                  {newRole === r && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Submit Add button */}
                      <button
                        type="submit"
                        disabled={!newEmail.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white p-3 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:scale-100 font-bold shrink-0 flex items-center justify-center"
                        title="Mời cộng tác viên"
                      >
                        <UserPlus className="h-4.5 w-4.5" />
                      </button>
                    </form>
                  </div>

                  {/* People with Access List */}
                  <div className="px-6 py-4 flex-1 overflow-y-auto max-h-[220px] min-h-[140px] space-y-4 border-b border-slate-100">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 select-none">
                      Người có quyền truy cập
                    </h3>
                    <div className="space-y-3.5">
                      <AnimatePresence initial={false}>
                        {collaborators.map((c) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="flex items-center justify-between overflow-hidden py-0.5"
                          >
                            <div className="flex items-center gap-3">
                              {/* Colored Initials Avatar */}
                              <div className={cn("w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs shadow-inner shrink-0 select-none", c.avatarBg)}>
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 leading-normal">
                                  {c.name}
                                  {c.role === 'owner' && (
                                    <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider scale-90 border border-slate-200/50">
                                      Chủ sở hữu
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {c.email}
                                </span>
                              </div>
                            </div>

                            {/* Role selection dropdown */}
                            {c.role === 'owner' ? (
                              <span className="text-xs font-bold text-slate-400 select-none mr-3">
                                Chủ sở hữu
                              </span>
                            ) : (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setActiveDropdownId(activeDropdownId === c.id ? null : c.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all select-none"
                                >
                                  <span>{c.role === 'editor' ? 'Người chỉnh sửa' : c.role === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                  <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                                </button>

                                <AnimatePresence>
                                  {activeDropdownId === c.id && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 5 }}
                                      className="absolute right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl w-44 overflow-hidden z-40 py-1"
                                    >
                                      {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => handleChangeRole(c.id, c.name, r)}
                                          className={cn(
                                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between",
                                            c.role === r ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                                          )}
                                        >
                                          <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                          {c.role === r && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                        </button>
                                      ))}
                                      <div className="border-t border-slate-100 my-1" />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveCollaborator(c.id, c.name)}
                                        className="w-full text-left px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50/50 flex items-center gap-2"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                        <span>Xóa quyền truy cập</span>
                                      </button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* General Access Rules */}
                  <div className="px-6 py-4.5 space-y-3.5 border-b border-slate-100 shrink-0">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 select-none">
                      Quyền truy cập chung
                    </h3>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5 text-left">
                        {/* Access Icon Badge */}
                        <div className={cn(
                          "w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 border select-none transition-all duration-305 shadow-inner",
                          generalAccess === 'restricted'
                            ? "bg-slate-50 border-slate-200 text-slate-500"
                            : "bg-blue-50 border-blue-100 text-blue-600"
                        )}>
                          {generalAccess === 'restricted' ? (
                            <Lock className="h-4.5 w-4.5" />
                          ) : (
                            <Globe className="h-4.5 w-4.5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          {/* Access Scope Dropdown */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsGeneralDropdownOpen(!isGeneralDropdownOpen)}
                              className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-extrabold text-slate-800 hover:bg-slate-50 rounded-lg select-none text-left"
                            >
                              <span>{generalAccess === 'restricted' ? 'Bị hạn chế' : 'Bất kỳ ai có đường liên kết'}</span>
                              <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                            </button>

                            <AnimatePresence>
                              {isGeneralDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl w-52 overflow-hidden z-30 py-1"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleGeneralAccessChange('restricted')}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between",
                                      generalAccess === 'restricted' ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                                    )}
                                  >
                                    <span>Bị hạn chế</span>
                                    {generalAccess === 'restricted' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleGeneralAccessChange('public')}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between",
                                      generalAccess === 'public' ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                                    )}
                                  >
                                    <span>Bất kỳ ai có đường liên kết</span>
                                    {generalAccess === 'public' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <p className="text-[10px] text-slate-450 font-medium pl-1.5 mt-0.5 select-none leading-relaxed">
                            {generalAccess === 'restricted'
                              ? 'Chỉ những người được thêm mới có thể mở bằng đường liên kết này'
                              : 'Bất kỳ ai trên Internet có đường liên kết này đều có thể truy cập'}
                          </p>
                        </div>
                      </div>

                      {/* Public role selector (Viewer, Commenter, Editor) */}
                      {generalAccess === 'public' && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsPublicRoleDropdownOpen(!isPublicRoleDropdownOpen)}
                            className="flex items-center gap-1 px-3 py-1.5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-all select-none"
                          >
                            <span>
                              {publicRole === 'editor' ? 'Người chỉnh sửa' : publicRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                          </button>

                          <AnimatePresence>
                            {isPublicRoleDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-2xl w-40 overflow-hidden z-30 py-1"
                              >
                                {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => {
                                      setPublicRole(r)
                                      setIsPublicRoleDropdownOpen(false)
                                      showToast(`✏️ Đã cập quyền truy cập chung thành ${r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
                                    }}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between",
                                      publicRole === r ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                                    )}
                                  >
                                    <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                    {publicRole === r && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="px-6 py-4 bg-slate-50 flex justify-between items-center shrink-0 gap-3 select-none">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-100 text-blue-600 font-extrabold text-xs px-4.5 py-3 rounded-full shadow-sm transition-all hover:scale-[1.03] active:scale-[0.98] outline-none"
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                      <span>Sao chép đường liên kết</span>
                    </button>

                    <Button
                      onClick={() => {
                        setIsShareModalOpen(false)
                        setActiveDropdownId(null)
                        setIsGeneralDropdownOpen(false)
                        setIsPublicRoleDropdownOpen(false)
                        setIsNewRoleDropdownOpen(false)
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md transition-all hover:scale-[1.03] active:scale-[0.98]"
                    >
                      Xong
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

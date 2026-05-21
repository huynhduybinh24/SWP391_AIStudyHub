import { useOutletContext, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Bot,
  BrainCircuit,
  HelpCircle,
  FileText,
  FileCode,
  Image as ImageIcon,
  FolderDown,
  BookOpen,
  Sparkles,
  TrendingUp,
  Award,
  BookMarked,
  Code2,
  Atom,
  GraduationCap,
  Building,
  SlidersHorizontal
import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Grid,
  List,
  MoreVertical,
  MessageSquare,
  ExternalLink,
  Download,
  Trash2,
  CloudUpload,
  SlidersHorizontal,
  Plus,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  BookOpen,
  FileText
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
  subject: 'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

interface DocumentsLayoutContext {
  documents: DocumentItem[]
  handleOpenChat: (doc: DocumentItem) => void
  handleOpenPreview: (doc: DocumentItem) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => JSX.Element
  renderStatusBadge: (status: string) => JSX.Element
}

// Subject Metadata Registry
const SUBJECT_METADATA: Record<string, { name: string; code: string; desc: string; icon: JSX.Element; color: string }> = {
  COMPSCI: {
    name: 'Software Engineering',
    code: 'CS-402',
    desc: 'Advanced software construction principles, design patterns, testing methodologies, and architectural styles.',
    icon: <Code2 className="h-6 w-6" />,
    color: 'from-indigo-500 to-blue-600'
  },
  MATHEMATICS: {
    name: 'Mathematics',
    code: 'MATH-101',
    desc: 'Fundamental limits, differential and integral calculus, mathematical modeling, and infinite series.',
    icon: <Atom className="h-6 w-6" />,
    color: 'from-emerald-500 to-teal-600'
  },
  BIOLOGY: {
    name: 'Biology',
    code: 'BIO-201',
    desc: 'Cellular and genetic biochemistry, DNA transcriptions, Mendel inheritance, and biological lab systems.',
    icon: <BookOpen className="h-6 w-6" />,
    color: 'from-rose-500 to-pink-600'
  },
  PHYSICS: {
    name: 'Physics',
    code: 'PHYS-301',
    desc: 'Quantum wave-particle theory, Schrödinger equations, potential barriers, and photoelectric dynamics.',
    icon: <Atom className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-600'
  },
  PHILOSOPHY: {
    name: 'Philosophy',
    code: 'PHIL-101',
    desc: 'Historical epistemology, rationalism vs empiricism, René Descartes methodical doubt, and philosophical ethics.',
    icon: <GraduationCap className="h-6 w-6" />,
    color: 'from-sky-500 to-indigo-600'
  },
  ECONOMICS: {
    name: 'Economics',
    code: 'ECON-202',
    desc: 'Keynesian multiplier models, aggregate economic demand indicators, fiscal policies, and central banking.',
    icon: <Building className="h-6 w-6" />,
    color: 'from-violet-500 to-purple-600'
  },
  GENERAL: {
    name: 'General Education',
    code: 'GEN-100',
    desc: 'Active learning methods, spaced repetition frameworks, study guidelines, and integrated reading processes.',
    icon: <BookMarked className="h-6 w-6" />,
    color: 'from-slate-500 to-slate-700'
  }
}

export function SubjectCategoryPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const activeSubjectKey = (subjectId?.toUpperCase() || 'GENERAL') as keyof typeof SUBJECT_METADATA
  const subject = SUBJECT_METADATA[activeSubjectKey] || SUBJECT_METADATA.GENERAL

  const {
    documents,
    handleOpenPreview,
    renderFileIcon,
    renderStatusBadge
  } = useOutletContext<DocumentsLayoutContext>()

  // Filter documents to include only this specific subject
  const courseDocuments = documents.filter(
    (doc) => doc.subject === activeSubjectKey
  )

  // Fallback documents to ensure exactly 2 cards are always rendered beautifully
  const displayedDocuments = courseDocuments.length >= 2
    ? courseDocuments.slice(0, 2)
    : courseDocuments.length === 1
      ? [
          ...courseDocuments,
          {
            id: 'mock-doc-2',
            title: activeSubjectKey === 'COMPSCI' ? 'System Architecture Guide' : 'Course Syllabus & Objectives',
            fileName: activeSubjectKey === 'COMPSCI' ? 'system_architecture.pdf' : 'syllabus.pdf',
            uploadedAt: '2 days ago',
            uploadedDateObj: new Date(),
            size: '2.4 MB',
            sizeKb: 2457,
            subject: activeSubjectKey,
            status: 'ANALYZED' as const,
            type: 'pdf' as const
          }
        ]
      : [
          {
            id: 'mock-doc-1',
            title: activeSubjectKey === 'COMPSCI' ? 'Software Engineering Principles' : 'Introduction Lecture Slides',
            fileName: activeSubjectKey === 'COMPSCI' ? 'se_principles.pdf' : 'intro_lecture.slides',
            uploadedAt: '1 day ago',
            uploadedDateObj: new Date(),
            size: '4.8 MB',
            sizeKb: 4915,
            subject: activeSubjectKey,
            status: 'ANALYZED' as const,
            type: activeSubjectKey === 'COMPSCI' ? 'pdf' as const : 'slides' as const
          },
          {
            id: 'mock-doc-2',
            title: activeSubjectKey === 'COMPSCI' ? 'CS-402 Lab Workbook' : 'Midterm Study Guide',
            fileName: activeSubjectKey === 'COMPSCI' ? 'lab_workbook.word' : 'study_guide.word',
            uploadedAt: '3 days ago',
            uploadedDateObj: new Date(),
            size: '1.2 MB',
            sizeKb: 1228,
            subject: activeSubjectKey,
            status: 'ANALYZED' as const,
            type: 'word' as const
          }
        ]

  // AI recommendations context mapping
  const getAIRecommendation = () => {
    switch (activeSubjectKey) {
      case 'COMPSCI':
        return 'Mạng Nơ-ron (Neural Networks) có cấu trúc phức tạp. Đề xuất: Đọc kĩ "Neural Networks Whiteboard.png" và làm bộ Flashcard ôn tập để củng cố thuật toán lan truyền ngược!'
      case 'BIOLOGY':
        return 'Bài giảng về Di truyền và Phiên mã có nhiều thuật ngữ Latin. Đề xuất: Đọc tóm tắt thông minh của "Molecular Biology Lecture Notes.docx" để ghi nhớ nhanh bào quan Ty thể!'
      case 'MATHEMATICS':
        return 'Bảng vi phân & tích phân là trọng tâm kỳ thi sắp tới. Đề xuất: Mở bảng "Mathematics Cheat Sheet.pdf", nhấp vào "AI Summary" để ôn lại định lý chuỗi Taylor!'
      case 'PHYSICS':
        return 'Khái niệm Lưỡng tính sóng hạt khá trừu tượng. Đề xuất: Sử dụng trợ lý AI Chat để giải nghĩa chi tiết bước sóng De Broglie trong tệp "Intro to Quantum Mechanics"!'
      case 'PHILOSOPHY':
        return 'Thuyết Duy lý của Descartes đối lập sâu sắc với Thuyết Duy nghiệm. Đề xuất: Học 3 thẻ ghi nhớ (Flashcards) trong tệp triết học để nắm rõ định nghĩa Cogito ergo sum!'
      case 'ECONOMICS':
        return 'Công thức số nhân vĩ mô Keynesian rất dễ nhầm lẫn. Đề xuất: Mở tài liệu bộ dữ liệu để xem bản đồ tóm tắt nhanh về chính sách tài khóa của Ngân hàng Trung ương!'
      default:
        return 'Đề xuất: Sử dụng tính năng Upload để tải lên tài liệu mới cho môn học này, trợ lý AI sẽ tự động sinh tóm tắt và câu hỏi ôn tập thông minh trong 30 giây!'
    }
  }

  // Trigger flashcards on first document in this subject as the quiz trigger
  const handleLaunchPracticeQuiz = () => {
    const targetDoc = courseDocuments[0] || displayedDocuments[0]
    if (targetDoc) {
      handleOpenPreview(targetDoc)
    } else {
      alert('Vui lòng tải lên ít nhất một tài liệu thuộc môn học này để kích hoạt AI Study Assistant!')
    }
  }

  return (
    <div className="space-y-7 animate-fade-in pb-12">
      
      {/* Back Link Breadcrumb */}
      <div className="-mb-2">
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Documents
        </button>
      </div>

      {/* Dynamic Header Row */}
      <div className="relative overflow-hidden rounded-3xl border border-border/85 bg-white p-6 shadow-xs sm:p-7">
        {/* Background gradient pill */}
        <div className={cn("absolute right-0 top-0 h-40 w-40 rounded-full bg-gradient-to-br opacity-[0.04] blur-3xl", subject.color)} />
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md shadow-primary/10", subject.color)}>
              {subject.icon}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-foreground sm:text-3xl tracking-tight">
                  {subject.name}
                </h1>
              </div>
              
              {/* Under-title details: e.g. "12 DOCUMENTS" and "Active Course: CS-402" */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-extrabold tracking-wider text-muted uppercase">
                <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
                  {courseDocuments.length || 12} DOCUMENTS
                </span>
                <span className="inline-block h-3.5 w-px bg-slate-200" />
                <span className="flex items-center gap-1.5 bg-blue-50/50 border border-blue-100/80 px-2.5 py-1 rounded-lg text-primary font-bold">
                  Active Course: {subject.code}
                </span>
  essential?: boolean
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

const SUBJECT_MAP: Record<string, { title: string; courseCode: string }> = {
  COMPSCI: { title: 'Software Engineering', courseCode: 'CS-402' },
  MATHEMATICS: { title: 'Mathematics', courseCode: 'Calculus II' },
  BIOLOGY: { title: 'Biology', courseCode: 'Genetics Lab' },
  PHYSICS: { title: 'Physics', courseCode: 'PHY-301' },
  PHILOSOPHY: { title: 'Philosophy', courseCode: 'PHIL-101' },
  ECONOMICS: { title: 'Economics', courseCode: 'ECON-201' },
  GENERAL: { title: 'General Studies', courseCode: 'GEN-101' }
}

export default function SubjectCategoryPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const activeSubjectId = (subjectId || 'GENERAL').toUpperCase()
  const subjectInfo = SUBJECT_MAP[activeSubjectId] || SUBJECT_MAP.GENERAL

  const {
    documents,
    openUploadModal,
    openChatDrawer,
    openPreviewModal,
    openQuizModal,
    handleDownloadFile,
    handleDeleteDocument,
    renderFileIcon,
    renderStatusBadge
  } = useOutletContext<DocumentsContextType>()

  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeMenuId && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        if (!target.closest('.menu-trigger-btn')) {
          setActiveMenuId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeMenuId])

  // Filter documents strictly by active subject
  const subjectDocuments = documents.filter((doc) => doc.subject === activeSubjectId)

  // Filter logic within active subject
  const filteredDocuments = subjectDocuments.filter((doc) => {
    const titleMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const filenameMatch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const queryMatch = searchQuery ? (titleMatch || filenameMatch) : true

    const typeMatch = typeFilter === 'All' ? true : doc.type === typeFilter.toLowerCase()

    return queryMatch && typeMatch
  })

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Figma Header Breadcrumb & Actions */}
      <div className="space-y-4 pt-2">
        <button 
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-primary transition-colors focus:outline-none w-fit"
        >
          &larr; Back to Documents
        </button>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {/* Terminal folder box */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EBF1FF] text-[#2563eb] border border-blue-100/50 shadow-xs animate-pulse-slow">
              <svg className="h-7 w-7 text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M6 8l4 4-4 4" />
                <line x1="12" y1="16" x2="18" y2="16" />
              </svg>
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {subjectInfo.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-slate-400">
                <span className="inline-flex items-center rounded-full bg-[#EBF1FF] px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb] border border-blue-100/50 uppercase tracking-wider">
                  {subjectDocuments.length} FILE{subjectDocuments.length !== 1 ? 'S' : ''}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">Active Course: {subjectInfo.courseCode}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Filter, Upload New) */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              className="group flex items-center gap-2 rounded-xl border border-border/80 bg-white px-5 py-2.5 font-bold text-body shadow-xs hover:bg-slate-50 transition-all duration-200 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
              Filter
            </Button>
            <Button
              onClick={() => navigate(`/dashboard/documents/subject/${activeSubjectKey}/upload`)}
              className="group flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-md shadow-primary/10 hover:bg-primary-dark hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          <div className="flex items-center gap-3 self-end md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowFilters(prev => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm border shadow-sm transition-all h-[42px]",
                showFilters 
                  ? "border-[#2563eb]/40 bg-blue-50 text-[#2563eb]" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              Filter
            </Button>

            <Button
              onClick={openUploadModal}
              className="group flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 font-bold text-sm text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all h-[42px]"
            >
              <Plus className="h-4.5 w-4.5" />
              Upload New
            </Button>
          </div>
        </div>
      </div>

      {/* AI Dashboard Section */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-foreground flex items-center gap-2 tracking-tight">
          <Bot className="h-5 w-5 text-primary/80 animate-pulse" />
          AI Course Dashboard
        </h2>

        {/* Telemetry Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Card 1: Study Progress */}
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Study Progress</span>
              <TrendingUp className="h-5 w-5 text-primary/80" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-foreground">82%</span>
              <span className="text-xs text-emerald-600 font-semibold ml-2">Progressing Well</span>
              {/* Progress bar loader */}
              <div className="mt-3 w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: '82%' }}
                />
              </div>
            </div>
            <p className="mt-2.5 text-[11px] font-semibold text-muted">Goal completion pace: Optimal</p>
          </div>

          {/* Card 2: Average Score */}
          <div className="rounded-2xl border border-border/80 bg-white p-5 shadow-xs flex flex-col justify-between min-h-[148px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">Average Score</span>
              <Award className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-foreground">9.0</span>
              <span className="text-sm font-bold text-foreground/80 ml-1">/ 10</span>
              <span className="text-xs text-primary font-bold ml-3 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">Rank #5</span>
            </div>
            <p className="mt-auto text-[11px] font-semibold text-muted">Outperforming 92% of students in cohort</p>
          </div>

          {/* Card 3: AI Recommendation */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-5 shadow-xs flex flex-col justify-between min-h-[148px] relative overflow-hidden">
            {/* sparkles icon top-right background decoration */}
            <div className="absolute right-2 top-2 text-blue-500/20">
              <Sparkles className="h-16 w-16" />
            </div>
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                AI Recommendation
              </span>
            </div>
            <p className="mt-3.5 text-xs text-body font-medium leading-relaxed z-10 line-clamp-3" title={getAIRecommendation()}>
              {getAIRecommendation()}
            </p>
            <p className="mt-2.5 text-[10px] font-bold text-primary z-10">Instant intelligence active</p>
          </div>

        </div>
      </div>

      {/* Recent Materials Section */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h3 className="text-base font-extrabold text-foreground tracking-tight">Recent Materials</h3>
          <button
            onClick={() => navigate('/dashboard/documents')}
            className="text-xs font-bold text-primary hover:text-primary-dark hover:underline transition-colors focus:outline-none cursor-pointer"
          >
            View All
          </button>
        </div>
        
        {/* Exactly 2 Material Cards đúng như Figma */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {displayedDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleOpenPreview(doc)}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-white p-5 shadow-xs hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-300 min-h-[128px]"
            >
              <div className="flex items-start justify-between">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-primary/5 transition-colors">
                  {renderFileIcon(doc.type)}
                </div>
                {renderStatusBadge(doc.status)}
              </div>
              <div className="mt-4">
                <h4 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition-colors" title={doc.title || doc.fileName}>
                  {doc.title || doc.fileName}
                </h4>
                <p className="mt-1 text-xs text-muted font-medium">
                  {doc.uploadedAt} • {doc.size}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section: AI Study Assistant */}
      <div className="pt-2">
        <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-blue-50/15 via-white to-blue-50/5 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left z-10">
            {/* AI illustration icon */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-primary border border-primary/10 shadow-inner">
              <BrainCircuit className="h-9 w-9 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-foreground tracking-tight">
                AI Study Assistant
              </h4>
              <p className="text-xs text-muted max-w-xl leading-relaxed font-medium">
                Accelerate your learning path. Launch interactive practice quizzes and smart spaced-repetition flashcards customized precisely from your subject materials.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto z-10">
            <Button
              onClick={handleLaunchPracticeQuiz}
              className="w-full md:w-auto px-8 py-3 rounded-xl font-extrabold text-xs text-white bg-primary shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Start Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* AI Dashboard Section: metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Study Progress */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">STUDY PROGRESS</span>
          <span className="text-[34px] font-black text-slate-900 mt-2 block leading-none">82%</span>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-auto">
            <div className="bg-[#2563eb] h-full rounded-full transition-all duration-500" style={{ width: '82%' }} />
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between h-[135px]">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">AVERAGE SCORE</span>
          <span className="text-[34px] font-black text-slate-900 mt-2 block leading-none">A-</span>
          <span className="text-sm font-semibold text-[#2563eb] mt-auto">Top 5% of class</span>
        </div>

        {/* Card 3: AI Recommendation with animated sparkles */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DBE8FF] bg-[#F3F7FF] p-6 shadow-xs flex flex-col justify-between h-[135px]">
          <div className="absolute right-5 bottom-5 text-[#93C5FD] flex gap-1 items-end select-none pointer-events-none">
            <svg className="h-6 w-6 text-[#2563eb]/30 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
            </svg>
            <div className="flex flex-col gap-1">
              <svg className="h-3 w-3 text-[#2563eb]/20 animate-bounce-slow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
              <svg className="h-4.5 w-4.5 text-[#2563eb]/40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
            </div>
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">AI RECOMMENDATION</span>
          <span className="text-[17px] font-extrabold text-[#2563eb] leading-snug mt-auto max-w-[185px]">
            {activeSubjectId === 'COMPSCI' ? 'Review UML Diagrams' : activeSubjectId === 'MATHEMATICS' ? 'Practice Taylor Series' : activeSubjectId === 'BIOLOGY' ? 'Review Ribosomal mRNA' : 'Review Core Materials'}
          </span>
        </div>
      </div>

      {/* Filter / Search workspace (toggled by Filter button) */}
      {(showFilters || searchQuery || typeFilter !== 'All') && (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between animate-fade-in">
          {/* Search field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2563eb]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dropdown & View Mode selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5">
              <span className="text-xs font-medium text-slate-400">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Types</option>
                <option value="Pdf">PDF</option>
                <option value="Word">Word</option>
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Slides">Slides</option>
              </select>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1" />

            {/* Grid/List View switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-lg p-1.5 transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-white text-[#2563eb] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                )}
                title="List View"
                aria-label="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Materials / Workspace Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
            RECENT MATERIALS
          </h2>
        </div>

        {/* Empty state or Document List */}
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800">No documents found</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm">
              We couldn't find any documents matching your filters in this folder.
            </p>
            <Button
              variant="secondary"
              className="mt-6 rounded-xl text-sm"
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('All')
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => {
              // High fidelity checks for specific COMPSCI mock documents
              if (doc.id === 'doc-design-patterns') {
                return (
                  <div 
                    key={doc.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-blue-500/20 cursor-pointer h-[200px]"
                    onClick={() => openPreviewModal(doc)}
                  >
                    {/* Top action block */}
                    <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <svg className="h-5.5 w-5.5 stroke-[2] text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="7" height="9" rx="1" />
                          <rect x="14" y="3" width="7" height="5" rx="1" />
                          <rect x="14" y="12" width="7" height="9" rx="1" />
                          <rect x="3" y="16" width="7" height="5" rx="1" />
                        </svg>
                      </div>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="menu-trigger-btn rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                        {activeMenuId === doc.id && (
                          <div ref={menuRef} className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-fade-in">
                            <button onClick={() => openChatDrawer(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors"><MessageSquare className="h-4 w-4" />Chat with AI</button>
                            <button onClick={() => openPreviewModal(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                            <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title and details */}
                    <div className="mt-4 flex-1">
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-tight truncate">
                        {doc.title || doc.fileName}
                      </h3>
                      <p className="mt-1 text-[13px] text-slate-400 line-clamp-2 leading-normal font-medium">
                        Comprehensive guide to Creational, Structural, and Behavioral patterns in Java.
                      </p>
                    </div>

                    {/* Footer with avatar list */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-400 font-medium">Updated 2h ago</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        <div className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-[9px] font-black border-2 border-white shadow-xs" title="John Doe">JD</div>
                        <div className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-[9px] font-black border-2 border-white shadow-xs" title="Alice Lam">AL</div>
                      </div>
                    </div>
                  </div>
                )
              }

              if (doc.id === 'doc-agile') {
                return (
                  <div 
                    key={doc.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-blue-500/20 cursor-pointer h-[200px]"
                    onClick={() => openPreviewModal(doc)}
                  >
                    {/* Top action block */}
                    <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <svg className="h-5.5 w-5.5 text-[#7C3AED]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="15" cy="4" r="2" />
                          <path d="M12 8l-3-1-3 3M10 13l2-4 3 2 3-2M9 13v4l-3 3M12 14v3l3 2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="menu-trigger-btn rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          <MoreVertical className="h-4.5 w-4.5" />
                        </button>
                        {activeMenuId === doc.id && (
                          <div ref={menuRef} className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-fade-in">
                            <button onClick={() => openChatDrawer(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors"><MessageSquare className="h-4 w-4" />Chat with AI</button>
                            <button onClick={() => openPreviewModal(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                            <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title and details */}
                    <div className="mt-4 flex-1">
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors leading-tight truncate">
                        {doc.title || doc.fileName}
                      </h3>
                      <p className="mt-1 text-[13px] text-slate-400 line-clamp-2 leading-normal font-medium">
                        Deep dive into Scrum, Kanban, and Extreme Programming workflow management.
                      </p>
                    </div>

                    {/* Footer with essential badge */}
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-400 font-medium">Updated Yesterday</span>
                      <span className="rounded bg-[#F5F3FF] border border-[#DDD6FE]/40 px-2 py-0.5 text-[9px] font-bold text-[#7C3AED] tracking-wider uppercase">
                        ESSENTIAL
                      </span>
                    </div>
                  </div>
                )
              }

              // Standard styled cards for other files
              return (
                <div 
                  key={doc.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-blue-500/20 cursor-pointer h-[200px]"
                  onClick={() => openPreviewModal(doc)}
                >
                  <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                    {renderFileIcon(doc.type)}
                    
                    <div className="relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                        className="menu-trigger-btn rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none transition-colors"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>

                      {activeMenuId === doc.id && (
                        <div ref={menuRef} className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-fade-in">
                          <button onClick={() => openChatDrawer(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors"><MessageSquare className="h-4 w-4" />Chat with AI</button>
                          <button onClick={() => openPreviewModal(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                          <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <h3 className="line-clamp-1 text-[15px] font-bold text-slate-800 group-hover:text-primary transition-colors" title={doc.title || doc.fileName}>
                      {doc.title || doc.fileName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 font-medium">
                      {doc.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 font-medium">
                      {doc.uploadedAt}
                      <span className="text-[10px] text-slate-200">&bull;</span>
                      <span>{doc.size}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                      {doc.subject}
                    </span>
                    {renderStatusBadge(doc.status)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">File Size</th>
                    <th className="px-6 py-4">Upload Date</th>
                    <th className="px-6 py-4">AI Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="group hover:bg-slate-50/30 transition-colors cursor-pointer"
                      onClick={() => openPreviewModal(doc)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {renderFileIcon(doc.type)}
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors">
                              {doc.title || doc.fileName}
                            </h4>
                            <span className="text-xs text-slate-400">{doc.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                          {doc.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {doc.uploadedAt.replace('Uploaded ', '')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex">{renderStatusBadge(doc.status)}</div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openChatDrawer(doc)}
                            className="rounded-lg text-[#2563eb] hover:bg-blue-50/50"
                            title="Chat with AI"
                          >
                            <MessageSquare className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(doc)}
                            className="rounded-lg text-slate-500 hover:bg-slate-100/50"
                            title="Download"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* AI Study Assistant Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 md:p-8 text-slate-800 shadow-sm relative flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
        <div className="flex-1 space-y-3.5">
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-900">
            AI Study Assistant
          </h3>
          <p className="text-[14px] text-slate-500 max-w-lg leading-relaxed font-medium">
            Based on your recent uploads in {subjectInfo.title}, I've generated a comprehensive practice quiz. Ready to test your knowledge?
          </p>
          <Button
            onClick={openQuizModal}
            className="rounded-xl bg-[#2563eb] hover:bg-blue-700 px-6 py-3 font-bold text-white shadow-md shadow-blue-500/10 active:scale-95 transition-all duration-300 text-sm"
          >
            Start Quiz
          </Button>
        </div>

        <div className="shrink-0">
          <svg className="h-24 w-24 md:h-28 md:w-28 text-blue-600/10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M72 88c0-7.8 4.2-14 8-19.5 3.3-4.8 4.8-10.8 4.8-17.5C84.8 33.6 71.4 20 54.8 20c-16.6 0-28 12.2-29.6 27.6-.8 7.6 1.2 13 3.6 16.4.8 1.2.8 2.6.4 3.8l-2 5.2c-.8 2 0 4.2 1.8 5l5.2 2.2c1 .4 1.8 1.4 1.8 2.6v3.2c0 2 1.6 3.6 3.6 3.6h28c2 0 3.6-1.6 3.6-3.6 0-3.2.8-6.2.8-8z" fill="currentColor" />
            <g transform="translate(54.8, 47) scale(0.9)">
              <path d="M-8 0a8 8 0 1 0 16 0a8 8 0 0 0-16 0zm3 0a5 5 0 1 1 10 0a5 5 0 0 1-10 0z" fill="white" />
              <rect x="-1.5" y="-11" width="3" height="4" rx="1" fill="white" />
              <rect x="-1.5" y="7" width="3" height="4" rx="1" fill="white" />
              <rect x="-11" y="-1.5" width="4" height="3" rx="1" fill="white" />
              <rect x="7" y="-1.5" width="4" height="3" rx="1" fill="white" />
              <rect x="-1.5" y="-11" width="3" height="4" rx="1" fill="white" transform="rotate(45)" />
              <rect x="-1.5" y="-11" width="3" height="4" rx="1" fill="white" transform="rotate(135)" />
              <rect x="-1.5" y="-11" width="3" height="4" rx="1" fill="white" transform="rotate(225)" />
              <rect x="-1.5" y="-11" width="3" height="4" rx="1" fill="white" transform="rotate(315)" />
            </g>
          </svg>
        </div>
      </div>

      {/* Unified Bottom Footer */}
      <div className="mt-16 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[13px] font-semibold text-slate-400">
        <div>
          © 2024 AI Study Hub. Empowering Deep Learning.
        </div>
        <div className="flex gap-6">
          <button onClick={() => openUploadModal()} className="hover:text-primary transition-colors focus:outline-none">Privacy Policy</button>
          <button onClick={() => openUploadModal()} className="hover:text-primary transition-colors focus:outline-none">Terms of Service</button>
          <button onClick={() => openUploadModal()} className="hover:text-primary transition-colors focus:outline-none">Help Center</button>
        </div>
      </div>
    </div>
  )
}

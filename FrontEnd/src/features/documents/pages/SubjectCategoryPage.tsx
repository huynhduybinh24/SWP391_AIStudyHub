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

    </div>
  )
}

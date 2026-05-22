import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  Search,
  Grid,
  List,
  MoreVertical,
  Plus,
  MessageSquare,
  ExternalLink,
  Download,
  Trash2,
  CloudUpload,
  SlidersHorizontal,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  BookOpen,
  FileText,
  Bot,
  TrendingUp,
  Award,
  BrainCircuit
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

const SUBJECT_MAP: Record<string, { title: string; courseCode: string }> = {
  COMPSCI: { title: 'Software Engineering', courseCode: 'CS-402' },
  MATHEMATICS: { title: 'Mathematics', courseCode: 'Calculus II' },
  BIOLOGY: { title: 'Biology', courseCode: 'Genetics Lab' },
  PHYSICS: { title: 'Physics', courseCode: 'PHY-301' },
  PHILOSOPHY: { title: 'Philosophy', courseCode: 'PHIL-101' },
  ECONOMICS: { title: 'Economics', courseCode: 'ECON-201' },
  NEUROSCIENCE: { title: 'Neuroscience', courseCode: 'NEURO-301' },
  PSYCHOLOGY: { title: 'Psychology', courseCode: 'PSYCH-101' },
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

  // Dynamic AI study recommendation advice tailored to each subject
  const getAIRecommendation = () => {
    switch (activeSubjectId) {
      case 'COMPSCI':
        return 'Focus on reviewing the "Design Patterns" cheat-sheet and practicing solid MVC principles before the upcoming coding lab.'
      case 'MATHEMATICS':
        return 'Practice active derivation of double integrals. Try building a quiz from the chapter 4 polar coordinates study guide.'
      case 'BIOLOGY':
        return 'Review mitochondrial DNA replication slides. Flashcards on transcription factors are highly recommended for your quiz.'
      case 'PHYSICS':
        return 'Master the equations for electromagnetic wave propagation. Re-run the laboratory simulation on optics diffraction.'
      case 'PHILOSOPHY':
        return 'Analyze key epistemological viewpoints. Draft a short outline comparing rationalist and empiricist arguments.'
      case 'ECONOMICS':
        return 'Review marginal revenue calculations and game theory payoff matrices. Pay attention to Nash equilibrium concepts.'
      default:
        return 'Review your uploaded study materials regularly and generate interactive AI quizzes to strengthen memory retention.'
    }
  }

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

  // Exactly 2 material cards for recent materials as per Figma design mockup
  const displayedDocuments = filteredDocuments.slice(0, 2)

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Figma Header Breadcrumb & Actions */}
      <div className="space-y-4 pt-2">
        <button 
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-[#2563eb] transition-colors focus:outline-none w-fit"
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
                  {activeSubjectId === 'COMPSCI' ? '12' : subjectDocuments.length} DOCUMENTS
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold text-slate-500">Active Course: {subjectInfo.courseCode}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Filter, Upload New) */}
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
              onClick={() => navigate(`/dashboard/documents/subject/${subjectId}/upload`)}
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
        {/* Telemetry Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* Card 1: Study Progress */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[148px]">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">STUDY PROGRESS</span>
              <span className="text-3xl font-black text-slate-900 block mt-2.5 leading-none">82%</span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#2563eb] h-2 rounded-full transition-all duration-500"
                  style={{ width: '82%' }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Average Score */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[148px]">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">AVERAGE SCORE</span>
              <span className="text-3xl font-black text-slate-900 block mt-2.5 leading-none">
                {activeSubjectId === 'COMPSCI' ? 'A-' : '9.0'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-blue-600 font-extrabold">
                {activeSubjectId === 'COMPSCI' ? 'Top 5% of class' : 'Rank #5'}
              </p>
            </div>
          </div>

          {/* Card 3: AI Recommendation */}
          <div className={cn(
            "rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[148px] relative overflow-hidden border",
            activeSubjectId === 'COMPSCI'
              ? "border-indigo-100 bg-[#EEF2FF]/60"
              : "border-blue-100 bg-blue-50/20"
          )}>
            {/* Sparkles backdrop */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500/10 pointer-events-none select-none">
              <Sparkles className="h-16 w-16 stroke-[1.2]" />
            </div>
            
            <div className="z-10">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest block",
                activeSubjectId === 'COMPSCI' ? "text-[#4F46E5]" : "text-primary"
              )}>
                AI Recommendation
              </span>
              <p className={cn(
                "text-[15px] font-black tracking-tight mt-2.5 leading-snug",
                activeSubjectId === 'COMPSCI' ? "text-[#3155F6]" : "text-slate-800"
              )}>
                {activeSubjectId === 'COMPSCI' ? 'Review UML Diagrams' : getAIRecommendation()}
              </p>
            </div>
            
            <div className="mt-4 z-10">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider block",
                activeSubjectId === 'COMPSCI' ? "text-indigo-400" : "text-primary/70"
              )}>
                Instant intelligence active
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Recent Materials Section */}
      {(subjectDocuments.length > 2 || activeSubjectId === 'COMPSCI') && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase">RECENT MATERIALS</h3>
            <button
              onClick={() => navigate('/dashboard/documents')}
              className="text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none cursor-pointer"
            >
              View All
            </button>
          </div>
          
          {/* Exactly 2 Material Cards đúng như Figma */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {activeSubjectId === 'COMPSCI' ? (
              <>
                {/* Card 1: Design Patterns */}
                <div
                  onClick={() => {
                    const doc = subjectDocuments.find(d => d.id === 'doc-design-patterns') || subjectDocuments[0]
                    if (doc) openPreviewModal(doc)
                  }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-500/20 hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-300 min-h-[178px]"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <svg className="h-5.5 w-5.5 stroke-[2] text-[#2563eb]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="7" height="9" rx="1" />
                          <rect x="14" y="3" width="7" height="5" rx="1" />
                          <rect x="14" y="12" width="7" height="9" rx="1" />
                          <rect x="3" y="16" width="7" height="5" rx="1" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors">
                        Design Patterns
                      </h4>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-semibold">
                        Comprehensive guide to Creational, Structural, and Behavioral patterns in Java.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400 font-semibold">Updated 2h ago</span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <div className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white text-[9px] font-black border-2 border-white shadow-xs" title="John Doe">JD</div>
                      <div className="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-[9px] font-black border-2 border-white shadow-xs" title="Alice Lam">AL</div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Agile Methodologies */}
                <div
                  onClick={() => {
                    const doc = subjectDocuments.find(d => d.id === 'doc-agile') || subjectDocuments[1]
                    if (doc) openPreviewModal(doc)
                  }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-500/20 hover:shadow-md hover:-translate-y-1 cursor-pointer transition-all duration-300 min-h-[178px]"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <svg className="h-5.5 w-5.5 text-[#7C3AED]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="15" cy="4" r="2" />
                          <path d="M12 8l-3-1-3 3M10 13l2-4 3 2 3-2M9 13v4l-3 3M12 14v3l3 2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-base font-extrabold text-slate-800 group-hover:text-primary transition-colors">
                        Agile Methodologies
                      </h4>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-semibold">
                        Deep dive into Scrum, Kanban, and Extreme Programming workflow management.
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400 font-semibold">Updated Yesterday</span>
                    <span className="rounded bg-[#F5F3FF] border border-[#DDD6FE]/40 px-2 py-0.5 text-[9px] font-bold text-[#7C3AED] tracking-wider uppercase">
                      ESSENTIAL
                    </span>
                  </div>
                </div>
              </>
            ) : (
              displayedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => openPreviewModal(doc)}
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
              ))
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: AI Study Assistant */}
      <div className="pt-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden min-h-[150px]">
          {/* Head silhouette gear SVG graphic on the right */}
          <div className="absolute right-0 bottom-0 top-0 w-72 md:block hidden select-none pointer-events-none opacity-45 z-0">
            <svg className="h-full w-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M110 30C76.8629 30 50 56.8629 50 90C50 109.525 59.3333 121.2 63.6667 131C67.6667 140 64 148 60 156C56 164 63 172 73.5 172C84 172 89 166 97 166C105 166 108 172 118.5 172C129 172 136 164 132 156C128 148 124.333 140 128.333 131C132.667 121.2 142 109.525 142 90C142 56.8629 115.137 30 110 30Z" fill="#2563eb" fillOpacity="0.04"/>
              <circle cx="110" cy="90" r="16" stroke="#2563eb" strokeWidth="2.5" strokeOpacity="0.06" strokeDasharray="5 5" />
              <circle cx="110" cy="90" r="8" fill="#2563eb" fillOpacity="0.06" />
            </svg>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left z-10 flex-1">
            <div className="space-y-1.5 max-w-2xl">
              <h4 className="text-xl font-black text-slate-800 tracking-tight">
                AI Study Assistant
              </h4>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">
                {activeSubjectId === 'COMPSCI'
                  ? 'Based on your recent uploads, I\'ve generated a practice quiz for the "Design Patterns" section. Ready to test your knowledge?'
                  : 'Accelerate your learning path. Launch interactive practice quizzes and smart spaced-repetition flashcards customized precisely from your subject materials.'
                }
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto z-10 self-end md:self-center">
            <Button
              onClick={openQuizModal}
              className="w-full md:w-auto px-8 py-3 rounded-xl font-extrabold text-xs text-white bg-[#2563eb] shadow-md shadow-blue-500/10 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer"
            >
              Start Quiz
            </Button>
          </div>
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

      {/* Subject Materials Workspace Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
            SUBJECT MATERIALS WORKSPACE
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
                    onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)}
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
                            <button onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                            <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title and details */}
                    <div className="mt-4 flex-1">
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-[#2563eb] transition-colors leading-tight truncate">
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
                    onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)}
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
                            <button onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                            <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                            <div className="my-1 border-t border-slate-100" />
                            <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title and details */}
                    <div className="mt-4 flex-1">
                      <h3 className="text-base font-extrabold text-slate-800 group-hover:text-[#2563eb] transition-colors leading-tight truncate">
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
                  onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)}
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
                          <button onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><ExternalLink className="h-4 w-4" />Open & View</button>
                          <button onClick={() => handleDownloadFile(doc)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"><Download className="h-4 w-4" />Download File</button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => handleDeleteDocument(doc.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="h-4 w-4" />Delete Document</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <h3 className="line-clamp-1 text-[15px] font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors" title={doc.title || doc.fileName}>
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
                      onClick={() => navigate(`/dashboard/documents/document/${doc.id}`)}
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




    </div>
  )
}

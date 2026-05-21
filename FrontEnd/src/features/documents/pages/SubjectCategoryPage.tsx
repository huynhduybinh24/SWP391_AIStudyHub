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

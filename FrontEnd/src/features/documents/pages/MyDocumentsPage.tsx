import { useState, useRef, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
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
  FolderPlus,
  FileText,
  SlidersHorizontal,
  Pencil
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

export default function MyDocumentsPage() {
  const navigate = useNavigate()
  const {
    documents,
    openUploadModal,
    openChatDrawer,
    handleDownloadFile,
    handleDeleteDocument,
    renderFileIcon,
    renderStatusBadge
  } = useOutletContext<DocumentsContextType>()

  const [searchQuery, setSearchQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const handleOpenDocument = (docId: string) => {
    setActiveMenuId(null)
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-auto"]')
      scrollableContainers.forEach((container) => {
        container.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        })
      })
    }
    navigate(`/dashboard/documents/document/${docId}`)
  }

  const menuRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)

  // Auto-reset filters on collapse, and smooth scroll to filter panel on open
  useEffect(() => {
    if (!showFilters) {
      setSearchQuery('')
      setSubjectFilter('All')
      setTypeFilter('All')
    } else {
      setTimeout(() => {
        filterContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [showFilters])

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

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    const titleMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const filenameMatch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const queryMatch = searchQuery ? (titleMatch || filenameMatch) : true

    const subjectMatch = subjectFilter === 'All' ? true : doc.subject === subjectFilter.toUpperCase()
    const typeMatch = typeFilter === 'All' ? true : doc.type === typeFilter.toLowerCase()

    return queryMatch && subjectMatch && typeMatch
  })


  // Dynamic counts for top folder cards
  const compsCount = documents.filter(d => d.subject === 'COMPSCI').length
  const mathCount = documents.filter(d => d.subject === 'MATHEMATICS').length
  const bioCount = documents.filter(d => d.subject === 'BIOLOGY').length

  return (
    <div className="space-y-8">
      {/* Figma Header Block for general Documents Page */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {/* Folder layout icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EBF1FF] text-[#2563eb] border border-blue-100/50 shadow-xs dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-450">
              <FileText className="h-7 w-7 text-[#2563eb] dark:text-blue-400 stroke-[1.8]" />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                My Documents
              </h1>
              <p className="text-[13px] md:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
                Manage and organize your study materials with AI. Generate summaries, flashcards, and deep-dives instantly.
              </p>
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
                  ? "border-[#2563eb]/40 bg-blue-50 text-[#2563eb] dark:bg-blue-950/30 dark:border-blue-500/50 dark:text-blue-400" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
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

      {/* Folders List Grid Section */}
      <div className="space-y-3.5">
        <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">FOLDERS / SUBJECTS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* Software Engineering Folder Card */}
          <div 
            onClick={() => navigate('/dashboard/documents/subject/COMPSCI')}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#2563eb]/45 hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-300 dark:border-blue-500/30">
              <FolderPlus className="h-5.5 w-5.5 text-[#2563eb] group-hover:text-white dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                Software Engineering
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                CS-402 &bull; {compsCount} Document{compsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {/* Mathematics Folder Card */}
          <div 
            onClick={() => navigate('/dashboard/documents/subject/MATHEMATICS')}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#2563eb]/45 hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-300 dark:border-blue-500/30">
              <FolderPlus className="h-5.5 w-5.5 text-[#2563eb] group-hover:text-white dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                Mathematics
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                Calculus II &bull; {mathCount} Document{mathCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Biology Folder Card */}
          <div 
            onClick={() => navigate('/dashboard/documents/subject/BIOLOGY')}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-[#2563eb]/45 hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-300 dark:border-blue-500/30">
              <FolderPlus className="h-5.5 w-5.5 text-[#2563eb] group-hover:text-white dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors truncate">
                Biology
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                Genetics Lab &bull; {bioCount} Document{bioCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and List Workspace */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
          <h2 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
            ALL MATERIALS WORKSPACE
          </h2>
        </div>

        {/* Filter bar controls */}
        {showFilters && (
          <div ref={filterContainerRef} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between animate-fade-in dark:border-slate-800 dark:bg-slate-900">
          {/* Search field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2563eb]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 transition-all dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1 dark:text-slate-200 dark:bg-slate-850"
              >
                <option value="All" className="dark:bg-slate-900 dark:text-slate-100">All Subjects</option>
                <option value="Mathematics" className="dark:bg-slate-900 dark:text-slate-100">Mathematics</option>
                <option value="Biology" className="dark:bg-slate-900 dark:text-slate-100">Biology</option>
                <option value="Physics" className="dark:bg-slate-900 dark:text-slate-100">Physics</option>
                <option value="Compsci" className="dark:bg-slate-900 dark:text-slate-100">CompSci</option>
                <option value="Philosophy" className="dark:bg-slate-900 dark:text-slate-100">Philosophy</option>
                <option value="Economics" className="dark:bg-slate-900 dark:text-slate-100">Economics</option>
                <option value="Neuroscience" className="dark:bg-slate-900 dark:text-slate-100">Neuroscience</option>
                <option value="Psychology" className="dark:bg-slate-900 dark:text-slate-100">Psychology</option>
                <option value="General" className="dark:bg-slate-900 dark:text-slate-100">General Studies</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1 dark:text-slate-200 dark:bg-slate-850"
              >
                <option value="All" className="dark:bg-slate-900 dark:text-slate-100">All Types</option>
                <option value="Pdf" className="dark:bg-slate-900 dark:text-slate-100">PDF</option>
                <option value="Word" className="dark:bg-slate-900 dark:text-slate-100">Word</option>
                <option value="Text" className="dark:bg-slate-900 dark:text-slate-100">Text</option>
                <option value="Image" className="dark:bg-slate-900 dark:text-slate-100">Image</option>
                <option value="Slides" className="dark:bg-slate-900 dark:text-slate-100">Slides</option>
              </select>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1 dark:bg-slate-800" />

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-800 dark:bg-slate-850">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition-all duration-200 cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-white text-[#2563eb] shadow-xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'rounded-lg p-1.5 transition-all duration-200 cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-white text-[#2563eb] shadow-xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350'
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


        {/* Empty state or list render */}
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] dark:bg-blue-955/50 dark:text-blue-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">No documents found</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm dark:text-slate-500">
              We couldn't find any documents matching your filters. Try adjusting your query or filters.
            </p>
            <Button
              variant="secondary"
              className="mt-6 rounded-xl text-sm"
              onClick={() => {
                setSearchQuery('')
                setSubjectFilter('All')
                setTypeFilter('All')
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-[#2563eb]/20 cursor-pointer dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30"
                onClick={() => handleOpenDocument(doc.id)}
              >
                {/* File Top Icon & Menu */}
                <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                  {renderFileIcon(doc.type)}
                  
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                      className="menu-trigger-btn rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 focus:outline-none transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      aria-label="Open document actions"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>

                    {activeMenuId === doc.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-fade-in dark:border-slate-800 dark:bg-slate-900"
                        role="menu"
                      >
                        <button
                          onClick={() => openChatDrawer(doc)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Chat with AI
                        </button>
                        <button
                          onClick={() => handleOpenDocument(doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open & View
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/documents/document/${doc.id}/edit`)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Details
                        </button>
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          Download File
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title & Info */}
                <div className="mt-5 flex-1">
                  <h3 className="line-clamp-1 text-[15px] font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors dark:text-slate-100 dark:group-hover:text-blue-400" title={doc.title || doc.fileName}>
                    {doc.title || doc.fileName}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 flex items-center gap-1 font-medium dark:text-slate-500">
                    {doc.uploadedAt}
                    <span className="text-[10px] text-slate-200 dark:text-slate-800">&bull;</span>
                    <span>{doc.size}</span>
                  </p>
                </div>

                {/* Footer Subject & Status */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb] dark:bg-blue-955/40 dark:border-blue-900/50 dark:text-blue-450">
                    {doc.subject}
                  </span>
                  {renderStatusBadge(doc.status)}
                </div>
              </div>
            ))}

            {/* Dotted Card for upload trigger */}
            <button
              onClick={openUploadModal}
              className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/40 p-6 text-center transition-all duration-300 hover:border-[#2563eb]/50 hover:bg-blue-50/20 hover:shadow-xs focus:outline-none min-h-[178px] dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-blue-950/20 cursor-pointer"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] shadow-xs group-hover:scale-110 group-hover:bg-[#2563eb] group-hover:text-white transition-all duration-300 dark:bg-blue-955 dark:text-blue-400">
                <CloudUpload className="h-5 w-5" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors dark:text-slate-200 dark:group-hover:text-blue-400">
                Add New File
              </h4>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Max size 50MB
              </p>
            </button>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-850 dark:text-slate-550">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">File Size</th>
                    <th className="px-6 py-4">Upload Date</th>
                    <th className="px-6 py-4">AI Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="group hover:bg-slate-50/30 transition-colors cursor-pointer dark:hover:bg-slate-850/30"
                      onClick={() => handleOpenDocument(doc.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {renderFileIcon(doc.type)}
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-800 group-hover:text-[#2563eb] transition-colors dark:text-slate-200 dark:group-hover:text-blue-400">
                              {doc.title || doc.fileName}
                            </h4>
                            <span className="text-xs text-slate-400 dark:text-slate-500">{doc.fileName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb] dark:bg-blue-955/40 dark:border-blue-900/50 dark:text-blue-400">
                          {doc.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 dark:text-slate-500">
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
                            className="rounded-lg text-[#2563eb] hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                            title="Chat with AI"
                          >
                            <MessageSquare className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/documents/document/${doc.id}/edit`)}
                            className="rounded-lg text-slate-500 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                            title="Edit Details"
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(doc)}
                            className="rounded-lg text-slate-500 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                            title="Download"
                          >
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
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

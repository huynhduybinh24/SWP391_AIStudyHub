import { useOutletContext, useNavigate } from 'react-router-dom'
import {
  Search,
  Grid,
  List,
  MoreVertical,
  Plus,
  CloudUpload,
  MessageSquare,
  Download,
  Trash2,
  ExternalLink,
  Bot,
  FolderOpen,
  ChevronRight,
  BookOpen,
  Code2,
  Atom,
  Building,
  GraduationCap
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
  searchQuery: string
  setSearchQuery: (q: string) => void
  subjectFilter: string
  setSubjectFilter: (s: string) => void
  typeFilter: string
  setTypeFilter: (t: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (v: 'grid' | 'list') => void
  setIsUploadModalOpen: (open: boolean) => void
  setIsInsightsModalOpen: (open: boolean) => void
  handleOpenChat: (doc: DocumentItem) => void
  handleOpenPreview: (doc: DocumentItem) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  activeMenuId: string | null
  setActiveMenuId: (id: string | null) => void
  menuRef: React.RefObject<HTMLDivElement>
  renderFileIcon: (type: string) => JSX.Element
  renderStatusBadge: (status: string) => JSX.Element
}

export function MyDocumentsPage() {
  const navigate = useNavigate()
  const {
    documents,
    searchQuery,
    setSearchQuery,
    subjectFilter,
    setSubjectFilter,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
    setIsUploadModalOpen,
    setIsInsightsModalOpen,
    handleOpenChat,
    handleOpenPreview,
    handleDownloadFile,
    handleDeleteDocument,
    activeMenuId,
    setActiveMenuId,
    menuRef,
    renderFileIcon,
    renderStatusBadge
  } = useOutletContext<DocumentsLayoutContext>()

  // Filter logic
  const filteredDocuments = documents.filter((doc) => {
    const titleMatch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
    const filenameMatch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    const queryMatch = searchQuery ? (titleMatch || filenameMatch) : true

    const subjectMatch = subjectFilter === 'All' ? true : doc.subject === subjectFilter.toUpperCase()
    const typeMatch = typeFilter === 'All' ? true : doc.type === typeFilter.toLowerCase()

    return queryMatch && subjectMatch && typeMatch
  })

  // Folders list mapped exactly to subjects with custom icons & codes
  const folders = [
    {
      id: 'COMPSCI',
      name: 'Software Engineering',
      code: 'CS-402',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      icon: <Code2 className="h-5 w-5" />
    },
    {
      id: 'MATHEMATICS',
      name: 'Mathematics',
      code: 'MATH-101',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      icon: <Atom className="h-5 w-5" />
    },
    {
      id: 'BIOLOGY',
      name: 'Biology',
      code: 'BIO-201',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      icon: <BookOpen className="h-5 w-5" />
    },
    {
      id: 'PHYSICS',
      name: 'Physics',
      code: 'PHYS-301',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      icon: <Atom className="h-5 w-5" />
    },
    {
      id: 'PHILOSOPHY',
      name: 'Philosophy',
      code: 'PHIL-101',
      color: 'bg-sky-50 text-sky-600 border-sky-100',
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      id: 'ECONOMICS',
      name: 'Economics',
      code: 'ECON-202',
      color: 'bg-violet-50 text-violet-600 border-violet-100',
      icon: <Building className="h-5 w-5" />
    }
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Header & Title Block */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            My Documents
          </h1>
          <p className="mt-2 text-base text-muted max-w-2xl leading-relaxed">
            Manage and organize your study materials with AI. Generate summaries, flashcards, and deep-dives instantly.
          </p>
        </div>

        {/* Action cluster on top right */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsInsightsModalOpen(true)}
            className="rounded-xl border-border bg-white shadow-sm hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300"
            title="View AI Workspace Metrics"
            aria-label="View AI Metrics"
          >
            <Bot className="h-5 w-5 text-primary animate-bounce-slow" />
          </Button>

          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="group flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark hover:scale-[1.02] active:scale-95 transition-all duration-300"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* 2. Figma Subject Folders Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary/80" />
            Subject Folders
          </h2>
          <span className="text-xs text-muted font-medium">Click folder to open dashboard</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => {
            const count = documents.filter((doc) => doc.subject === folder.id).length
            return (
              <div
                key={folder.id}
                onClick={() => navigate(`/dashboard/documents/subject/${folder.id}`)}
                className="group flex items-center justify-between rounded-2xl border border-border/80 bg-white p-4.5 shadow-xs hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", folder.color)}>
                    {folder.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
                      {folder.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted font-semibold tracking-wide">
                      {folder.code} • {count} Document{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            )
          })}
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">All Materials</h2>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          {/* Search Field */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted/80 focus:border-primary/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dropdowns & View toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/85 bg-surface px-3 py-1.5">
              <span className="text-xs font-medium text-muted">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
                <option value="Physics">Physics</option>
                <option value="Compsci">CompSci</option>
                <option value="Philosophy">Philosophy</option>
                <option value="Economics">Economics</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border/85 bg-surface px-3 py-1.5">
              <span className="text-xs font-medium text-muted">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Types</option>
                <option value="Pdf">PDF</option>
                <option value="Word">Word</option>
                <option value="Text">Text</option>
                <option value="Image">Image</option>
                <option value="Slides">Slides</option>
              </select>
            </div>

            <div className="h-6 w-px bg-border/80 hidden sm:block mx-1" />

            {/* View Toggles */}
            <div className="flex items-center rounded-xl border border-border/80 bg-surface p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-lg p-1.5 transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted hover:text-foreground'
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
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted hover:text-foreground'
                )}
                title="List View"
                aria-label="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Empty State or Results List */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-white py-16 px-4 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-foreground">No documents found</h3>
          <p className="mt-2 text-sm text-muted max-w-sm">
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
        
        // Grid View Layout
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md hover:border-primary/20 cursor-pointer"
              onClick={() => handleOpenPreview(doc)}
            >
              {/* Card top action */}
              <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
                {renderFileIcon(doc.type)}
                
                {/* Options Menu Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                    className="menu-trigger-btn rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground focus:outline-none transition-colors"
                    aria-label="Open document actions"
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>

                  {/* Context menu dropdown */}
                  {activeMenuId === doc.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-border bg-white py-1.5 shadow-xl animate-fade-in"
                      role="menu"
                    >
                      <button
                        onClick={() => handleOpenChat(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat with AI
                      </button>
                      <button
                        onClick={() => handleOpenPreview(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open & View
                      </button>
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-body hover:bg-surface transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download File
                      </button>
                      <div className="my-1 border-t border-border/60" />
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Document
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Title / Info area */}
              <div className="mt-5 flex-1">
                <h3 className="line-clamp-1 text-[15px] font-bold text-foreground group-hover:text-primary transition-colors" title={doc.title || doc.fileName}>
                  {doc.title || doc.fileName}
                </h3>
                <p className="mt-1 text-xs text-muted/90 flex items-center gap-1 font-medium">
                  {doc.uploadedAt}
                  <span className="text-[10px] text-border">•</span>
                  <span>{doc.size}</span>
                </p>
              </div>

              {/* Badges footer */}
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/40 pt-4">
                <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                  {doc.subject}
                </span>
                {renderStatusBadge(doc.status)}
              </div>
            </div>
          ))}

          {/* Dotted upload placeholder card */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-white/40 p-6 text-center transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs focus:outline-none min-h-[178px]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-primary shadow-xs group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <CloudUpload className="h-5 w-5" />
            </div>
            <h4 className="mt-4 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Add New File
            </h4>
            <p className="mt-1 text-xs text-muted">
              Max size 50MB
            </p>
          </button>
        </div>
      ) : (
        
        // List View Layout
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface text-xs font-semibold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">File Size</th>
                  <th className="px-6 py-4">Upload Date</th>
                  <th className="px-6 py-4">AI Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredDocuments.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => handleOpenPreview(doc)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {renderFileIcon(doc.type)}
                        <div>
                          <h4 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">
                            {doc.title || doc.fileName}
                          </h4>
                          <span className="text-xs text-muted/80">{doc.fileName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-blue-50/70 border border-blue-100/50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb]">
                        {doc.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-body">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">
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
                          onClick={() => handleOpenChat(doc)}
                          className="rounded-lg text-primary hover:bg-primary/5"
                          title="Chat with AI"
                        >
                          <MessageSquare className="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadFile(doc)}
                          className="rounded-lg text-body"
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
  )
}

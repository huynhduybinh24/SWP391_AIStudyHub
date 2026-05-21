import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Bookmark,
  Share2,
  Sparkles,
  ChevronDown,
  FileText,
  FileCode,
  Image as ImageIcon,
  FolderDown,
  BookOpen,
  Calendar
} from 'lucide-react'
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

interface DocumentsLayoutContext {
  documents: DocumentItem[]
  handleOpenPreview: (doc: DocumentItem) => void
  renderFileIcon: (type: string) => JSX.Element
  showToast: (msg: string) => void
}

// Pre-defined static data mapping for premium result cards to match Figma visual style
const DOCUMENT_DETAILS: Record<string, { label: string; description: string; tags: string[] }> = {
  'neuro-1': {
    label: 'STUDY GUIDE',
    description: 'This comprehensive summary covers the primary anatomical regions of the human brain, including the frontal lobe\'s role in executive function, the temporal lobe\'s processing of auditory information, and the intricate neural pathways connecting the limbic system.',
    tags: ['#neuro-anatomy', '#exam-prep', '#basics']
  },
  'neuro-2': {
    label: 'LECTURE NOTES',
    description: 'Detailed analysis of sensory integration, cortical pathways, neural signaling transduction networks, and memory encoding mechanisms inside the temporal lobe and hippocampal complexes.',
    tags: ['#cognitive-neuro', '#lectures', '#brain-signals']
  },
  'neuro-3': {
    label: 'STUDY GUIDE',
    description: 'A study guide explaining key neurotransmitters: Dopamine, Serotonin, GABA, Glutamate, and Acetylcholine, detailing their pathways, receptors, and behavioral influences.',
    tags: ['#neurotransmitters', '#exam-notes', '#biochemistry']
  },
  'neuro-4': {
    label: 'LECTURE NOTES',
    description: 'Analysis of chemical and electrical synapses, action potentials propagation, synaptic cleft dynamics, and neurotransmitters release mechanisms under high frequency stimulation.',
    tags: ['#synapses', '#cellular-neuro', '#basics']
  },
  'neuro-5': {
    label: 'RESEARCH PAPER',
    description: 'Research analysis on structural neuroplasticity, synaptic pruning, dendritic branching, and experience-dependent microstructural alterations within the mammalian neocortex.',
    tags: ['#neuroplasticity', '#research', '#advanced']
  },
  'psych-1': {
    label: 'LECTURE NOTES',
    description: 'Introduction to neural foundations of behavioral psychology, Pavlovian classical conditioning mechanisms, operant reinforcement pathways, and cognitive development theories.',
    tags: ['#neuropsychology', '#psychology-basics', '#learning']
  },
  'psych-2': {
    label: 'STUDY GUIDE',
    description: 'Study companion focusing on reinforcement schedules, Skinner box models, behavior modeling, and underlying neurotransmitter actions in positive vs negative conditioning.',
    tags: ['#behavioral-psych', '#conditioning', '#basics']
  },
  'doc-2': {
    label: 'LECTURE NOTES',
    description: 'Lecture outline examining molecular biology pathways, neural gene expressions, neurogenesis indicators, and cellular cloning technologies linked to neural tissue culture.',
    tags: ['#molecular-bio', '#cellular-signaling', '#genetics']
  },
  'doc-6': {
    label: 'RESEARCH PAPER',
    description: 'Draft laboratory report detailing molecular genetic profiling, genetic inheritance patterns, neuro-genetic hereditary mutations, and transgenic chromosome mapping.',
    tags: ['#genetics-lab', '#report', '#neuro-genetics']
  }
}

export function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { documents, handleOpenPreview } = useOutletContext<DocumentsLayoutContext>()
  const keyword = searchParams.get('keyword') || ''

  // Filter local states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['NEUROSCIENCE'])
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(['pdf'])
  const [dateFilter, setDateFilter] = useState('Last 7 Days')
  const [bookmarkedDocs, setBookmarkedDocs] = useState<Record<string, boolean>>({})

  // If keyword changes and matches Neuroscience, prefill subjects filter to Neuroscience and types to PDF as in Figma
  useEffect(() => {
    if (keyword.toLowerCase().includes('neuro')) {
      setSelectedSubjects(['NEUROSCIENCE'])
      setSelectedFileTypes(['pdf'])
    } else {
      setSelectedSubjects([])
      setSelectedFileTypes([])
    }
  }, [keyword])

  // Click handler for history keywords
  const handleHistorySearch = (term: string) => {
    navigate(`/dashboard/documents/search?keyword=${encodeURIComponent(term)}`)
  }

  const toggleSubject = (subj: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    )
  }

  const toggleFileType = (type: string) => {
    setSelectedFileTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarkedDocs(prev => {
      const updated = { ...prev, [id]: !prev[id] }
      return updated
    })
  }

  const handleShare = (title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/documents`)
      alert(`Copied document link to clipboard: ${title}`)
    }
  }

  // Filter documents based on:
  // 1. Keyword search (matches Neuroscience-related tokens or matches title/fileName/subject/type)
  const isNeuroQuery = keyword.toLowerCase().includes('neuro') || keyword.toLowerCase().includes('brain')
  
  const searchedDocuments = documents.filter(doc => {
    if (!keyword) return true
    
    // If the keyword is "Neuroscience", we naturally include all NEUROSCIENCE documents, 
    // and also specific BIOLOGY/PSYCHOLOGY documents that contain neuroscience keywords
    if (isNeuroQuery) {
      const isNeuroDoc = doc.subject === 'NEUROSCIENCE'
      const isNeuroBioDoc = doc.subject === 'BIOLOGY' && doc.fileName.toLowerCase().includes('neuro')
      const isNeuroPsychDoc = doc.subject === 'PSYCHOLOGY' && doc.fileName.toLowerCase().includes('neuro')
      return isNeuroDoc || isNeuroBioDoc || isNeuroPsychDoc
    }
    
    // Fallback general query match
    return (
      doc.title.toLowerCase().includes(keyword.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(keyword.toLowerCase()) ||
      doc.subject.toLowerCase().includes(keyword.toLowerCase())
    )
  })

  // 2. Local Sidebar Filters (Subject & File Type checkboxes)
  const filteredDocuments = searchedDocuments.filter(doc => {
    // Subject filter (if none checked, show all searched; otherwise must match)
    const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(doc.subject)
    
    // File Type filter
    let docTypeGroup = 'other'
    if (doc.type === 'pdf') docTypeGroup = 'pdf'
    else if (doc.type === 'word' || doc.type === 'text') docTypeGroup = 'notes'
    else if (doc.type === 'slides') docTypeGroup = 'presentations'

    const typeMatch = selectedFileTypes.length === 0 || selectedFileTypes.includes(docTypeGroup)

    return subjectMatch && typeMatch
  })

  // Dynamic count calculator for filter checklist based on the searched subset (exactly as in Figma)
  const neuroCount = searchedDocuments.filter(d => d.subject === 'NEUROSCIENCE').length
  const bioCount = searchedDocuments.filter(d => d.subject === 'BIOLOGY').length
  const psychCount = searchedDocuments.filter(d => d.subject === 'PSYCHOLOGY').length

  return (
    <div className="space-y-7 animate-fade-in pb-8">
      {/* 1. Breadcrumb Back Navigation */}
      <div>
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-2 text-[13px] font-bold text-[#64748b] hover:text-[#2563eb] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
          Back to Documents
        </button>
      </div>

      {/* 2. Page Header Block */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-[38px] leading-tight">
          {searchedDocuments.length} Results for "{keyword || 'All Documents'}"
        </h1>
        
        {/* Search History Row */}
        <div className="flex items-center gap-2 text-sm text-[#64748b] pt-1">
          <Clock className="h-4 w-4 text-[#94a3b8] shrink-0" />
          <span className="font-semibold">Search history:</span>
          <div className="flex flex-wrap items-center gap-2.5 ml-1">
            {['Psychology', 'Brain', 'Biology'].map(historyItem => (
              <button
                key={historyItem}
                onClick={() => handleHistorySearch(historyItem)}
                className="text-[#64748b] hover:text-[#2563eb] hover:underline font-medium transition-all"
              >
                {historyItem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Columns Layout: Filter column + Results area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start pt-2">
        
        {/* Left Filter Column (width 4 of 12) */}
        <div className="lg:col-span-4 space-y-7 bg-white rounded-2xl border border-border/80 p-6 shadow-sm">
          
          {/* Section: Subject */}
          <div className="space-y-4.5">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
              Subject
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'NEUROSCIENCE', name: 'Neuroscience', count: neuroCount },
                { id: 'BIOLOGY', name: 'Biology', count: bioCount },
                { id: 'PSYCHOLOGY', name: 'Psychology', count: psychCount }
              ].map(subj => (
                <label
                  key={subj.id}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3 select-none">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(subj.id)}
                      onChange={() => toggleSubject(subj.id)}
                      className="h-[18px] w-[18px] rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]/20 cursor-pointer accent-[#2563eb]"
                    />
                    <span className="text-[14px] font-bold text-foreground group-hover:text-[#2563eb] transition-colors">
                      {subj.name}
                    </span>
                  </div>
                  <span className="rounded-full bg-[#eff6ff] text-[#2563eb] font-extrabold text-[11px] px-2.5 py-0.5 border border-[#dbeafe]/40 shadow-2xs">
                    {subj.count}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: File Type */}
          <div className="space-y-4.5 pt-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
              File Type
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'pdf', name: 'PDF', icon: <FileText className="h-4.5 w-4.5 text-[#f43f5e]" /> },
                { id: 'notes', name: 'Lecture Notes', icon: <FileCode className="h-4.5 w-4.5 text-[#3b82f6]" /> },
                { id: 'presentations', name: 'Presentations', icon: <FolderDown className="h-4.5 w-4.5 text-[#f59e0b]" /> }
              ].map(type => (
                <label
                  key={type.id}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3 select-none">
                    <input
                      type="checkbox"
                      checked={selectedFileTypes.includes(type.id)}
                      onChange={() => toggleFileType(type.id)}
                      className="h-[18px] w-[18px] rounded border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb]/20 cursor-pointer accent-[#2563eb]"
                    />
                    <span className="flex items-center gap-2 text-[14px] font-bold text-foreground group-hover:text-[#2563eb] transition-colors">
                      {type.icon}
                      {type.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Date Added */}
          <div className="space-y-3.5 pt-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
              Date Added
            </h3>
            
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-border bg-[#f8fafc] px-4.5 py-3 pr-10 text-[14px] font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/20 cursor-pointer transition-all"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted pointer-events-none stroke-[1.8]" />
            </div>
          </div>

        </div>

        {/* Right Result Column (width 8 of 12) */}
        <div className="lg:col-span-8 space-y-6">
          {filteredDocuments.length === 0 ? (
            /* Empty state for search results */
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-white py-16 px-6 text-center shadow-xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-[17px] font-bold text-foreground">No matches found</h3>
              <p className="mt-2 text-sm text-muted max-w-sm">
                No documents in search match the selected filters. Try updating your subject or format checklists.
              </p>
              <button
                onClick={() => {
                  setSelectedSubjects(['NEUROSCIENCE'])
                  setSelectedFileTypes(['pdf'])
                }}
                className="mt-6 rounded-xl text-sm font-semibold border border-border bg-[#f8fafc] px-5 py-2.5 text-body hover:bg-surface hover:text-[#2563eb] transition-all"
              >
                Reset Filter Choices
              </button>
            </div>
          ) : (
            /* Match results list */
            filteredDocuments.map(doc => {
              const details = DOCUMENT_DETAILS[doc.id] || {
                label: 'STUDY GUIDE',
                description: `This high-fidelity study material on ${doc.title || doc.fileName} has been indexed by our AI system. It outlines core academic structures, experimental data definitions, and diagnostic review procedures to elevate comprehension and test performance.`,
                tags: [`#${doc.subject.toLowerCase()}`, '#exam-prep', '#study-notes']
              }
              const isBookmarked = bookmarkedDocs[doc.id] || false

              return (
                <div
                  key={doc.id}
                  onClick={() => handleOpenPreview(doc)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/85 bg-white p-7.5 shadow-xs hover:border-[#2563eb]/20 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
                >
                  
                  {/* Top Row: AI Generated tag + labels + bookmark/share actions */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5">
                      {/* AI Generated Pill */}
                      <span className="flex items-center gap-1 rounded-md bg-[#eff6ff] border border-[#dbeafe] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-[#2563eb]">
                        <Sparkles className="h-3 w-3 text-[#2563eb] fill-[#2563eb]/10" />
                        AI GENERATED
                      </span>
                      {/* Label */}
                      <span className="text-[10px] font-bold tracking-wider text-[#94a3b8] uppercase">
                        {details.label}
                      </span>
                    </div>

                    {/* Bookmark and Share icons */}
                    <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBookmark(doc.id, e)}
                        className={cn(
                          "p-2.5 rounded-xl border border-border/50 hover:bg-[#f8fafc] hover:text-[#2563eb] transition-all duration-200",
                          isBookmarked ? "text-[#2563eb] bg-[#eff6ff]/50 border-[#dbeafe]" : "text-muted bg-white"
                        )}
                        title="Bookmark document"
                      >
                        <Bookmark className={cn("h-4.5 w-4.5", isBookmarked && "fill-[#2563eb]")} />
                      </button>
                      <button
                        onClick={(e) => handleShare(doc.title || doc.fileName, e)}
                        className="p-2.5 rounded-xl border border-border/50 bg-white text-muted hover:bg-[#f8fafc] hover:text-[#2563eb] transition-all duration-200"
                        title="Share document link"
                      >
                        <Share2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="mt-4 flex-1">
                    <h2 className="text-xl font-extrabold text-[#0f172a] group-hover:text-[#2563eb] transition-colors leading-snug">
                      {doc.title || doc.fileName}
                    </h2>
                    
                    {/* Document Description */}
                    <p className="mt-3.5 text-[14px] leading-relaxed text-[#475569] font-medium">
                      {details.description}
                    </p>
                  </div>

                  {/* Document Tags */}
                  <div className="mt-5.5 flex flex-wrap items-center gap-2">
                    {details.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-[#f1f5f9]/70 px-3 py-1.5 text-[12px] font-bold text-[#475569] border border-[#e2e8f0]/40 transition-colors hover:bg-slate-100 hover:text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                </div>
              )
            })
          )}
        </div>

      </div>

    </div>
  )
}

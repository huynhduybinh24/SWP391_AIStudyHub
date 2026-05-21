import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Bookmark,
  Share2,
  Sparkles,
  ChevronDown
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

// Custom square checkbox matching Figma exactly
const CustomCheckbox = ({ checked }: { checked: boolean }) => {
  return (
    <div
      className={cn(
        "w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 shrink-0",
        checked
          ? "bg-[#3155F6] border-[#3155F6] text-white"
          : "border-slate-300 bg-white hover:border-slate-400"
      )}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </div>
  )
}

// Custom inline SVG icons for premium visual looks matching Figma mockup
const PDFIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 shrink-0">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LectureNotesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 shrink-0">
    <path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L14 13L10 14L11 10L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 10H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PresentationsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 shrink-0">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8L15 11L10 14V8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

export function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { documents, handleOpenPreview, showToast } = useOutletContext<DocumentsLayoutContext>()
  const keyword = searchParams.get('keyword') || ''

  // Filter local states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['NEUROSCIENCE'])
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(['pdf'])
  const [dateFilter, setDateFilter] = useState('Last 7 Days')
  
  // Persistent Bookmarks State via LocalStorage
  const [bookmarkedDocs, setBookmarkedDocs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('studyhub_bookmarks')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Sync bookmarks to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('studyhub_bookmarks', JSON.stringify(bookmarkedDocs))
    } catch (e) {
      console.error('Failed to save bookmarks to localStorage', e)
    }
  }, [bookmarkedDocs])

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
      const isCurrentlyBookmarked = !!prev[id]
      const updated = { ...prev, [id]: !isCurrentlyBookmarked }
      
      // Visual feedback via premium toast system
      if (!isCurrentlyBookmarked) {
        showToast('Document successfully bookmarked!')
      } else {
        showToast('Bookmark removed.')
      }
      return updated
    })
  }

  const handleShare = (title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/dashboard/documents`
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          showToast(`Copied shareable link for "${title}" to clipboard!`)
        })
        .catch(() => {
          showToast('Failed to copy link to clipboard.')
        })
    } else {
      showToast('Clipboard sharing not supported on this browser.')
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

  // 2. Local Sidebar Filters (Subject & File Type checkboxes & Date Added dropdown)
  const filteredDocuments = searchedDocuments.filter(doc => {
    // Subject filter (if none checked, show all searched; otherwise must match)
    const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(doc.subject)
    
    // File Type filter
    let docTypeGroup = 'other'
    if (doc.type === 'pdf') docTypeGroup = 'pdf'
    else if (doc.type === 'word' || doc.type === 'text') docTypeGroup = 'notes'
    else if (doc.type === 'slides') docTypeGroup = 'presentations'

    const typeMatch = selectedFileTypes.length === 0 || selectedFileTypes.includes(docTypeGroup)

    // Date Added filter (relative to today, bypass signature doc 'neuro-1' to preserve Figma high-fidelity preview)
    let dateMatch = true
    if (dateFilter === 'Last 7 Days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      dateMatch = doc.uploadedDateObj >= sevenDaysAgo || doc.id === 'neuro-1'
    } else if (dateFilter === 'Last 30 Days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      dateMatch = doc.uploadedDateObj >= thirtyDaysAgo || doc.id === 'neuro-1'
    }

    return subjectMatch && typeMatch && dateMatch
  })

  // Dynamic count calculator for filter checklist based on the searched subset (exactly as in Figma)
  const neuroCount = searchedDocuments.filter(d => d.subject === 'NEUROSCIENCE').length
  const bioCount = searchedDocuments.filter(d => d.subject === 'BIOLOGY').length
  const psychCount = searchedDocuments.filter(d => d.subject === 'PSYCHOLOGY').length

  return (
    <div className="space-y-6.5 animate-fade-in pb-8">
      {/* 1. Breadcrumb Back Navigation */}
      <div>
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#3155F6] transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0 stroke-[2.2]" />
          Back to Documents
        </button>
      </div>

      {/* 2. Page Header Block */}
      <div className="space-y-2 pt-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[38px] leading-tight">
          {searchedDocuments.length} Results for "{keyword || 'All Documents'}"
        </h1>
        
        {/* Search History Row */}
        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
          <Clock className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-500">Search history:</span>
          <div className="flex flex-wrap items-center gap-1.5 ml-1">
            {['Psychology', 'Brain', 'Biology'].map((historyItem, index) => (
              <span key={historyItem} className="flex items-center">
                <button
                  onClick={() => handleHistorySearch(historyItem)}
                  className="text-slate-500 hover:text-[#3155F6] hover:underline transition-colors"
                >
                  {historyItem}
                </button>
                {index < 2 && <span className="text-slate-400 mx-1">,</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Columns Layout: Filter column + Results area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start pt-3">
        
        {/* Left Filter Column (width 3 of 12) - Transparent/Borderless */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Section: Subject */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              SUBJECT
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'NEUROSCIENCE', name: 'Neuroscience', count: neuroCount },
                { id: 'BIOLOGY', name: 'Biology', count: bioCount },
                { id: 'PSYCHOLOGY', name: 'Psychology', count: psychCount }
              ].map(subj => {
                const isChecked = selectedSubjects.includes(subj.id)
                return (
                  <div
                    key={subj.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => toggleSubject(subj.id)}>
                      <CustomCheckbox
                        checked={isChecked}
                      />
                      <span className={cn(
                        "text-[14.5px] font-semibold transition-colors",
                        isChecked ? "text-[#3155F6]" : "text-slate-600 group-hover:text-slate-800"
                      )}>
                        {subj.name}
                      </span>
                    </div>
                    <span className={cn(
                      "rounded-full font-bold text-[11px] px-2.5 py-0.5 shadow-2xs transition-colors",
                      isChecked 
                        ? "bg-[#EBF1FF] text-[#3155F6]" 
                        : "bg-slate-100/70 text-slate-500"
                    )}>
                      {subj.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: File Type */}
          <div className="space-y-4 pt-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              FILE TYPE
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'pdf', name: 'PDF', icon: <PDFIcon /> },
                { id: 'notes', name: 'Lecture Notes', icon: <LectureNotesIcon /> },
                { id: 'presentations', name: 'Presentations', icon: <PresentationsIcon /> }
              ].map(type => {
                const isChecked = selectedFileTypes.includes(type.id)
                return (
                  <div
                    key={type.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5 select-none cursor-pointer" onClick={() => toggleFileType(type.id)}>
                      <CustomCheckbox
                        checked={isChecked}
                      />
                      <span className="flex items-center gap-2 text-[14.5px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
                        {type.icon}
                        {type.name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section: Date Added */}
          <div className="space-y-4 pt-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              DATE ADDED
            </h3>
            
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4.5 py-3 pr-10 text-[14px] font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3155F6]/20 cursor-pointer shadow-2xs transition-all"
              >
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="All Time">All Time</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 pointer-events-none stroke-[2]" />
            </div>
          </div>

        </div>

        {/* Right Result Column (width 9 of 12) */}
        <div className="lg:col-span-9 space-y-6">
          {filteredDocuments.length === 0 ? (
            /* Empty state for search results */
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 bg-white py-16 px-6 text-center shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF1FF] text-[#3155F6]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-[17px] font-extrabold text-slate-900">No matches found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm font-medium">
                No documents in search match the selected filters. Try updating your subject or format checklists.
              </p>
              <button
                onClick={() => {
                  setSelectedSubjects(['NEUROSCIENCE'])
                  setSelectedFileTypes(['pdf'])
                  setDateFilter('Last 7 Days')
                }}
                className="mt-6 rounded-xl text-sm font-bold border border-slate-200 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-[#3155F6] transition-all"
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
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:border-[#3155F6]/10 hover:shadow-[0_8px_30px_rgba(49,85,246,0.04)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
                >
                  
                  {/* Top Row: AI Generated tag + labels + bookmark/share actions */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5">
                      {/* AI Generated Pill */}
                      <span className="flex items-center gap-1.5 rounded-md bg-[#EBF1FF] px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-[#3155F6]">
                        <Sparkles className="h-3 w-3 text-[#3155F6] fill-[#3155F6]/10" />
                        AI GENERATED
                      </span>
                      {/* Label */}
                      <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        {details.label}
                      </span>
                    </div>

                    {/* Bookmark and Share icons */}
                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBookmark(doc.id, e)}
                        className={cn(
                          "text-slate-400 hover:text-[#3155F6] transition-all duration-200 focus:outline-none",
                          isBookmarked ? "text-[#3155F6]" : "text-slate-400"
                        )}
                        title="Bookmark document"
                      >
                        <Bookmark className={cn("h-[20px] w-[20px]", isBookmarked && "fill-[#3155F6] stroke-[#3155F6]")} />
                      </button>
                      <button
                        onClick={(e) => handleShare(doc.title || doc.fileName, e)}
                        className="text-slate-400 hover:text-[#3155F6] transition-all duration-200 focus:outline-none"
                        title="Share document link"
                      >
                        <Share2 className="h-[20px] w-[20px]" />
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="mt-4.5 flex-1">
                    <h2 className="text-[22px] font-extrabold text-[#0f172a] group-hover:text-[#3155F6] transition-colors leading-snug tracking-tight">
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
                        className="rounded-lg bg-[#F0F2FB] px-3.5 py-1.5 text-[12px] font-semibold text-[#475569] transition-all hover:bg-slate-200/80 hover:text-slate-900"
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

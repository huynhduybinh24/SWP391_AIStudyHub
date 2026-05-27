import { useState, useEffect, useMemo } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '@/context/LanguageContext'
import {
  ArrowLeft,
  Clock,
  Bookmark,
  Share2,
  Sparkles,
  ChevronDown,
  FileText,
  Search,
  Eye,
  CheckCircle,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  FolderOpen,
  ShieldAlert,
  XCircle,
  Download,
  Calendar,
  Globe,
  Upload,
  Cpu,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { adminService, AdminDocument } from '@/features/admin/services/adminService'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

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
  renderFileIcon: (type: string) => React.ReactNode
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
        "w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-205 shrink-0",
        checked
          ? "bg-[#3155F6] border-[#3155F6] text-white"
          : "border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 dark:text-slate-400 shrink-0">
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const LectureNotesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-505 dark:text-slate-400 shrink-0">
    <path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L14 13L10 14L11 10L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 10H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 14H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PresentationsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-500 dark:text-slate-405 shrink-0">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 8L15 11L10 14V8Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
)

export function SearchResultsPage() {
  const { t, language } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const keyword = searchParams.get('keyword') || ''

  // 1. Role detection
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role.toLowerCase() === 'admin'

  // ==========================================
  // STUDENT SEARCH SIDE STATES & LOGIC
  // ==========================================
  const studentContext = useOutletContext<DocumentsLayoutContext | null>()
  const studentDocs = studentContext?.documents || []
  const showToast = studentContext?.showToast || ((msg: string) => toast.success(msg))

  const handleOpenDocument = (docId: string) => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-auto"], .overflow-auto, [class*="overflow-auto"]')
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

  // Filter local states
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['NEUROSCIENCE'])
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>(['pdf'])
  const [dateFilter, setDateFilter] = useState('All Time')
  
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
    if (!isAdmin) {
      if (keyword.toLowerCase().includes('neuro')) {
        setSelectedSubjects(['NEUROSCIENCE'])
        setSelectedFileTypes(['pdf'])
      } else {
        setSelectedSubjects([])
        setSelectedFileTypes([])
      }
    }
  }, [keyword, isAdmin])

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
      
      if (!isCurrentlyBookmarked) {
        showToast(t.searchResultsPage.toastBookmarkAdded)
      } else {
        showToast(t.searchResultsPage.toastBookmarkRemoved)
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
          showToast(t.searchResultsPage.toastShareSuccess(title))
        })
        .catch(() => {
          showToast(t.searchResultsPage.toastShareError)
        })
    } else {
      showToast(t.searchResultsPage.toastShareNotSupported)
    }
  }

  const isNeuroQuery = keyword.toLowerCase().includes('neuro') || keyword.toLowerCase().includes('brain')
  
  const searchedStudentDocuments = useMemo(() => {
    return studentDocs.filter(doc => {
      if (!keyword) return true
      if (isNeuroQuery) {
        const isNeuroDoc = doc.subject === 'NEUROSCIENCE'
        const isNeuroBioDoc = doc.subject === 'BIOLOGY' && doc.fileName.toLowerCase().includes('neuro')
        const isNeuroPsychDoc = doc.subject === 'PSYCHOLOGY' && doc.fileName.toLowerCase().includes('neuro')
        return isNeuroDoc || isNeuroBioDoc || isNeuroPsychDoc
      }
      return (
        doc.title.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(keyword.toLowerCase()) ||
        doc.subject.toLowerCase().includes(keyword.toLowerCase())
      )
    })
  }, [studentDocs, keyword, isNeuroQuery])

  const filteredStudentDocuments = useMemo(() => {
    return searchedStudentDocuments.filter(doc => {
      const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(doc.subject)
      
      let docTypeGroup = 'other'
      if (doc.type === 'pdf') docTypeGroup = 'pdf'
      else if (doc.type === 'word' || doc.type === 'text') docTypeGroup = 'notes'
      else if (doc.type === 'slides') docTypeGroup = 'presentations'

      const typeMatch = selectedFileTypes.length === 0 || selectedFileTypes.includes(docTypeGroup)

      let dateMatch = true
      const docDate = new Date(doc.uploadedDateObj)
      if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        dateMatch = docDate >= sevenDaysAgo || doc.id === 'neuro-1'
      } else if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        dateMatch = docDate >= thirtyDaysAgo || doc.id === 'neuro-1'
      }

      return subjectMatch && typeMatch && dateMatch
    })
  }, [searchedStudentDocuments, selectedSubjects, selectedFileTypes, dateFilter])

  const studentNeuroCount = searchedStudentDocuments.filter(d => d.subject === 'NEUROSCIENCE').length
  const studentBioCount = searchedStudentDocuments.filter(d => d.subject === 'BIOLOGY').length
  const studentPsychCount = searchedStudentDocuments.filter(d => d.subject === 'PSYCHOLOGY').length


  // ==========================================
  // ADMIN SEARCH SIDE STATES & LOGIC
  // ==========================================
  const [adminDocs, setAdminDocs] = useState<AdminDocument[]>([])
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminSearchTerm, setAdminSearchTerm] = useState(keyword)

  // Moderation filtering states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [aiRiskFilter, setAiRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [plagiarismFilter, setPlagiarismFilter] = useState<'all' | 'plagiarized' | 'clean'>('all')
  const [reportFilter, setReportFilter] = useState<'all' | 'reported' | 'high'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web_upload' | 'api_sync' | 'partner_portal'>('all')
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'pdf' | 'docx' | 'xlsx' | 'image' | 'pptx' | 'txt'>('all')
  const [adminDateFilter, setAdminDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Sorting & selection
  const [sortField, setSortField] = useState<'uploadedAt' | 'plagiarismScore' | 'aiConfidenceScore' | 'reportCount'>('uploadedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])

  // Modal states
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<AdminDocument | null>(null)
  const [adminFeedback, setAdminFeedback] = useState('')

  const loadAdminDocuments = async () => {
    try {
      setAdminLoading(true)
      const res = await adminService.getDocuments()
      setAdminDocs(res)
    } catch (err) {
      console.error(err)
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAdminDocuments()
      setAdminSearchTerm(keyword)
    }
  }, [keyword, isAdmin])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Filter & Sort admin documents based on administrative parameters
  const filteredAdminDocuments = useMemo(() => {
    if (!isAdmin) return []
    const filtered = adminDocs.filter((doc) => {
      // 1. Keyword search (title, ownerName, ownerEmail, bannedKeywords, categories, uploadSource)
      const term = adminSearchTerm.toLowerCase();
      const titleMatch = doc.title.toLowerCase().includes(term);
      const uploaderMatch = 
        doc.ownerName.toLowerCase().includes(term) ||
        doc.ownerEmail.toLowerCase().includes(term);
      const bannedMatch = doc.bannedKeywords
        ? doc.bannedKeywords.some(kw => kw.toLowerCase().includes(term))
        : false;
      const categoryMatch = doc.category.toLowerCase().includes(term);
      const sourceNameMatch = doc.uploadSource.toLowerCase().includes(term);

      const matchesSearch = titleMatch || uploaderMatch || bannedMatch || categoryMatch || sourceNameMatch;

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

      // 3. AI Risk Level Filter
      const matchesAiRisk = aiRiskFilter === 'all' || doc.aiRiskLevel === aiRiskFilter;

      // 4. Plagiarism Score Filter
      let matchesPlag = true;
      if (plagiarismFilter === 'plagiarized') {
        matchesPlag = doc.plagiarismScore >= 30;
      } else if (plagiarismFilter === 'clean') {
        matchesPlag = doc.plagiarismScore < 30;
      }

      // 5. Report Count Filter
      let matchesReport = true;
      if (reportFilter === 'reported') {
        matchesReport = doc.reportCount >= 1;
      } else if (reportFilter === 'high') {
        matchesReport = doc.reportCount >= 5;
      }

      // 6. Source Filter
      const matchesSource = sourceFilter === 'all' || doc.uploadSource === sourceFilter;

      // 7. File Type Filter
      const matchesFileType = fileTypeFilter === 'all' || doc.fileType === fileTypeFilter;

      // 8. Date Filter
      let matchesDate = true;
      if (adminDateFilter !== 'all') {
        const docDate = new Date(doc.uploadedAt);
        const latestDocTime = Math.max(...adminDocs.map(d => new Date(d.uploadedAt).getTime()));
        const baseDate = new Date(latestDocTime > 0 ? latestDocTime : Date.now());
        const diffTime = Math.abs(baseDate.getTime() - docDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (adminDateFilter === 'today') {
          matchesDate = diffDays <= 1;
        } else if (adminDateFilter === 'week') {
          matchesDate = diffDays <= 7;
        } else if (adminDateFilter === 'month') {
          matchesDate = diffDays <= 30;
        }
      }

      return matchesSearch && matchesStatus && matchesAiRisk && matchesPlag && matchesReport && matchesSource && matchesFileType && matchesDate;
    });

    return filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'uploadedAt') {
        const timeA = new Date(valA as string).getTime();
        const timeB = new Date(valB as string).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }, [adminDocs, isAdmin, adminSearchTerm, statusFilter, aiRiskFilter, plagiarismFilter, reportFilter, sourceFilter, fileTypeFilter, adminDateFilter, sortField, sortOrder])

  // Admin stats cards data
  const adminStats = useMemo(() => {
    const pending = filteredAdminDocuments.filter((d) => d.status === 'pending').length
    const flagged = filteredAdminDocuments.filter((d) => d.isFlagged || d.aiStatus === 'flagged').length
    const aiGenerated = filteredAdminDocuments.filter((d) => d.isAiGenerated).length
    const rejected = filteredAdminDocuments.filter((d) => d.status === 'rejected').length
    return { pending, flagged, aiGenerated, rejected }
  }, [filteredAdminDocuments])

  // Admin Actions handlers
  const handleUpdateDocument = async (id: string, updates: Partial<AdminDocument>) => {
    try {
      const updated = await adminService.updateDocument(id, updates)
      setAdminDocs(prev => prev.map(d => d.id === id ? updated : d))
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(prev => prev ? { ...prev, ...updates } : null)
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating document')
    }
  }

  const handleDeleteDocument = async (id: string) => {
    try {
      await adminService.deleteDocument(id)
      setAdminDocs(prev => prev.filter(d => d.id !== id))
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(null)
      }
      toast.success(language === 'vi' ? 'Đã xóa tài liệu thành công' : 'Document deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Error deleting document')
    }
  }

  const handleApproveDocument = async (id: string) => {
    try {
      const updated = await adminService.approveDocument(id)
      setAdminDocs(prev => prev.map(d => d.id === id ? updated : d))
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(prev => prev ? { ...prev, status: 'approved', aiStatus: updated.aiStatus } : null)
      }
      toast.success(language === 'vi' ? 'Đã phê duyệt tài liệu thành công' : 'Document approved successfully')
    } catch (err: any) {
      toast.error(err.message || 'Error approving document')
    }
  }

  const handleRejectDocument = async (id: string) => {
    try {
      const updated = await adminService.rejectDocument(id)
      setAdminDocs(prev => prev.map(d => d.id === id ? updated : d))
      if (previewDoc && previewDoc.id === id) {
        setPreviewDoc(prev => prev ? { ...prev, status: 'rejected' } : null)
      }
      toast.success(language === 'vi' ? 'Đã từ chối tài liệu' : 'Document rejected')
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting document')
    }
  }

  // Selection handlers
  const isAllSelected = filteredAdminDocuments.length > 0 && selectedDocIds.length === filteredAdminDocuments.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredAdminDocuments.map(d => d.id));
    }
  };
  const handleSelectRow = (id: string) => {
    setSelectedDocIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    try {
      const approved = await adminService.bulkApproveDocuments(selectedDocIds);
      approved.forEach(doc => {
        handleUpdateDocument(doc.id, { status: 'approved', aiStatus: doc.aiStatus });
      });
      toast.success(language === 'vi' ? `Đã duyệt thành công ${selectedDocIds.length} tài liệu.` : `Successfully approved ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleBulkReject = async () => {
    try {
      const rejected = await adminService.bulkRejectDocuments(selectedDocIds);
      rejected.forEach(doc => {
        handleUpdateDocument(doc.id, { status: 'rejected' });
      });
      toast.success(language === 'vi' ? `Đã từ chối ${selectedDocIds.length} tài liệu.` : `Successfully rejected ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await adminService.bulkDeleteDocuments(selectedDocIds);
      selectedDocIds.forEach(id => {
        setAdminDocs(prev => prev.filter(d => d.id !== id))
      });
      toast.success(language === 'vi' ? `Đã xóa ${selectedDocIds.length} tài liệu.` : `Successfully deleted ${selectedDocIds.length} documents.`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await adminService.exportModerationReport(selectedDocIds);
      toast.success(language === 'vi' ? `Đã tạo báo cáo: ${res.filename}` : `Exported report: ${res.filename}`);
      setSelectedDocIds([]);
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  // ==========================================
  // RENDER BLOCKS
  // ==========================================

  // A. ADMIN MODE VIEW
  if (isAdmin) {
    return (
      <div className="space-y-6 text-left relative pb-20 animate-fade-in select-none">

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400">
              <FileText className="size-6" />
            </span>
            {language === 'vi' 
              ? `Kết quả Tìm kiếm Quản trị (${filteredAdminDocuments.length})` 
              : `Admin Search Results (${filteredAdminDocuments.length})`}
          </h1>
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 leading-normal max-w-xl">
            {language === 'vi' 
              ? `Đang tìm kiếm tài liệu hệ thống cho từ khóa: "${keyword || 'Tất cả'}"`
              : `Showing administrative files matching query: "${keyword || 'All'}"`}
          </p>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Pending */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-amber-500/35 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'vi' ? 'Chờ kiểm duyệt' : 'Pending Reviews'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {adminStats.pending}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-455 font-extrabold flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {language === 'vi' ? 'Yêu cầu duyệt' : 'Requires action'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-955/20 text-amber-500 group-hover:scale-110 transition-transform duration-300">
              <Clock className="size-5 stroke-[2.25]" />
            </div>
          </div>

          {/* Card 2: Flagged */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-rose-500/35 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'vi' ? 'Tài liệu bị gắn cờ' : 'Flagged Documents'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {adminStats.flagged}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-455 font-extrabold">
                  {language === 'vi' ? 'Cần kiểm tra' : 'Risk detected'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-500 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="size-5 stroke-[2.25]" />
            </div>
          </div>

          {/* Card 3: AI Generated */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-purple-500/35 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'vi' ? 'Tạo bởi AI' : 'AI Generated'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {adminStats.aiGenerated}
                </span>
                <span className="text-[10px] text-purple-650 dark:text-purple-400 font-extrabold">
                  {language === 'vi' ? 'Bản quét AI' : 'AI scanned'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-955/20 text-purple-600 dark:text-purple-405 group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="size-5 stroke-[2.25]" />
            </div>
          </div>

          {/* Card 4: Rejected */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-red-500/35 transition-all duration-300">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider block">
                {language === 'vi' ? 'Bị từ chối' : 'Rejected Today'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                  {adminStats.rejected}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  {language === 'vi' ? 'Đã chặn' : 'Blocked content'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:scale-110 transition-transform duration-300">
              <XCircle className="size-5 stroke-[2.25]" />
            </div>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="space-y-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl backdrop-blur-sm">
          {/* First Row: Search input and Date Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                placeholder={language === 'vi' ? "Tìm kiếm theo tên tài liệu, người đăng, email, từ khóa cấm..." : "Search by title, uploader name/email, banned keywords..."}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-105 dark:placeholder:text-slate-500 font-semibold"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">{language === 'vi' ? 'Trạng thái:' : 'Status:'}</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none focus:outline-none font-bold text-slate-850 dark:text-slate-150 cursor-pointer"
                >
                  <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                  <option value="pending">{language === 'vi' ? 'Chờ duyệt' : 'Pending'}</option>
                  <option value="approved">{language === 'vi' ? 'Đã duyệt' : 'Approved'}</option>
                  <option value="rejected">{language === 'vi' ? 'Bị từ chối' : 'Rejected'}</option>
                </select>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-655 dark:text-slate-355">
                <Calendar className="size-3.5 text-blue-500" />
                <select
                  value={adminDateFilter}
                  onChange={(e) => setAdminDateFilter(e.target.value as any)}
                  className="bg-transparent border-none focus:outline-none font-bold text-slate-850 dark:text-slate-150 cursor-pointer"
                >
                  <option value="all">{language === 'vi' ? 'Mọi thời gian' : 'All time'}</option>
                  <option value="today">{language === 'vi' ? 'Hôm nay' : 'Today'}</option>
                  <option value="week">{language === 'vi' ? 'Tuần này' : 'This week'}</option>
                  <option value="month">{language === 'vi' ? 'Tháng này' : 'This month'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Second Row: Detailed Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
            {/* AI Risk Level */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Mức rủi ro AI' : 'AI Risk Level'}</span>
              <select
                value={aiRiskFilter}
                onChange={(e) => setAiRiskFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-705 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Tất cả rủi ro' : 'All Risk Levels'}</option>
                <option value="low">{language === 'vi' ? 'Thấp' : 'Low'}</option>
                <option value="medium">{language === 'vi' ? 'Trung bình' : 'Medium'}</option>
                <option value="high">{language === 'vi' ? 'Cao' : 'High'}</option>
              </select>
            </div>

            {/* Plagiarism Score */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Đạo văn' : 'Plagiarism'}</span>
              <select
                value={plagiarismFilter}
                onChange={(e) => setPlagiarismFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-705 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Mọi tỷ lệ' : 'All Scores'}</option>
                <option value="plagiarized">{language === 'vi' ? 'Đạo văn (>= 30%)' : 'Plagiarized (>= 30%)'}</option>
                <option value="clean">{language === 'vi' ? 'Sạch (< 30%)' : 'Clean (< 30%)'}</option>
              </select>
            </div>

            {/* Report Count */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Báo cáo vi phạm' : 'Reports Count'}</span>
              <select
                value={reportFilter}
                onChange={(e) => setReportFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Mọi báo cáo' : 'All Reports'}</option>
                <option value="reported">{language === 'vi' ? 'Có báo cáo (>= 1)' : 'Reported (>= 1)'}</option>
                <option value="high">{language === 'vi' ? 'Báo cáo nhiều (>= 5)' : 'High Reports (>= 5)'}</option>
              </select>
            </div>

            {/* Upload Source */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Nguồn tải lên' : 'Upload Source'}</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Mọi nguồn' : 'All Sources'}</option>
                <option value="web_upload">{language === 'vi' ? 'Web App Upload' : 'Web Upload'}</option>
                <option value="api_sync">{language === 'vi' ? 'API Sync' : 'API Sync'}</option>
                <option value="partner_portal">{language === 'vi' ? 'Partner Portal' : 'Partner Portal'}</option>
              </select>
            </div>

            {/* File Type */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{language === 'vi' ? 'Định dạng' : 'File Type'}</span>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-955 text-slate-705 dark:text-slate-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">{language === 'vi' ? 'Tất cả loại' : 'All Types'}</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word (DOCX)</option>
                <option value="xlsx">Excel (XLSX)</option>
                <option value="image">{language === 'vi' ? 'Hình ảnh' : 'Image'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Moderation Table */}
        <Card className="rounded-[28px] overflow-hidden shadow-md">
          <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin relative z-0">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 select-none bg-slate-50/50 dark:bg-slate-900/50">
                  {/* Bulk Select Checkbox Column */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pl-6 w-12 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                      />
                    </div>
                  </th>

                  {/* Sortable Document Name Header */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('uploadedAt')}>
                      <span>{t.admin?.docColName || 'Name'}</span>
                      <ArrowUpDown className={cn("size-3", sortField === 'uploadedAt' ? "text-blue-500" : "text-slate-400")} />
                    </div>
                  </th>

                  {/* Uploader & Source */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    {language === 'vi' ? 'Người đăng & Nguồn' : 'Uploader & Source'}
                  </th>

                  {/* AI Risk Score & Plagiarism Metrics */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('aiConfidenceScore')}>
                        <span>AI Score</span>
                        <ArrowUpDown className={cn("size-3", sortField === 'aiConfidenceScore' ? "text-blue-500" : "text-slate-400")} />
                      </div>
                      <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('plagiarismScore')}>
                        <span>Plag</span>
                        <ArrowUpDown className={cn("size-3", sortField === 'plagiarismScore' ? "text-blue-500" : "text-slate-400")} />
                      </div>
                    </div>
                  </th>

                  {/* Reports Header */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleSort('reportCount')}>
                      <span>{language === 'vi' ? 'Báo cáo' : 'Reports'}</span>
                      <ArrowUpDown className={cn("size-3", sortField === 'reportCount' ? "text-blue-500" : "text-slate-400")} />
                    </div>
                  </th>

                  {/* Status Column */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    {t.admin?.docColStatus || 'Status'}
                  </th>

                  {/* Action Buttons Column */}
                  <th className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 p-4 pr-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)]">
                    {t.admin?.docColActions || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {adminLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <div className="w-8 h-8 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
                        <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                          {language === 'vi' ? 'Đang tải tài liệu...' : 'Loading documents...'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredAdminDocuments.length > 0 ? (
                  filteredAdminDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    const getStatusBadge = () => {
                      switch (doc.status) {
                        case 'approved':
                          return (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {t.admin?.statusApproved || 'Approved'}
                            </Badge>
                          )
                        case 'pending':
                          return (
                            <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {t.admin?.statusPending || 'Pending'}
                            </Badge>
                          )
                        case 'rejected':
                          return (
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/15 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-0.5 font-extrabold text-[11px] select-none">
                              <AlertTriangle className="size-3 text-rose-500" />
                              Rejected
                            </Badge>
                          )
                      }
                    };

                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-800/35 even:bg-slate-50/20 dark:even:bg-slate-900/10 transition-all duration-200 group",
                          isSelected && "bg-blue-50/30 dark:bg-blue-955/15"
                        )}
                      >
                        {/* Checkbox Column */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(doc.id)}
                              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                            />
                          </div>
                        </td>

                        {/* Name & Type */}
                        <td className="p-4 font-bold text-slate-850 dark:text-slate-200">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[14px] leading-tight font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[240px]" title={doc.title}>
                                {doc.title}
                              </span>
                              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] px-1.5 py-0 rounded font-extrabold uppercase select-none shrink-0">
                                {doc.fileType}
                              </Badge>
                              {doc.isFlagged && (
                                <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20 text-[9px] px-1.5 py-0 rounded-md font-extrabold uppercase tracking-wide shrink-0 select-none">
                                  Flagged
                                </Badge>
                              )}
                              {doc.isAiGenerated && (
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-455 border border-purple-500/20 text-[9px] px-1.5 py-0 rounded-md font-extrabold uppercase tracking-wide shrink-0 select-none">
                                  AI
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              <span>{doc.sizeMB} MB</span>
                              <span>•</span>
                              <span>{doc.uploadedAt}</span>
                            </div>

                            {/* Banned keywords info */}
                            {(doc.bannedKeywords && doc.bannedKeywords.length > 0) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {doc.bannedKeywords.map((kw, i) => (
                                  <Badge key={i} className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-[9px] px-1 py-0 rounded font-semibold tracking-wide lowercase shrink-0">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Uploader & Source */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{doc.ownerName}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{doc.ownerEmail}</span>
                            <div className="mt-1 flex items-center gap-1.5">
                              {doc.uploadSource === 'web_upload' && (
                                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-455 border border-blue-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                  <Upload className="size-2.5" />
                                  Web Upload
                                </Badge>
                              )}
                              {doc.uploadSource === 'api_sync' && (
                                <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-455 border border-purple-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                  <Cpu className="size-2.5" />
                                  API Sync
                                </Badge>
                              )}
                              {doc.uploadSource === 'partner_portal' && (
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15 text-[9px] px-1.5 py-0 rounded flex items-center gap-1 font-extrabold select-none">
                                  <Globe className="size-2.5" />
                                  Partner Portal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* AI Risk Score & Plagiarism Metrics */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 max-w-[200px]">
                            {/* Risk Level Badge */}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase select-none">{language === 'vi' ? 'Rủi ro AI:' : 'AI Risk:'}</span>
                              <Badge className={cn(
                                "font-extrabold text-[9px] px-1.5 py-0 rounded-md uppercase tracking-wider select-none",
                                doc.aiRiskLevel === 'high' && "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20",
                                doc.aiRiskLevel === 'medium' && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                                doc.aiRiskLevel === 'low' && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              )}>
                                {doc.aiRiskLevel}
                              </Badge>
                            </div>

                            {/* Progress bar metrics grid */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-bold">
                              {/* AI Probability */}
                              <div className="flex items-center justify-between gap-1 text-purple-655 dark:text-purple-400">
                                <span>AI:</span>
                                <span className="font-extrabold">{doc.aiConfidenceScore}%</span>
                              </div>

                              {/* Plagiarism */}
                              <div className={cn(
                                "flex items-center justify-between gap-1",
                                doc.plagiarismScore >= 30 ? "text-rose-600 dark:text-rose-455" : "text-slate-550 dark:text-slate-400"
                              )}>
                                <span>Plag:</span>
                                <span className="font-extrabold">{doc.plagiarismScore}%</span>
                              </div>

                              {/* Unsafe Content */}
                              <div className={cn(
                                "flex items-center justify-between gap-1",
                                doc.unsafeContentScore >= 20 ? "text-rose-600 dark:text-rose-455" : "text-slate-550 dark:text-slate-400"
                              )}>
                                <span>Unsafe:</span>
                                <span className="font-extrabold">{doc.unsafeContentScore}%</span>
                              </div>

                              {/* Spam */}
                              <div className={cn(
                                "flex items-center justify-between gap-1",
                                doc.spamScore >= 40 ? "text-amber-600 dark:text-amber-500" : "text-slate-550 dark:text-slate-400"
                              )}>
                                <span>Spam:</span>
                                <span className="font-extrabold">{doc.spamScore}%</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Reports */}
                        <td className="p-4 text-xs font-semibold">
                          {doc.reportCount > 0 ? (
                            <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15 flex items-center gap-1 w-fit rounded-full px-2 py-0.5 font-black">
                              <ShieldAlert className="size-3 shrink-0 text-rose-500" />
                              <span>{doc.reportCount} {language === 'vi' ? 'báo cáo' : 'reports'}</span>
                            </Badge>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600 font-medium">0</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {getStatusBadge()}
                        </td>

                        {/* Actions */}
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Details/Review Button */}
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="p-1.5 rounded-lg text-slate-505 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                              title={language === 'vi' ? 'Xem chi tiết & Quét AI' : 'Review Details'}
                            >
                              <Eye className="size-4.5" />
                            </button>

                            {/* Flag toggle button */}
                            <button
                              onClick={() => handleUpdateDocument(doc.id, { isFlagged: !doc.isFlagged })}
                              className={cn(
                                "p-1.5 rounded-lg transition-all cursor-pointer",
                                doc.isFlagged
                                  ? "text-rose-600 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100"
                                  : "text-slate-455 hover:text-rose-505 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-455"
                              )}
                              title={doc.isFlagged ? 'Remove Flag' : 'Flag Document'}
                            >
                              <AlertTriangle className="size-4.5" />
                            </button>

                            {/* Approve action */}
                            {doc.status !== 'approved' ? (
                              <button
                                onClick={() => handleApproveDocument(doc.id)}
                                className="p-1.5 rounded-lg text-slate-505 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-450 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                                title={t.admin?.actionApprove || 'Approve'}
                              >
                                <CheckCircle className="size-4.5" />
                              </button>
                            ) : (
                              <div className="w-7 h-7 flex items-center justify-center text-emerald-500" title="Approved">
                                <ShieldCheck className="size-4.5" />
                              </div>
                            )}

                            {/* Reject action */}
                            {doc.status !== 'rejected' && (
                              <button
                                onClick={() => handleRejectDocument(doc.id)}
                                className="p-1.5 rounded-lg text-slate-505 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-450 dark:hover:bg-amber-950/40 transition-all cursor-pointer"
                                title="Reject"
                              >
                                <XCircle className="size-4.5" />
                              </button>
                            )}

                            {/* Download mock action */}
                            <button
                              onClick={() => toast.success(`Simulating download of "${doc.title}.${doc.fileType}"`)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-405 dark:hover:text-blue-450 dark:hover:bg-blue-955/20 transition-all cursor-pointer"
                              title="Download File"
                            >
                              <Download className="size-4.5" />
                            </button>

                            {/* Delete action */}
                            <button
                              onClick={() => setDeleteDoc(doc)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-500 dark:hover:text-rose-450 dark:hover:bg-rose-955/20 transition-all cursor-pointer"
                              title={t.admin?.actionDelete || 'Delete'}
                            >
                              <Trash2 className="size-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-455 dark:text-slate-655">
                        <FolderOpen className="size-10 stroke-[1.25] mb-2" />
                        <p className="font-extrabold text-sm text-slate-705 dark:text-slate-350">{t.admin?.noDocs || "No documents found"}</p>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-505 mt-1">{t.admin?.noDocsModeration || "No documents match"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bulk Actions Floating Toolbar */}
        {selectedDocIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col sm:flex-row items-center gap-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-3xl shadow-2xl border border-slate-800 dark:border-slate-205 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <span className="text-xs font-black font-mono">
              {selectedDocIds.length} {language === 'vi' ? 'tài liệu được chọn' : 'documents selected'}
            </span>
            <div className="h-4 w-[1px] bg-slate-800 dark:bg-slate-200 hidden sm:block" />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleBulkApprove}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10 border-none"
              >
                <CheckCircle className="size-3.5" />
                {language === 'vi' ? 'Duyệt' : 'Approve'}
              </Button>
              <Button
                onClick={handleBulkReject}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-amber-500/10 border-none"
              >
                <AlertTriangle className="size-3.5" />
                {language === 'vi' ? 'Từ chối' : 'Reject'}
              </Button>
              <Button
                onClick={handleBulkDelete}
                className="bg-rose-600 hover:bg-rose-505 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-500/10 border-none"
              >
                <Trash2 className="size-3.5" />
                {language === 'vi' ? 'Xóa' : 'Delete'}
              </Button>
              <Button
                onClick={handleExportReport}
                className="bg-slate-700 hover:bg-slate-600 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
              >
                <FileSpreadsheet className="size-3.5" />
                {language === 'vi' ? 'Xuất báo cáo' : 'Export Report'}
              </Button>
            </div>
            <button
              onClick={() => setSelectedDocIds([])}
              className="text-xs text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-905 font-bold ml-2 underline focus:outline-none cursor-pointer"
            >
              {language === 'vi' ? 'Bỏ chọn' : 'Clear'}
            </button>
          </div>
        )}

        {/* C. UNIFIED REVIEW DETAILS MODAL */}
        {previewDoc && (
          <Modal
            isOpen={!!previewDoc}
            onClose={() => {
              setPreviewDoc(null)
              setAdminFeedback('')
            }}
            title={language === 'vi' ? 'Kiểm duyệt chi tiết tài liệu & Quét AI' : 'Detailed Document Review & AI Scan'}
            className="max-w-4xl"
          >
            <div className="space-y-5 text-left text-sm text-slate-600 dark:text-slate-350 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Section 1: General Info */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Thông tin chung' : 'General Info'}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-2">
                    <p className="font-extrabold text-slate-800 dark:text-white text-base truncate" title={previewDoc.title}>
                      {previewDoc.title}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">{language === 'vi' ? 'Định dạng' : 'Format'}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold uppercase">{previewDoc.fileType}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">{language === 'vi' ? 'Kích thước' : 'Size'}</span>
                        <span className="text-slate-700 dark:text-slate-305 font-bold">{previewDoc.sizeMB} MB</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">{language === 'vi' ? 'Ngày tải' : 'Upload Date'}</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold">{previewDoc.uploadedAt}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase">{language === 'vi' ? 'Nguồn' : 'Source'}</span>
                        <span className="text-slate-707 dark:text-slate-300 font-bold uppercase">{previewDoc.uploadSource}</span>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-1">
                    {language === 'vi' ? 'Người tải lên' : 'Uploader Info'}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 text-xs">
                    <p className="font-bold text-slate-850 dark:text-white">{previewDoc.ownerName}</p>
                    <p className="text-slate-450 dark:text-slate-500 font-mono mt-0.5">{previewDoc.ownerEmail}</p>
                  </div>
                </div>

                {/* Section 2: AI Scanned Risk Metrics with Progress Bars */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Chỉ số phân tích AI' : 'AI Analysis Indicators'}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-3">
                    
                    {/* AI Probability */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-purple-650 dark:text-purple-400 flex items-center gap-1">
                          <Sparkles className="size-3" />
                          AI Generated Probability
                        </span>
                        <span className="font-black text-purple-600 dark:text-purple-400">{previewDoc.aiConfidenceScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 dark:bg-purple-600 rounded-full transition-all duration-550"
                          style={{ width: `${previewDoc.aiConfidenceScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Plagiarism */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-350">{language === 'vi' ? 'Tỷ lệ đạo văn' : 'Plagiarism Score'}</span>
                        <span className={cn("font-black", previewDoc.plagiarismScore >= 30 ? "text-rose-500" : "text-slate-700 dark:text-slate-300")}>
                          {previewDoc.plagiarismScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-550",
                            previewDoc.plagiarismScore >= 30 ? "bg-rose-500" : "bg-blue-500"
                          )}
                          style={{ width: `${previewDoc.plagiarismScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Unsafe content */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-350">{language === 'vi' ? 'Nội dung không an toàn' : 'Unsafe Content Score'}</span>
                        <span className={cn("font-black", previewDoc.unsafeContentScore >= 20 ? "text-rose-500" : "text-slate-700 dark:text-slate-305")}>
                          {previewDoc.unsafeContentScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-550",
                            previewDoc.unsafeContentScore >= 20 ? "bg-rose-505" : "bg-emerald-500"
                          )}
                          style={{ width: `${previewDoc.unsafeContentScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Spam score */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-350">Spam Score</span>
                        <span className={cn("font-black", previewDoc.spamScore >= 40 ? "text-amber-500" : "text-slate-700 dark:text-slate-305")}>
                          {previewDoc.spamScore}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-550",
                            previewDoc.spamScore >= 40 ? "bg-amber-500" : "bg-slate-400"
                          )}
                          style={{ width: `${previewDoc.spamScore}%` }}
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Banned Keywords & Reports Logs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Banned Keywords */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Từ khóa nhạy cảm / cấm phát hiện' : 'Sensitive Keywords Detected'}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 min-h-[70px] flex flex-wrap gap-1.5 items-center">
                    {previewDoc.bannedKeywords && previewDoc.bannedKeywords.length > 0 ? (
                      previewDoc.bannedKeywords.map((kw, i) => (
                        <Badge key={i} className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-xs px-2.5 py-0.5 rounded-full font-bold">
                          {kw}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">{language === 'vi' ? 'Không phát hiện từ khóa cấm' : 'No banned keywords found'}</span>
                    )}
                  </div>
                </div>

                {/* Report logs */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Báo cáo vi phạm' : 'Reports Info'}
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-955 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 min-h-[70px] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-850 dark:text-slate-200 text-sm">
                        {previewDoc.reportCount} {language === 'vi' ? 'báo cáo từ người dùng' : 'user reports'}
                      </p>
                      {previewDoc.reportCount > 0 && (
                        <p className="text-xs text-slate-455 dark:text-slate-505 font-semibold mt-0.5">
                          {language === 'vi' ? 'Lý do: Nội dung spam hoặc vi phạm bản quyền' : 'Reasons: Spam content or copyright infringement'}
                        </p>
                      )}
                    </div>
                    {previewDoc.reportCount > 0 && (
                      <ShieldAlert className="size-8 text-rose-500 shrink-0" />
                    )}
                  </div>
                </div>
              </div>

              {/* Moderator notes */}
              <div className="space-y-2 pt-1">
                <label className="font-extrabold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-505 block">
                  {language === 'vi' ? 'Ghi chú của người kiểm duyệt' : 'Moderator Notes / Feedback'}
                </label>
                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder={language === 'vi' ? "Nhập ghi chú phản hồi cho người tải lên..." : "Type comments or reasons for approval/rejection..."}
                  className="w-full min-h-[75px] p-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-105 dark:placeholder:text-slate-600 font-semibold"
                />
              </div>

              {/* Modal footer actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      toast.success(`Simulating download of "${previewDoc.title}.${previewDoc.fileType}"`);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <Download className="size-3.5" />
                    {language === 'vi' ? 'Tải xuống' : 'Download'}
                  </Button>
                  <Button
                    onClick={() => handleUpdateDocument(previewDoc.id, { isFlagged: !previewDoc.isFlagged })}
                    className={cn(
                      "font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none",
                      previewDoc.isFlagged
                        ? "bg-rose-500/10 text-rose-600 dark:bg-rose-955/20 hover:bg-rose-100"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50"
                    )}
                  >
                    <AlertTriangle className="size-3.5" />
                    {previewDoc.isFlagged 
                      ? (language === 'vi' ? 'Bỏ cờ' : 'Unflag') 
                      : (language === 'vi' ? 'Gắn cờ' : 'Flag')}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {previewDoc.status !== 'approved' && (
                    <Button
                      onClick={() => {
                        handleApproveDocument(previewDoc.id);
                        setPreviewDoc(null);
                        setAdminFeedback('');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <CheckCircle className="size-3.5" />
                      {language === 'vi' ? 'Duyệt tài liệu' : 'Approve'}
                    </Button>
                  )}
                  {previewDoc.status !== 'rejected' && (
                    <Button
                      onClick={() => {
                        handleRejectDocument(previewDoc.id);
                        setPreviewDoc(null);
                        setAdminFeedback('');
                      }}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <XCircle className="size-3.5" />
                      {language === 'vi' ? 'Từ chối' : 'Reject'}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setPreviewDoc(null);
                      setAdminFeedback('');
                    }}
                    className="bg-slate-700 hover:bg-slate-600 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-900 font-extrabold px-3.5 py-2 rounded-xl text-xs cursor-pointer border-none"
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </Button>
                </div>
              </div>

            </div>
          </Modal>
        )}

        {/* D. CONFIRM DELETE MODAL */}
        {deleteDoc && (
          <Modal
            isOpen={!!deleteDoc}
            onClose={() => setDeleteDoc(null)}
            title={language === 'vi' ? 'Xác nhận xóa tài liệu' : 'Confirm Delete'}
          >
            <div className="space-y-4 text-left py-1.5">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                {language === 'vi' 
                  ? `Bạn có chắc chắn muốn xóa tài liệu "${deleteDoc.title}" khỏi hệ thống? Hành động này không thể hoàn tác.`
                  : `Are you sure you want to permanently delete the document "${deleteDoc.title}"? This action cannot be undone.`}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  onClick={() => setDeleteDoc(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none"
                >
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    handleDeleteDocument(deleteDoc.id);
                    setDeleteDoc(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-505 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none"
                >
                  {language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete Permanently'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  // B. STUDENT MODE VIEW
  return (
    <div className="space-y-6.5 animate-fade-in pb-8">
      {/* 1. Breadcrumb Back Navigation */}
      <div>
        <button
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#3155F6] dark:text-slate-400 dark:hover:text-[#5275ff] transition-colors focus:outline-none"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0 stroke-[2.2]" />
          {t.searchResultsPage.backToDocs}
        </button>
      </div>

      {/* 2. Page Header Block */}
      <div className="space-y-2 pt-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[38px] leading-tight">
          {t.searchResultsPage.resultsCount(searchedStudentDocuments.length, keyword || t.common.all)}
        </h1>
        
        {/* Search History Row */}
        <div className="flex items-center gap-2 text-[13px] text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0" />
          <span className="font-semibold text-slate-500 dark:text-slate-400">{t.searchResultsPage.searchHistory}</span>
          <div className="flex flex-wrap items-center gap-1.5 ml-1">
            {[
              { key: 'Psychology', label: t.searchResultsPage.historyPsychology },
              { key: 'Brain', label: t.searchResultsPage.historyBrain },
              { key: 'Biology', label: t.searchResultsPage.historyBiology }
            ].map((item, index) => (
              <span key={item.key} className="flex items-center">
                <button
                  onClick={() => handleHistorySearch(item.key)}
                  className="text-slate-500 hover:text-[#3155F6] dark:text-slate-400 dark:hover:text-[#5275ff] hover:underline transition-colors"
                >
                  {item.label}
                </button>
                {index < 2 && <span className="text-slate-400 dark:text-slate-600 mx-1">,</span>}
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
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-505">
              {t.searchResultsPage.subject}
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'NEUROSCIENCE', name: t.searchResultsPage.subjects.neuroscience, count: studentNeuroCount },
                { id: 'BIOLOGY', name: t.searchResultsPage.subjects.biology, count: studentBioCount },
                { id: 'PSYCHOLOGY', name: t.searchResultsPage.subjects.psychology, count: studentPsychCount }
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
                        isChecked ? "text-[#3155F6] dark:text-[#5275ff]" : "text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                      )}>
                        {subj.name}
                      </span>
                    </div>
                    <span className={cn(
                      "rounded-full font-bold text-[11px] px-2.5 py-0.5 shadow-2xs transition-colors",
                      isChecked 
                        ? "bg-[#EBF1FF] text-[#3155F6] dark:bg-[#3155F6]/10 dark:text-[#5275ff]" 
                        : "bg-slate-100/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
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
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555">
              {t.searchResultsPage.fileType}
            </h3>
            <div className="space-y-3.5">
              {[
                { id: 'pdf', name: t.searchResultsPage.fileTypes.pdf, icon: <PDFIcon /> },
                { id: 'notes', name: t.searchResultsPage.fileTypes.notes, icon: <LectureNotesIcon /> },
                { id: 'presentations', name: t.searchResultsPage.fileTypes.presentations, icon: <PresentationsIcon /> }
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
                      <span className={cn(
                        "flex items-center gap-2 text-[14.5px] font-semibold transition-colors",
                        isChecked ? "text-[#3155F6] dark:text-[#5275ff]" : "text-slate-600 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200"
                      )}>
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
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {t.searchResultsPage.dateAdded}
            </h3>
            
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4.5 py-3 pr-10 text-[14px] font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3155F6]/20 cursor-pointer shadow-2xs transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:focus-visible:ring-[#3155F6]/30"
              >
                <option value="Last 7 Days">{t.searchResultsPage.dateOptions.last7Days}</option>
                <option value="Last 30 Days">{t.searchResultsPage.dateOptions.last30Days}</option>
                <option value="All Time">{t.searchResultsPage.dateOptions.allTime}</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none stroke-[2]" />
            </div>
          </div>

        </div>

        {/* Right Result Column (width 9 of 12) */}
        <div className="lg:col-span-9 space-y-6">
          {filteredStudentDocuments.length === 0 ? (
            /* Empty state for search results */
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 py-16 px-6 text-center shadow-2xs">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF1FF] text-[#3155F6] dark:bg-[#3155F6]/10 dark:text-[#5275ff]">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-[17px] font-extrabold text-slate-900 dark:text-slate-100">{t.searchResultsPage.noMatches}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm font-medium">
                {t.searchResultsPage.noMatchesSub}
              </p>
              <button
                onClick={() => {
                  setSelectedSubjects(['NEUROSCIENCE'])
                  setSelectedFileTypes(['pdf'])
                  setDateFilter('Last 7 Days')
                }}
                className="mt-6 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#3155F6] dark:hover:text-[#5275ff] transition-all"
              >
                {t.searchResultsPage.resetFilters}
              </button>
            </div>
          ) : (
            /* Match results list */
            filteredStudentDocuments.map(doc => {
              const translatedDetails = t.searchResultsPage.documentDetails[doc.id as keyof typeof t.searchResultsPage.documentDetails]
              const details = translatedDetails || (DOCUMENT_DETAILS[doc.id] ? {
                label: DOCUMENT_DETAILS[doc.id].label,
                description: DOCUMENT_DETAILS[doc.id].description,
                tags: DOCUMENT_DETAILS[doc.id].tags
              } : {
                label: t.searchResultsPage.defaultLabel,
                description: t.searchResultsPage.defaultDesc(doc.title || doc.fileName),
                tags: [`#${t.searchResultsPage.subjects[doc.subject.toLowerCase() as keyof typeof t.searchResultsPage.subjects]?.toLowerCase() || doc.subject.toLowerCase()}`, ...t.searchResultsPage.defaultTags]
              })
              const isBookmarked = bookmarkedDocs[doc.id] || false

              return (
                <div
                  key={doc.id}
                  onClick={() => handleOpenDocument(doc.id)}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-8 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:border-[#3155F6]/10 dark:hover:border-[#3155F6]/30 hover:shadow-[0_8px_30px_rgba(49,85,246,0.04)] hover:-translate-y-0.5 cursor-pointer transition-all duration-300"
                >
                  
                  {/* Top Row: AI Generated tag + labels + bookmark/share actions */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3.5">
                      {/* AI Generated Pill */}
                      <span className="flex items-center gap-1.5 rounded-md bg-[#EBF1FF] dark:bg-[#3155F6]/10 px-2.5 py-1 text-[10px] font-extrabold tracking-wider text-[#3155F6] dark:text-[#5275ff]">
                        <Sparkles className="h-3 w-3 text-[#3155F6] dark:text-[#5275ff] fill-[#3155F6]/10" />
                        {t.searchResultsPage.aiGenerated}
                      </span>
                      {/* Label */}
                      <span className="text-[10px] font-extrabold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                        {details.label}
                      </span>
                    </div>

                    {/* Bookmark and Share icons */}
                    <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleBookmark(doc.id, e)}
                        className={cn(
                          "text-slate-400 dark:text-slate-500 hover:text-[#3155F6] dark:hover:text-[#5275ff] transition-all duration-200 focus:outline-none",
                          isBookmarked ? "text-[#3155F6] dark:text-[#5275ff]" : "text-slate-400 dark:text-slate-500"
                        )}
                        title={t.searchResultsPage.bookmarkTooltip}
                      >
                        <Bookmark className={cn("h-[20px] w-[20px]", isBookmarked && "fill-[#3155F6] stroke-[#3155F6] dark:fill-[#5275ff] dark:stroke-[#5275ff]")} />
                      </button>
                      <button
                        onClick={(e) => handleShare(doc.title || doc.fileName, e)}
                        className="text-slate-400 dark:text-slate-500 hover:text-[#3155F6] dark:hover:text-[#5275ff] transition-all duration-200 focus:outline-none"
                        title={t.searchResultsPage.shareTooltip}
                      >
                        <Share2 className="h-[20px] w-[20px]" />
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <div className="mt-4.5 flex-1">
                    <h2 className="text-[22px] font-extrabold text-[#0f172a] dark:text-slate-100 group-hover:text-[#3155F6] dark:group-hover:text-[#5275ff] transition-colors leading-snug tracking-tight">
                      {doc.title || doc.fileName}
                    </h2>
                    
                    {/* Document Description */}
                    <p className="mt-3.5 text-[14px] leading-relaxed text-[#475569] dark:text-slate-400 font-medium">
                      {details.description}
                    </p>
                  </div>

                  {/* Document Tags */}
                  <div className="mt-5.5 flex flex-wrap items-center gap-2">
                    {details.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-[#F0F2FB] dark:bg-slate-800 px-3.5 py-1.5 text-[12px] font-semibold text-[#475569] dark:text-slate-400 transition-all hover:bg-slate-200/80 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
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

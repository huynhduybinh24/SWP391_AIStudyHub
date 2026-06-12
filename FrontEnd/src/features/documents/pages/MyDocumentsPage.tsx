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
  Pencil,
  BrainCircuit,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { ShareDocumentModal } from '../components/ShareDocumentModal'

interface DocumentItem {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  uploadedDateObj: Date
  size: string
  sizeKb: number
  subject: string
  status: 'ANALYZED' | 'PENDING' | 'SCANNING' | 'QUEUED'
  type: 'pdf' | 'word' | 'image' | 'text' | 'slides'
}

interface DocumentsContextType {
  documents: DocumentItem[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  openUploadModal: () => void
  openChatDrawer: (doc: DocumentItem) => void
  openPreviewModal: (doc: DocumentItem) => void
  openQuizModal: (doc?: DocumentItem) => void
  showToast: (message: string) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => React.ReactNode
  renderStatusBadge: (status: string) => React.ReactNode
}

interface FptSubjectInfo {
  id: string
  title: string
  courseCode: string
  semester: string
  majors: ('SE' | 'AI' | 'BA')[]
}

const FPT_SUBJECTS: FptSubjectInfo[] = [
  // Semester 1 (K1)
  { id: 'PRF192', title: 'Programming Fundamentals', courseCode: 'PRF192', semester: 'K1', majors: ['SE', 'AI'] },
  { id: 'MAE101', title: 'Mathematics for Engineering', courseCode: 'MAE101', semester: 'K1', majors: ['SE', 'AI'] },
  { id: 'CEA201', title: 'Computer Organization', courseCode: 'CEA201', semester: 'K1', majors: ['SE', 'AI'] },
  { id: 'CSI104', title: 'Introduction to Computer Science', courseCode: 'CSI104', semester: 'K1', majors: ['SE', 'AI'] },
  { id: 'MGT103', title: 'Introduction to Management', courseCode: 'MGT103', semester: 'K1', majors: ['BA'] },
  { id: 'ECO111', title: 'Microeconomics', courseCode: 'ECO111', semester: 'K1', majors: ['BA'] },
  { id: 'FMA101', title: 'Financial Mathematics', courseCode: 'FMA101', semester: 'K1', majors: ['BA'] },

  // Semester 2 (K2)
  { id: 'PRO192', title: 'Object-Oriented Programming', courseCode: 'PRO192', semester: 'K2', majors: ['SE', 'AI'] },
  { id: 'MAD101', title: 'Discrete Mathematics', courseCode: 'MAD101', semester: 'K2', majors: ['SE', 'AI'] },
  { id: 'OSG202', title: 'Operating Systems', courseCode: 'OSG202', semester: 'K2', majors: ['SE', 'AI'] },
  { id: 'SSG104', title: 'Communication Skills', courseCode: 'SSG104', semester: 'K2', majors: ['SE', 'AI', 'BA'] },
  { id: 'MKT101', title: 'Basic Marketing', courseCode: 'MKT101', semester: 'K2', majors: ['BA'] },
  { id: 'ECO121', title: 'Macroeconomics', courseCode: 'ECO121', semester: 'K2', majors: ['BA'] },
  { id: 'AMG111', title: 'Art Management', courseCode: 'AMG111', semester: 'K2', majors: ['BA'] },

  // Semester 3 (K3)
  { id: 'CSD201', title: 'Data Structures and Algorithms', courseCode: 'CSD201', semester: 'K3', majors: ['SE', 'AI'] },
  { id: 'DBI202', title: 'Database Systems', courseCode: 'DBI202', semester: 'K3', majors: ['SE', 'AI', 'BA'] },
  { id: 'LAB211', title: 'OOP Java Lab', courseCode: 'LAB211', semester: 'K3', majors: ['SE'] },
  { id: 'AIL302M', title: 'Machine Learning', courseCode: 'AIL302m', semester: 'K3', majors: ['AI'] },
  { id: 'ACC101', title: 'Principles of Accounting', courseCode: 'ACC101', semester: 'K3', majors: ['BA'] },
  { id: 'FIN201', title: 'Corporate Finance', courseCode: 'FIN201', semester: 'K3', majors: ['BA'] },
  { id: 'BUL201', title: 'Business Law', courseCode: 'BUL201', semester: 'K3', majors: ['BA'] },

  // Semester 4 (K4)
  { id: 'PRN211', title: 'Basic Cross-Platform Application (.NET)', courseCode: 'PRN211', semester: 'K4', majors: ['SE'] },
  { id: 'SWE201', title: 'Introduction to Software Engineering', courseCode: 'SWE201', semester: 'K4', majors: ['SE'] },
  { id: 'JPD113', title: 'Japanese Language 1', courseCode: 'JPD113', semester: 'K4', majors: ['SE', 'AI'] },
  { id: 'AIP301', title: 'Artificial Intelligence Project', courseCode: 'AIP301', semester: 'K4', majors: ['AI'] },
  { id: 'MTH202', title: 'Probability and Statistics', courseCode: 'MTH202', semester: 'K4', majors: ['SE', 'AI'] },
  { id: 'HRM201', title: 'Human Resource Management', courseCode: 'HRM201', semester: 'K4', majors: ['BA'] },
  { id: 'OBH201', title: 'Organizational Behavior', courseCode: 'OBH201', semester: 'K4', majors: ['BA'] },
  { id: 'MRF301', title: 'Marketing Research', courseCode: 'MRF301', semester: 'K4', majors: ['BA'] },

  // Semester 5 (K5)
  { id: 'SWP391', title: 'Software Development Project', courseCode: 'SWP391', semester: 'K5', majors: ['SE', 'AI'] },
  { id: 'SWD392', title: 'Software Architecture and Design', courseCode: 'SWD392', semester: 'K5', majors: ['SE'] },
  { id: 'SWT301', title: 'Software Testing', courseCode: 'SWT301', semester: 'K5', majors: ['SE'] },
  { id: 'DLN301', title: 'Deep Learning', courseCode: 'DLN301', semester: 'K5', majors: ['AI'] },
  { id: 'BIS301', title: 'Business Information Systems', courseCode: 'BIS301', semester: 'K5', majors: ['BA'] },
  { id: 'ENT301', title: 'Entrepreneurship', courseCode: 'ENT301', semester: 'K5', majors: ['SE', 'AI', 'BA'] },
  { id: 'POM201', title: 'Production and Operations Management', courseCode: 'POM201', semester: 'K5', majors: ['BA'] },

  // Semester 6 (K6)
  { id: 'OJT202', title: 'On-the-Job Training (OJT)', courseCode: 'OJT202', semester: 'K6', majors: ['SE', 'AI', 'BA'] },

  // Semester 7 (K7)
  { id: 'PRM392', title: 'Mobile Programming', courseCode: 'PRM392', semester: 'K7', majors: ['SE', 'AI'] },
  { id: 'PRN221', title: 'Advanced Cross-Platform Application (.NET)', courseCode: 'PRN221', semester: 'K7', majors: ['SE'] },
  { id: 'WDP301', title: 'Web Development Project', courseCode: 'WDP301', semester: 'K7', majors: ['SE'] },
  { id: 'NLP301', title: 'Natural Language Processing', courseCode: 'NLP301', semester: 'K7', majors: ['AI'] },
  { id: 'CVP301', title: 'Computer Vision Project', courseCode: 'CVP301', semester: 'K7', majors: ['AI'] },
  { id: 'IBM301', title: 'International Business Management', courseCode: 'IBM301', semester: 'K7', majors: ['BA'] },
  { id: 'SCM301', title: 'Supply Chain Management', courseCode: 'SCM301', semester: 'K7', majors: ['BA'] },
  { id: 'BRM301', title: 'Business Research Methods', courseCode: 'BRM301', semester: 'K7', majors: ['BA'] },

  // Semester 8 (K8)
  { id: 'SEP490', title: 'Capstone Project Preparation (SE)', courseCode: 'SEP490', semester: 'K8', majors: ['SE'] },
  { id: 'CAP490', title: 'Capstone Project Preparation (AI)', courseCode: 'CAP490', semester: 'K8', majors: ['AI'] },
  { id: 'BAP490', title: 'Capstone Project Preparation (BA)', courseCode: 'BAP490', semester: 'K8', majors: ['BA'] },
  { id: 'EXE101', title: 'Experiential Entrepreneurship 1', courseCode: 'EXE101', semester: 'K8', majors: ['SE', 'AI', 'BA'] },
  { id: 'IAS301', title: 'Information Assurance & Security', courseCode: 'IAS301', semester: 'K8', majors: ['SE'] },
  { id: 'BDA301', title: 'Big Data Analytics', courseCode: 'BDA301', semester: 'K8', majors: ['AI'] },
  { id: 'SMA301', title: 'Strategic Management', courseCode: 'SMA301', semester: 'K8', majors: ['BA'] },

  // Semester 9 (K9)
  { id: 'SEP490_DEF', title: 'Capstone Project Graduation (SE)', courseCode: 'SEP490', semester: 'K9', majors: ['SE'] },
  { id: 'CAP490_DEF', title: 'Capstone Project Graduation (AI)', courseCode: 'CAP490', semester: 'K9', majors: ['AI'] },
  { id: 'BAP490_DEF', title: 'Capstone Project Graduation (BA)', courseCode: 'BAP490', semester: 'K9', majors: ['BA'] },
  { id: 'EXE201', title: 'Experiential Entrepreneurship 2', courseCode: 'EXE201', semester: 'K9', majors: ['SE', 'AI', 'BA'] },
  { id: 'PMG201', title: 'Project Management', courseCode: 'PMG201', semester: 'K9', majors: ['SE', 'AI'] },
  { id: 'EBU301', title: 'E-Business', courseCode: 'EBU301', semester: 'K9', majors: ['BA'] }
]

export default function MyDocumentsPage() {
  const navigate = useNavigate()
  const { language, t } = useTranslation()
  const {
    documents,
    openUploadModal,
    openChatDrawer,
    openQuizModal,
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
  const [shareDocModalOpen, setShareDocModalOpen] = useState(false)
  const [selectedShareDoc, setSelectedShareDoc] = useState<DocumentItem | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<'SE' | 'AI' | 'BA' | 'ALL'>('SE')
  const [selectedSemester, setSelectedSemester] = useState<string>('ALL')

  const handleOpenDocument = (docId: string) => {
    setActiveMenuId(null)
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

  // Filter FPT subjects based on selected major and semester
  const displayedSubjects = FPT_SUBJECTS.filter(subj => {
    // Filter by Major
    const majorMatch = selectedMajor === 'ALL' || subj.majors.includes(selectedMajor as any)
    // Filter by Semester
    const semesterMatch = selectedSemester === 'ALL' || subj.semester === selectedSemester
    return majorMatch && semesterMatch
  })

  const getDocCountForSubject = (subjId: string) => {
    return documents.filter(d => String(d.subject).toUpperCase() === subjId.toUpperCase()).length
  }

  const getDocumentsCountLabel = (count: number) => {
    if (language === 'en') {
      return `${count} ${count === 1 ? 'Document' : 'Documents'}`
    }
    if (language === 'vi') {
      return `${count} Tài liệu`
    }
    if (language === 'ja') {
      return `${count} 件のドキュメント`
    }
    if (language === 'ko') {
      return `${count}개의 문서`
    }
    return `${count} Documents`
  }

  const getSubjectName = (subject: string) => {
    const s = subject.toUpperCase()
    if (s === 'ALL') return language === 'en' ? 'All Subjects' : (language === 'vi' ? 'Tất cả môn học' : (language === 'ja' ? 'すべての科目' : '모든 과목'))
    const found = FPT_SUBJECTS.find(x => x.id === s)
    if (found) return found.title
    return subject
  }

  const getTypeName = (type: string) => {
    const tLower = type.toLowerCase()
    if (tLower === 'all') return language === 'en' ? 'All Types' : (language === 'vi' ? 'Tất cả loại tệp' : (language === 'ja' ? 'すべてのタイプ' : '모든 유형'))
    const typeMap: Record<string, Record<string, string>> = {
      pdf: { en: 'PDF', vi: 'PDF', ja: 'PDF', ko: 'PDF' },
      word: { en: 'Word', vi: 'Word', ja: 'Word', ko: 'Word' },
      text: { en: 'Text', vi: 'Văn bản', ja: 'テキスト', ko: '텍스트' },
      image: { en: 'Image', vi: 'Hình ảnh', ja: '画像', ko: '이미지' },
      slides: { en: 'Slides', vi: 'Trình chiếu', ja: 'スライド', ko: '슬라이드' }
    }
    return typeMap[tLower]?.[language] || type
  }

  return (
    <div className="space-y-8">
      {/* Figma Header Block for general Documents Page */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            {/* Folder layout icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EBF1FF] text-[#2563eb] border border-blue-100/50 shadow-xs dark:bg-blue-955/40 dark:border-blue-900/50 dark:text-blue-450">
              <FileText className="h-7 w-7 text-[#2563eb] dark:text-blue-400 stroke-[1.8]" />
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight dark:text-slate-100">
                {t.myDocuments.title}
              </h1>
              <p className="text-[13px] md:text-sm font-medium text-slate-500 leading-relaxed max-w-2xl dark:text-slate-400">
                {t.myDocuments.subtitle}
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
                  ? "border-[#2563eb]/40 bg-blue-50 text-[#2563eb] dark:bg-blue-955/30 dark:border-blue-500/50 dark:text-blue-450" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              )}
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
              {language === 'en' ? 'Filter' : (language === 'vi' ? 'Bộ lọc' : (language === 'ja' ? 'フィルター' : '필터'))}
            </Button>

            <Button
              onClick={openUploadModal}
              className="group flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 font-bold text-sm text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all h-[42px]"
            >
              <Plus className="h-4.5 w-4.5" />
              {language === 'en' ? 'Upload New' : (language === 'vi' ? 'Tải lên mới' : (language === 'ja' ? '新規アップロード' : '새로 업로드'))}
            </Button>
          </div>
        </div>
      </div>


      {/* FPT University Classification & Filters */}
      <div className="space-y-5 bg-slate-50/50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-150 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
              {language === 'en' ? 'FPT UNIVERSITY ROADMAP' : 'LỘ TRÌNH ĐẠI HỌC FPT'}
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Select your major and semester to view subjects' : 'Chọn ngành học và học kỳ để xem danh sách môn học'}
            </p>
          </div>

          {/* Major Select Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {language === 'en' ? 'Major:' : 'Ngành học:'}
            </span>
            <select
              value={selectedMajor}
              onChange={(e) => {
                setSelectedMajor(e.target.value as any)
                setSelectedSemester('ALL') // Reset semester to avoid showing empty screens
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 cursor-pointer"
            >
              <option value="SE">{language === 'en' ? 'Software Engineering (SE)' : 'Kỹ thuật phần mềm (SE)'}</option>
              <option value="AI">{language === 'en' ? 'Artificial Intelligence (AI)' : 'Trí tuệ nhân tạo (AI)'}</option>
              <option value="BA">{language === 'en' ? 'Business Administration (BA)' : 'Quản trị kinh doanh (BA)'}</option>
              <option value="ALL">{language === 'en' ? 'All Majors' : 'Tất cả các ngành'}</option>
            </select>
          </div>
        </div>

        {/* Semester Tab Switcher */}
        <div className="flex flex-wrap gap-2 border-t border-slate-200/60 dark:border-slate-800/50 pt-4 overflow-x-auto scrollbar-none">
          {[
            { key: 'ALL', labelEn: 'All Semesters', labelVi: 'Tất cả học kỳ' },
            { key: 'K1', labelEn: 'Semester 1', labelVi: 'Học kỳ 1' },
            { key: 'K2', labelEn: 'Semester 2', labelVi: 'Học kỳ 2' },
            { key: 'K3', labelEn: 'Semester 3', labelVi: 'Học kỳ 3' },
            { key: 'K4', labelEn: 'Semester 4', labelVi: 'Học kỳ 4' },
            { key: 'K5', labelEn: 'Semester 5', labelVi: 'Học kỳ 5' },
            { key: 'K6', labelEn: 'Semester 6', labelVi: 'Học kỳ 6' },
            { key: 'K7', labelEn: 'Semester 7', labelVi: 'Học kỳ 7' },
            { key: 'K8', labelEn: 'Semester 8', labelVi: 'Học kỳ 8' },
            { key: 'K9', labelEn: 'Semester 9', labelVi: 'Học kỳ 9' }
          ].map((sem) => (
            <button
              key={sem.key}
              onClick={() => setSelectedSemester(sem.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 border cursor-pointer select-none whitespace-nowrap",
                selectedSemester === sem.key
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-900"
              )}
            >
              {language === 'en' ? sem.labelEn : sem.labelVi}
            </button>
          ))}
        </div>
      </div>

      {/* Folders List Grid Section */}
      <div className="space-y-4">
        <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
          {language === 'en' ? 'SUBJECT FOLDERS' : 'THƯ MỤC MÔN HỌC'}
        </h3>
        
        {displayedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {displayedSubjects.map((subject) => {
              const docCount = getDocCountForSubject(subject.id)
              return (
                <div 
                  key={subject.id}
                  onClick={() => navigate(`/dashboard/documents/subject/${subject.id.toLowerCase()}`)}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-500/45 hover:shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-primary border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 dark:border-blue-500/30">
                    <FolderPlus className="h-5.5 w-5.5 text-blue-600 group-hover:text-white dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[15px] font-extrabold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors truncate">
                      {subject.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                      {subject.courseCode} &bull; {getDocumentsCountLabel(docCount)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30">
            <FolderPlus className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'No subjects found for this selection.' : 'Không tìm thấy môn học nào cho lựa chọn này.'}
            </p>
          </div>
        )}
      </div>

      {/* Filter and List Workspace */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
          <h2 className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase dark:text-slate-500">
            {t.myDocuments.workspace}
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
              placeholder={language === 'en' ? 'Filter by name...' : (language === 'vi' ? 'Lọc theo tên...' : (language === 'ja' ? '名前でフィルター...' : '이름으로 필터링...'))}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#2563eb]/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/10 transition-all dark:border-slate-800 dark:bg-slate-850 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-950"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-350"
              >
                {language === 'en' ? 'Clear' : (language === 'vi' ? 'Xóa' : (language === 'ja' ? 'クリア' : '지우기'))}
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{language === 'en' ? 'Subject:' : (language === 'vi' ? 'Môn học:' : (language === 'ja' ? '科目:' : '과목:'))}</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1 dark:text-slate-200 dark:bg-slate-850"
              >
                <option value="All" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('All')}</option>
                <option value="Mathematics" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Mathematics')}</option>
                <option value="Biology" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Biology')}</option>
                <option value="Physics" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Physics')}</option>
                <option value="Compsci" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Compsci')}</option>
                <option value="Philosophy" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Philosophy')}</option>
                <option value="Economics" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Economics')}</option>
                <option value="Neuroscience" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Neuroscience')}</option>
                <option value="Psychology" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('Psychology')}</option>
                <option value="General" className="dark:bg-slate-900 dark:text-slate-100">{getSubjectName('General')}</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 dark:border-slate-800 dark:bg-slate-850">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{language === 'en' ? 'Type:' : (language === 'vi' ? 'Loại tệp:' : (language === 'ja' ? 'タイプ:' : '유형:'))}</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1 dark:text-slate-200 dark:bg-slate-850"
              >
                <option value="All" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('All')}</option>
                <option value="Pdf" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('Pdf')}</option>
                <option value="Word" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('Word')}</option>
                <option value="Text" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('Text')}</option>
                <option value="Image" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('Image')}</option>
                <option value="Slides" className="dark:bg-slate-900 dark:text-slate-100">{getTypeName('Slides')}</option>
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
                title={language === 'en' ? 'Grid View' : (language === 'vi' ? 'Chế độ lưới' : (language === 'ja' ? 'グリッド表示' : '그リッド 뷰'))}
                aria-label={language === 'en' ? 'Grid View' : (language === 'vi' ? 'Chế độ lưới' : (language === 'ja' ? 'グリッド表示' : '그リッド 뷰'))}
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
                title={language === 'en' ? 'List View' : (language === 'vi' ? 'Chế độ danh sách' : (language === 'ja' ? 'リスト表示' : '리스트 뷰'))}
                aria-label={language === 'en' ? 'List View' : (language === 'vi' ? 'Chế độ danh sách' : (language === 'ja' ? 'リスト表示' : '리스트 뷰'))}
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
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-200">{t.myDocuments.noDocs}</h3>
            <p className="mt-2 text-sm text-slate-400 max-w-sm dark:text-slate-500">
              {t.myDocuments.noDocsSub}
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
              {t.myDocuments.resetFilters}
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
                          {t.actionMenu.chatAI}
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null)
                            openQuizModal(doc)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-[#2563eb] transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 cursor-pointer"
                        >
                          <BrainCircuit className="h-4 w-4 text-indigo-500" />
                          🎯 {t.actionMenu.practiceQuiz}
                        </button>
                        <button
                          onClick={() => handleOpenDocument(doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {t.actionMenu.open}
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/documents/document/${doc.id}/edit`)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4" />
                          {t.actionMenu.editDetails}
                        </button>
                        <button
                          onClick={() => handleDownloadFile(doc)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Download className="h-4 w-4" />
                          {t.actionMenu.download}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null)
                            setSelectedShareDoc(doc)
                            setShareDocModalOpen(true)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Share2 className="h-4 w-4 text-emerald-500" />
                          {language === 'vi' ? 'Chia sẻ nhóm' : 'Share to workspace'}
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t.actionMenu.deleteDoc}
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
                {t.myDocuments.addNewFile}
              </h4>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {t.myDocuments.maxSize}
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
                    <th className="px-6 py-4">{language === 'en' ? 'Name' : (language === 'vi' ? 'Tên tài liệu' : (language === 'ja' ? '名前' : '이름'))}</th>
                    <th className="px-6 py-4">{t.myDocuments.subject}</th>
                    <th className="px-6 py-4">{t.myDocuments.fileSize}</th>
                    <th className="px-6 py-4">{t.myDocuments.uploadDate}</th>
                    <th className="px-6 py-4">{t.myDocuments.aiStatus}</th>
                    <th className="px-6 py-4 text-right">{t.myDocuments.actions}</th>
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
                        {doc.uploadedAt.replace('Uploaded ', '').replace('đã tải lên ', '').replace('Tải lên ', '')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex">{renderStatusBadge(doc.status)}</div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openQuizModal(doc)}
                            className="rounded-lg text-indigo-600 hover:bg-indigo-50/50 dark:text-indigo-400 dark:hover:bg-indigo-955/50"
                            title={t.actionMenu.practiceQuiz}
                          >
                            <BrainCircuit className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openChatDrawer(doc)}
                            className="rounded-lg text-[#2563eb] hover:bg-blue-50/50 dark:text-blue-400 dark:hover:bg-blue-955/50"
                            title={t.actionMenu.chatAI}
                          >
                            <MessageSquare className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedShareDoc(doc)
                              setShareDocModalOpen(true)
                            }}
                            className="rounded-lg text-emerald-600 hover:bg-emerald-50/50 dark:text-emerald-400 dark:hover:bg-emerald-955/50"
                            title={language === 'vi' ? 'Chia sẻ nhóm' : 'Share to workspace'}
                          >
                            <Share2 className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/documents/document/${doc.id}/edit`)}
                            className="rounded-lg text-slate-500 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                            title={t.actionMenu.editDetails}
                          >
                            <Pencil className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadFile(doc)}
                            className="rounded-lg text-slate-500 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800/50"
                            title={t.actionMenu.download}
                          >
                            <Download className="h-4.5 w-4.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            title={t.actionMenu.deleteDoc}
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

      <ShareDocumentModal
        isOpen={shareDocModalOpen}
        onClose={() => {
          setShareDocModalOpen(false)
          setSelectedShareDoc(null)
        }}
        documentId={selectedShareDoc?.id || ''}
        documentTitle={selectedShareDoc?.title || selectedShareDoc?.fileName || ''}
      />
    </div>
  )
}


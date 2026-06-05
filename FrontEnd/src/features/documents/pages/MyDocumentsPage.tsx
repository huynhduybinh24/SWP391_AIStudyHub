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
  BrainCircuit
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

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
  openQuizModal: (doc?: DocumentItem) => void
  showToast: (message: string) => void
  handleDownloadFile: (doc: DocumentItem) => void
  handleDeleteDocument: (id: string) => void
  renderFileIcon: (type: string) => React.ReactNode
  renderStatusBadge: (status: string) => React.ReactNode
}

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

  // Dynamic counts for top folder cards
  const compsCount = documents.filter(d => d.subject === 'COMPSCI').length
  const mathCount = documents.filter(d => d.subject === 'MATHEMATICS').length
  const bioCount = documents.filter(d => d.subject === 'BIOLOGY').length

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
    const s = subject.toLowerCase()
    if (s === 'all') return language === 'en' ? 'All Subjects' : (language === 'vi' ? 'Tất cả môn học' : (language === 'ja' ? 'すべての科目' : '모든 과목'))
    if (s === 'mathematics' || s === 'math') return t.myDocuments.math
    if (s === 'biology' || s === 'bio') return t.myDocuments.bio
    if (s === 'compsci') return t.myDocuments.compsci

    const subjectMap: Record<string, Record<string, string>> = {
      physics: { en: 'Physics', vi: 'Vật lý', ja: '物理学', ko: '물리학' },
      philosophy: { en: 'Philosophy', vi: 'Triết học', ja: '哲学', ko: '철학' },
      economics: { en: 'Economics', vi: 'Kinh tế học', ja: '経済学', ko: '経済学' },
      neuroscience: { en: 'Neuroscience', vi: 'Thần kinh học', ja: '神経科学', ko: '신경과학' },
      psychology: { en: 'Psychology', vi: 'Tâm lý học', ja: '心理学', ko: '심리학' },
      general: { en: 'General Studies', vi: 'Đại cương', ja: '一般教養', ko: '교양' }
    }
    return subjectMap[s]?.[language] || subject
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


      {/* Folders List Grid Section */}
      <div className="space-y-3.5">
        <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">{t.myDocuments.folders}</h3>
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
                {t.myDocuments.compsci}
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                CS-402 &bull; {getDocumentsCountLabel(compsCount)}
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
                {t.myDocuments.math}
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                Calculus II &bull; {getDocumentsCountLabel(mathCount)}
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
                {t.myDocuments.bio}
              </h4>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 dark:text-slate-500">
                Genetics Lab &bull; {getDocumentsCountLabel(bioCount)}
              </p>
            </div>
          </div>
        </div>
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
    </div>
  )
}


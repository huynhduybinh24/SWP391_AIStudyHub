import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Lock,
  Share2,
  Globe,
  Folder,
  ChevronDown,
  Trash2,
  Download,
  Bot,
  Sparkles,
  Maximize2,
  Check,
  X
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

const SUBJECT_LIST = [
  { value: 'COMPSCI', label: 'Computer Science' },
  { value: 'MATHEMATICS', label: 'Mathematics' },
  { value: 'BIOLOGY', label: 'Biology' },
  { value: 'PHYSICS', label: 'Physics' },
  { value: 'PHILOSOPHY', label: 'Philosophy' },
  { value: 'ECONOMICS', label: 'Economics' },
  { value: 'NEUROSCIENCE', label: 'Neuroscience' },
  { value: 'PSYCHOLOGY', label: 'Psychology' },
  { value: 'GENERAL', label: 'General Studies' }
]

const FOLDERS_LIST = [
  'Fall 2024 / CS401',
  'Fall 2024 / MAT202',
  'Fall 2024 / BIO305',
  'Spring 2024 / PHY301',
  'Archive / General'
]

export default function EditDocumentPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  
  const {
    documents,
    setDocuments,
    showToast,
    handleDownloadFile,
    handleDeleteDocument
  } = useOutletContext<DocumentsContextType>()

  // 1. Resolve document or fallback
  const activeDoc = documents.find(d => d.id === documentId)

  // 2. States
  const [title, setTitle] = useState(activeDoc?.title || 'Machine Learning Notes v2')
  const [subject, setSubject] = useState<string>(activeDoc?.subject || 'COMPSCI')
  const [description, setDescription] = useState(
    'Comprehensive notes covering supervised and unsupervised learning algorithms, including SVMs, Random Forests, and neural network basics from week 4-7 lectures.'
  )
  const [tags, setTags] = useState<string[]>(['AI', 'Machine Learning', 'Midterm', 'Notes'])
  const [newTagInput, setNewTagInput] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [folder, setFolder] = useState(FOLDERS_LIST[0])
  
  // Dropdown states
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false)

  // Load actual details if document is found
  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title || activeDoc.fileName.replace(/\.[^/.]+$/, ""))
      setSubject(activeDoc.subject)
    }
  }, [activeDoc])

  // Handle Add Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault()
      if (tags.includes(newTagInput.trim())) {
        showToast('⚠️ Tag này đã tồn tại!')
        return
      }
      setTags([...tags, newTagInput.trim()])
      setNewTagInput('')
      showToast(`🏷️ Đã thêm tag: "${newTagInput.trim()}"`)
    }
  }

  // Handle Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
    showToast(`🗑️ Đã xóa tag: "${tagToRemove}"`)
  }

  // Handle Suggest More Tags
  const handleSuggestTags = () => {
    showToast('✨ AI đang phân tích tài liệu để gợi ý thêm tag...')
    setTimeout(() => {
      const suggestions = ['Neural Networks', 'Supervised', 'Classification', 'SVM', 'Deep Learning']
      const unadded = suggestions.filter(s => !tags.includes(s))
      if (unadded.length === 0) {
        showToast('✨ AI nhận thấy danh sách tag hiện tại đã rất đầy đủ!')
      } else {
        const added = unadded.slice(0, 2)
        setTags([...tags, ...added])
        showToast(`✨ AI đã tự động thêm gợi ý tag: ${added.join(', ')}`)
      }
    }, 1200)
  }

  // Handle Save
  const handleSaveChanges = () => {
    if (!title.trim()) {
      showToast('❌ Tên tài liệu không được để trống!')
      return
    }

    if (activeDoc) {
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === activeDoc.id
            ? { ...doc, title: title.trim(), subject: subject as any }
            : doc
        )
      )
    }
    showToast('⚡ Lưu các thay đổi tài liệu thành công!')
    navigate(-1)
  }

  // Handle Discard
  const handleDiscardChanges = () => {
    showToast('⚠️ Đã hủy các thay đổi chưa lưu.')
    navigate(-1)
  }

  // Handle Delete
  const handleDelete = () => {
    if (activeDoc) {
      handleDeleteDocument(activeDoc.id)
      showToast(`🗑️ Đã xóa tài liệu "${title}"`)
      navigate('/dashboard/documents')
    } else {
      showToast('🗑️ Mô phỏng xóa tài liệu thành công!')
      navigate('/dashboard/documents')
    }
  }

  const selectedSubjectLabel = SUBJECT_LIST.find(s => s.value === subject)?.label || 'Computer Science'

  return (
    <div className="space-y-6 pb-12 text-slate-800 font-sans">
      
      {/* 1. Header controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-2">
        {/* Back Link */}
        <div className="space-y-1">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Documents
          </button>
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mt-1">
            Edit Document
          </h1>
          <p className="text-sm text-slate-500 leading-normal">
            Update document details, organization, and sharing settings
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 self-end md:self-auto shrink-0 select-none">
          <button
            onClick={handleDiscardChanges}
            className="px-5 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-extrabold text-sm hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs"
          >
            Discard Changes
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-5 py-3 rounded-2xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/10"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* 2. Main Edit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Metadata Form card */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          
          {/* Card Header */}
          <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100 bg-slate-50/50 shrink-0 select-none">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600 flex items-center justify-center">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h2 className="font-extrabold text-slate-800 text-sm tracking-wide">
              Document Metadata
            </h2>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            
            {/* Title & Subject row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Document Title input */}
              <div className="md:col-span-8 space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  DOCUMENT TITLE <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-2xl text-xs font-semibold placeholder-slate-450 bg-slate-50/30 focus:bg-white transition-all outline-none shadow-xs"
                />
              </div>

              {/* Subject dropdown selection */}
              <div className="md:col-span-4 space-y-2 text-left relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  SUBJECT
                </label>
                
                <button
                  type="button"
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 transition-all select-none shadow-xs"
                >
                  <span className="truncate">{selectedSubjectLabel}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isSubjectDropdownOpen && (
                  <>
                    {/* Invisible click backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsSubjectDropdownOpen(false)} />
                    
                    <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl max-h-56 overflow-y-auto z-20 py-1.5 animate-fade-in">
                      {SUBJECT_LIST.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            setSubject(item.value)
                            setIsSubjectDropdownOpen(false)
                            showToast(`✏️ Đã đổi môn học thành ${item.label}`)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between transition-colors",
                            subject === item.value ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                          )}
                        >
                          <span>{item.label}</span>
                          {subject === item.value && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Description textarea */}
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                DESCRIPTION
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write description about the document..."
                className="w-full px-4 py-3 border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 rounded-2xl text-xs font-semibold placeholder-slate-450 bg-slate-50/30 focus:bg-white transition-all outline-none resize-none shadow-xs leading-relaxed"
              />
            </div>

            {/* Tags dynamic container */}
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center select-none">
                <label className="text-[10px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1">
                  TAGS <span className="text-blue-500">✦</span>
                </label>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  Suggest more
                </button>
              </div>

              {/* Tags Panel */}
              <div className="bg-blue-50/20 border border-blue-100/50 rounded-2xl p-4 space-y-3 shadow-inner">
                {/* Active tags line */}
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3.5 py-1.5 text-xs font-extrabold text-[#2563eb] select-none hover:bg-blue-100/60 transition-colors shadow-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-[#2563eb] hover:text-red-500 p-0.5 rounded-full hover:bg-white transition-all"
                        title={`Xóa tag ${tag}`}
                      >
                        <X className="h-3 w-3 shrink-0" />
                      </button>
                    </span>
                  ))}
                  
                  {tags.length === 0 && (
                    <span className="text-xs text-slate-400 font-medium italic select-none py-1">
                      No tags added yet. Enter a tag below.
                    </span>
                  )}
                </div>

                {/* Input line */}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tag..."
                  className="w-full md:w-56 px-3.5 py-2 border border-slate-200/80 focus:border-blue-500 rounded-xl text-xs font-semibold placeholder-slate-450 bg-white outline-none shadow-inner transition-colors"
                />
              </div>
            </div>

            {/* Visibility & Folder row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              
              {/* Visibility buttons */}
              <div className="space-y-2 text-left select-none">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  VISIBILITY
                </label>
                
                <div className="flex items-center rounded-2xl border border-slate-200/80 bg-slate-50/40 p-1.5 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('private')
                      showToast('🔒 Tài liệu đã được chuyển sang chế độ Riêng tư.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'private'
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Private</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('shared')
                      showToast('👥 Tài liệu đã được chuyển sang chế độ Chia sẻ.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'shared'
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Shared</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setVisibility('public')
                      showToast('🌐 Tài liệu đã được chuyển sang chế độ Công khai.')
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-extrabold transition-all outline-none",
                      visibility === 'public'
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>Public</span>
                  </button>
                </div>
              </div>

              {/* Location/Folder Selection dropdown */}
              <div className="space-y-2 text-left relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  LOCATION / FOLDER
                </label>

                <button
                  type="button"
                  onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 transition-all select-none shadow-xs"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="h-4 w-4 text-slate-400 shrink-0" />
                    {folder}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isFolderDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsFolderDropdownOpen(false)} />
                    <div className="absolute right-0 left-0 mt-1.5 bg-white border border-slate-200 shadow-xl rounded-2xl max-h-48 overflow-y-auto z-20 py-1.5 animate-fade-in">
                      {FOLDERS_LIST.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setFolder(f)
                            setIsFolderDropdownOpen(false)
                            showToast(`📁 Di chuyển tài liệu vào thư mục: ${f}`)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 flex items-center justify-between transition-colors",
                            folder === f ? "text-blue-600 bg-blue-50/40" : "text-slate-700"
                          )}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Folder className="h-4 w-4 text-slate-400 shrink-0" />
                            {f}
                          </span>
                          {folder === f && <Check className="h-4 w-4 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>

          {/* Delete Document action row */}
          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center select-none shrink-0 mt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-extrabold text-xs transition-colors p-1"
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>Delete Document</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Document Telemetry & Assistant) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Sidebar Card 1: Document Telemetry details */}
          <div className="bg-white border border-slate-200/85 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Header blue graphic view */}
            <div className="bg-[#F1F5F9]/50 border-b border-slate-100 p-8 flex flex-col items-center justify-center relative select-none">
              
              {/* Expand option icon top-right */}
              <button
                type="button"
                onClick={() => showToast('🔎 Đang mở rộng chế độ xem trước tài liệu...')}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-all"
                title="Expand Preview"
              >
                <Maximize2 className="h-4 w-4" />
              </button>

              {/* PDF Icon container with glowing circle */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full scale-125" />
                <div className="w-20 h-20 bg-blue-50 border border-blue-100/60 rounded-2xl flex items-center justify-center shadow-inner relative">
                  <span className="text-xs font-black tracking-widest text-blue-600 uppercase">PDF</span>
                </div>
              </div>

              {/* Status Synced pill */}
              <div className="mt-5 flex">
                <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200/60 px-3 py-1 text-[10px] font-black text-slate-650 tracking-wider shadow-sm select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  Synced
                </span>
              </div>
            </div>

            {/* Content info area */}
            <div className="p-6 space-y-5">
              
              {/* Main title */}
              <div className="space-y-1 text-center">
                <h3 className="text-md font-black text-slate-900 tracking-tight leading-snug select-all truncate">
                  {title.endsWith('.pdf') ? title : `${title}.pdf`}
                </h3>
                <p className="text-xs text-slate-450 font-bold tracking-wide">
                  PDF Document &bull; {activeDoc?.size || '1.2 MB'}
                </p>
              </div>

              {/* Meta lines */}
              <div className="space-y-3.5 border-t border-slate-100 pt-4 text-left">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 font-bold select-none">Uploaded</span>
                  <span className="text-slate-700 font-extrabold">Oct 12, 2024</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 font-bold select-none">Last Modified</span>
                  <span className="text-slate-700 font-extrabold">2 hours ago</span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-450 font-bold select-none">Owner</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest scale-95 shadow-sm">
                    You
                  </span>
                </div>
              </div>

              {/* Bottom Actions grid */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-4.5 shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDoc) {
                      handleDownloadFile(activeDoc)
                    } else {
                      showToast('💾 Đang tải tài liệu về máy tính của bạn...')
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/60 text-blue-600 font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs"
                >
                  <Download className="h-4 w-4 shrink-0" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => showToast('🔗 Hãy mở xem chi tiết để quản lý chia sẻ nâng cao!')}
                  className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all shadow-xs"
                >
                  <Share2 className="h-4 w-4 shrink-0" />
                  <span>Share</span>
                </button>
              </div>

            </div>

          </div>

          {/* Sidebar Card 2: AI Document Assistant promo */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100/70 rounded-3xl p-6 shadow-sm space-y-4 text-left flex flex-col relative overflow-hidden">
            
            {/* Soft decorative background circles */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />

            {/* Icon and title block */}
            <div className="flex items-center gap-2 select-none">
              <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-md shadow-blue-500/10">
                <Bot className="h-4 w-4" />
              </div>
              <h3 className="font-extrabold text-slate-800 text-xs tracking-wide">
                AI Document Assistant
              </h3>
            </div>

            {/* Prompt details */}
            <p className="text-[11px] text-slate-500 leading-normal font-semibold">
              Need to extract key concepts or generate a quiz from these notes?
            </p>

            {/* Button trigger */}
            <button
              type="button"
              onClick={() => {
                if (activeDoc) {
                  showToast('🤖 Đang khởi chạy phòng trợ lý AI cho tài liệu này...')
                  navigate(`/dashboard/documents/document/${activeDoc.id}`)
                } else {
                  showToast('🤖 Đang kết nối trợ lý AI học tập...')
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-white border border-blue-200/80 hover:border-blue-300 text-blue-600 font-extrabold text-xs py-3.5 rounded-xl shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Ask AI about this file</span>
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

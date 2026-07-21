import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom'
import {
  CloudUpload,
  FileText,
  X,
  Sparkles,
  ImageIcon,
  BookOpen,
  FolderDown,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

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
  essential?: boolean
}

interface DocumentsLayoutContext {
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  showToast: (msg: string) => void
  refreshDocuments?: () => void
}



const AVAILABLE_TAGS = ['Notes', 'Assignment', 'Lecture', 'Midterm', 'Final Exam']

import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { documentService } from '@/services/documentService'

const mapMimeOrExtensionToType = (_fileType: string, fileName: string): 'pdf' | 'word' | 'image' | 'text' | 'slides' => {
  const nameLower = fileName.toLowerCase()
  if (nameLower.endsWith('.pdf')) return 'pdf'
  if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) return 'word'
  if (nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) return 'slides'
  if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) return 'image'
  if (nameLower.endsWith('.txt')) return 'text'
  return 'text'
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const mapBackendDocToItem = (doc: any): DocumentItem => {
  return {
    id: String(doc.id),
    title: doc.title,
    fileName: doc.fileName || doc.originalFileName || 'Untitled',
    uploadedAt: doc.createdAt ? `Uploaded ${new Date(doc.createdAt).toLocaleDateString('vi-VN')}` : 'Uploaded Just Now',
    uploadedDateObj: doc.createdAt ? new Date(doc.createdAt) : new Date(),
    size: doc.fileSize ? formatBytes(doc.fileSize) : '0 Bytes',
    sizeKb: doc.fileSize ? Math.round(doc.fileSize / 1024) : 0,
    subject: (doc.subject || 'GENERAL') as any,
    status: 'ANALYZED',
    type: mapMimeOrExtensionToType(doc.fileType, doc.fileName || doc.originalFileName || ''),
    essential: doc.tags?.includes('Lecture') || doc.tags?.includes('Midterm')
  }
}

export function UploadSubjectDocumentPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { setDocuments, showToast, refreshDocuments } = useOutletContext<DocumentsLayoutContext>()
  const { language, t: tRaw } = useTranslation()
  const t = tRaw as any

  const activeSubjectId = (subjectId || 'GENERAL').toUpperCase()

  // Form states
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [moderationState, setModerationState] = useState<'scanning' | 'approved' | 'pending_review' | 'timeout'>('scanning')
  const [uploadedDocId, setUploadedDocId] = useState<string | number>('')
  const pollingIntervalRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const [docTitle, setDocTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Notes']) // default Notes selected per Figma
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [generateSummary, setGenerateSummary] = useState(true)
  const [createFlashcards, setCreateFlashcards] = useState(true)

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileAttached, setFileAttached] = useState(false) // Start empty, only true when user attaches file
  const [uploadProgress, setUploadProgress] = useState(0) // Start at 0%
  const [uploadComplete, setUploadComplete] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState('')

  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Smoothly animate simulated progress bar from 0% to 100% when file is attached
  useEffect(() => {
    if (!fileAttached || uploadComplete) return

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadComplete(true)
          return 100
        }
        // Increment progress randomly
        const next = prev + Math.floor(Math.random() * 12) + 8
        return next > 100 ? 100 : next
      })
    }, 200)

    return () => clearInterval(interval)
  }, [fileAttached, uploadComplete])

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      processSelectedFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      processSelectedFile(files[0])
    }
  }

  const processSelectedFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf') {
      showToast(language === 'vi' ? 'Hệ thống chỉ hỗ trợ tệp tin PDF!' : 'Only PDF files are supported!')
      return
    }

    setSelectedFile(file)
    setFileName(file.name)
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)

    setFileType('pdf')
    setFileAttached(true)
    setUploadProgress(0)
    setUploadComplete(false)

    // Pre-fill Title field with formatted file name if empty
    if (!docTitle.trim()) {
      const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }
  }

  const handleBrowseFilesClick = () => {
    fileInputRef.current?.click()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const getSubjectName = (key: string) => {
    if (key === 'COMPSCI') return t.myDocuments.compsci
    if (key === 'MATHEMATICS') return t.myDocuments.math
    if (key === 'BIOLOGY') return language === 'en' ? 'Molecular Biology' : (language === 'vi' ? 'Sinh học phân tử' : (language === 'ja' ? '分子生物学' : '분자생물학'))
    const subjectMap: Record<string, Record<string, string>> = {
      PHYSICS: { en: 'Physics', vi: 'Vật lý', ja: '物理学', ko: '물리학' },
      PHILOSOPHY: { en: 'Philosophy', vi: 'Triết học', ja: '哲学', ko: '철학' },
      ECONOMICS: { en: 'Economics', vi: 'Kinh tế học', ja: '経済学', ko: '경제학' },
      GENERAL: { en: 'General Studies', vi: 'Đại cương', ja: '一般教養', ko: '교양' }
    }
    return subjectMap[key]?.[language] || key
  }

  const getTagName = (tag: string) => {
    const tagMap: Record<string, Record<string, string>> = {
      'Notes': { en: 'Notes', vi: 'Ghi chú', ja: 'ノート', ko: '노트' },
      'Assignment': { en: 'Assignment', vi: 'Bài tập', ja: '課題', ko: '과제' },
      'Lecture': { en: 'Lecture', vi: 'Bài giảng', ja: '講義', ko: '강의' },
      'Midterm': { en: 'Midterm', vi: 'Giữa kỳ', ja: '中間試験', ko: '중간고사' },
      'Final Exam': { en: 'Final Exam', vi: 'Cuối kỳ', ja: '期末試験', ko: '기말고사' }
    }
    return tagMap[tag]?.[language] || tag
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileAttached) {
      showToast(language === 'en' ? 'Please attach a study document first!' : (language === 'vi' ? 'Vui lòng đính kèm tài liệu học tập trước!' : (language === 'ja' ? '最初に学習ドキュメントを添付してください！' : '먼저 학습 문서를 첨부해 주세요!')))
      return
    }

    const finalTitle = docTitle.trim() || fileName.split('.')[0].replace(/_/g, ' ')
    setIsProcessing(true)

    try {
      const user = useAuthStore.getState().user
      const userId = Number(user?.id || 1)

      let fileToUpload = selectedFile
      if (!fileToUpload) {
        const mockContent = `History Midterm Notes\n\nStudy Guide:\n- Content: Core history topics for midterm preparation.\n- Subject: ${activeSubjectId}\n- Tags: ${selectedTags.join(', ')}`
        const cleanName = finalTitle.replace(/\s+/g, '_') + '.txt'
        fileToUpload = new File([mockContent], cleanName, { type: 'text/plain' })
      }

      const response = await documentService.uploadDocument(
        fileToUpload,
        finalTitle,
        description,
        activeSubjectId,
        visibility.toUpperCase(),
        userId,
        selectedTags
      )

      const newDoc = mapBackendDocToItem(response)

      setUploadedDocId(response.id)
      setModerationState('scanning')
      setApprovalModalOpen(true)
      setIsProcessing(false)

      // Toast Success Alert
      showToast(language === 'en' ? 'Document uploaded successfully.' : 'Tải lên tài liệu thành công.')

      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      // Start polling for AI moderation resolution
      let attempts = 0
      const maxAttempts = 6
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const doc = await documentService.getDocumentById(response.id)
          if (doc.moderationStatus === 'APPROVED') {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
            setModerationState('approved')
            setDocuments((prev) => [mapBackendDocToItem(doc), ...prev])
            if (refreshDocuments) {
              refreshDocuments()
            }
          } else if (doc.moderationStatus === 'PENDING_REVIEW' || doc.moderationStatus === 'REJECTED') {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
            setModerationState('pending_review')
            if (refreshDocuments) {
              refreshDocuments()
            }
          }
        } catch (err) {
          console.error('Failed to poll document status:', err)
        }

        attempts++
        if (attempts >= maxAttempts) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
            setModerationState('timeout')
          }
        }
      }, 1000)
    } catch (error) {
      console.error('Failed to upload document:', error)
      showToast(language === 'en' ? 'Failed to upload document. Please try again.' : 'Có lỗi xảy ra khi tải lên tài liệu. Vui lòng thử lại!')
      setIsProcessing(false)
    }
  }

  // Dynamically compute the document icon for card display
  const getFileIconProps = (type: 'pdf' | 'word' | 'image' | 'text' | 'slides') => {
    switch (type) {
      case 'pdf':
        return {
          bg: 'bg-rose-50 border-rose-100 dark:bg-rose-955/20 dark:border-rose-900/30',
          icon: <FileText className="h-5 w-5 text-rose-500" />
        }
      case 'word':
        return {
          bg: 'bg-blue-50 border-blue-100 dark:bg-blue-955/20 dark:border-blue-900/30',
          icon: <FileText className="h-5 w-5 text-blue-500" />
        }
      case 'image':
        return {
          bg: 'bg-sky-50 border-sky-100 dark:bg-sky-955/20 dark:border-sky-900/30',
          icon: <ImageIcon className="h-5 w-5 text-sky-500" />
        }
      case 'slides':
        return {
          bg: 'bg-amber-50 border-amber-100 dark:bg-amber-955/20 dark:border-amber-900/30',
          icon: <FolderDown className="h-5 w-5 text-amber-500" />
        }
      case 'text':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-955/20 dark:border-emerald-900/30',
          icon: <BookOpen className="h-5 w-5 text-emerald-500" />
        }
    }
  }


  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-[860px] mx-auto pt-2 px-4 md:px-6">
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
      />

      {/* Header Title and Description */}
      <div className="space-y-1">
        <h1 className="text-[32px] font-extrabold text-[#0B1A30] tracking-tight dark:text-slate-100">
          {t.upload.titleFiles}
        </h1>
        <p className="text-sm font-medium text-[#5F6E80] dark:text-slate-400">
          {t.upload.subtitleSubject}
        </p>
      </div>

      {/* Main Single Column Content Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-[#EAF1FB] dark:border-slate-800 p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-8">

          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFilesClick}
            className={cn(
              "flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-10 text-center min-h-[220px] transition-all duration-300 cursor-pointer",
              isDragOver
                ? "border-[#2563eb] bg-blue-50/20 dark:bg-blue-955/20 shadow-inner"
                : "border-[#C3D2FF] dark:border-slate-700 bg-[#F4F7FF]/35 dark:bg-slate-800/40 hover:bg-[#F4F7FF]/55 dark:hover:bg-slate-800/60"
            )}
          >
            {/* White Cloud Circle */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF1FB] dark:bg-blue-955/50 text-[#2563eb] dark:text-blue-400 mb-4">
              <CloudUpload className="h-7 w-7 stroke-[1.8] text-[#2563eb] dark:text-blue-400" />
            </div>
            
            <h3 className="text-xl font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight">
              Drag and drop files here
            </h3>
            
            <p className="text-sm font-semibold text-[#8B98A5] dark:text-slate-550 my-1">
              or
            </p>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseFilesClick()
              }}
              className="mt-2 rounded-lg bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 shadow-sm transition-all cursor-pointer"
            >
              {t.upload.browse}
            </button>

            <p className="text-xs font-semibold text-[#8B98A5] dark:text-slate-500 mt-4">
              {language === 'vi' ? 'Hỗ trợ tệp PDF (Tối đa 50MB)' : 'Support for PDF files (Max 50MB)'}
            </p>
          </div>

          {/* Ready to Upload Card */}
          {fileAttached && (
            <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4 select-none">
              
              {/* Header Title with totals */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-extrabold text-[#0B1A30] dark:text-slate-200 text-sm">
                  {t.upload.readyUpload} (1)
                </span>
                <span className="text-xs font-semibold text-[#8B98A5] dark:text-slate-500">
                  {fileSize} {t.upload.total}
                </span>
              </div>

              {/* Files Queue List Stack */}
              <div className="space-y-3">
                
                {/* File Item: Dynamic Uploading File */}
                <div className="relative rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center justify-between shadow-xs overflow-hidden">
                  <div className="flex items-center gap-3 min-w-0 pb-1">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", getFileIconProps(fileType).bg)}>
                      {getFileIconProps(fileType).icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0B1A30] dark:text-slate-200 text-sm truncate">
                        {fileName}
                      </p>
                      <p className="text-xs font-semibold text-[#8B98A5] dark:text-slate-500 mt-0.5">
                        {fileSize} &bull; {uploadComplete ? t.upload.ready : t.upload.uploading}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    {!uploadComplete && (
                      <span className="text-sm font-extrabold text-[#2563eb] dark:text-blue-400">
                        {uploadProgress}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFileAttached(false)
                        setSelectedFile(null)
                        setFileName('')
                        setFileSize('')
                        setUploadProgress(0)
                        setUploadComplete(false)
                      }}
                      className="rounded-full p-1 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-805 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
                      aria-label="Cancel upload"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress Line absolute-positioned along the bottom border */}
                  {!uploadComplete && (
                    <div
                      className="absolute bottom-0 left-0 h-[3px] bg-[#2563eb] dark:bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                </div>

              </div>

            </div>
          )}

          {/* Form Fields Stack */}
          <div className="space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="upload-title" className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.upload.docTitle}
              </label>
              <input
                id="upload-title"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder={t.upload.placeholderTitle}
                disabled={isProcessing}
                required
                className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2563eb]/50"
              />
            </div>

            {/* Subject (Disabled - Auto-filled) */}
            <div className="space-y-2">
              <label htmlFor="upload-subject" className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.myDocuments.subject}
              </label>
              <input
                id="upload-subject"
                type="text"
                value={getSubjectName(activeSubjectId)}
                disabled
                className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 px-4 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed select-none dark:bg-slate-800/50 dark:text-slate-400"
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label htmlFor="upload-desc" className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.upload.description}
              </label>
              <textarea
                id="upload-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.upload.placeholderDesc}
                disabled={isProcessing}
                className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400 min-h-[100px] resize-none dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#2563eb]/50"
              />
            </div>

            {/* Tags Pills Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.upload.tags}
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      disabled={isProcessing}
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 focus:outline-none cursor-pointer disabled:opacity-50",
                        isSelected
                          ? "bg-[#2563eb] border-[#2563eb] text-white shadow-sm shadow-blue-500/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      )}
                    >
                      {getTagName(tag)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* File Type & Visibility Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            
            {/* File Type Display */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.upload.fileType}
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] dark:border-slate-800 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 font-semibold select-none">
                <FileText className="h-4.5 w-4.5 text-[#5F6E80] dark:text-slate-400" />
                <span>{t.upload.autoDetected}: {fileType.toUpperCase()}</span>
              </div>
            </div>

            {/* Visibility Choices */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] dark:text-slate-400 select-none">
                {t.upload.visibility}
              </label>
              <div className="flex items-center gap-4 h-[46px]">
                   {/* Private Radio */}
                <label className="relative flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    disabled={isProcessing}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "h-4.5 w-4.5 rounded-full border bg-white dark:bg-slate-800 transition-all duration-200",
                      visibility === 'private' ? "border-[#2563eb] ring-2 ring-blue-50 dark:ring-blue-900/30" : "border-slate-300 dark:border-slate-700"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'private' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'private' ? "text-[#2563eb] dark:text-blue-450" : "text-[#5F6E80] dark:text-slate-400"
                  )}>
                    {t.upload.private}
                  </span>
                </label>

                {/* Shared Radio */}
                <label className="relative flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="visibility"
                    value="shared"
                    checked={visibility === 'shared'}
                    onChange={() => setVisibility('shared')}
                    disabled={isProcessing}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "h-4.5 w-4.5 rounded-full border bg-white dark:bg-slate-800 transition-all duration-200",
                      visibility === 'shared' ? "border-[#2563eb] ring-2 ring-blue-50 dark:ring-blue-900/30" : "border-slate-300 dark:border-slate-700"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'shared' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'shared' ? "text-[#2563eb] dark:text-blue-455" : "text-[#5F6E80] dark:text-slate-400"
                  )}>
                    {t.upload.shared}
                  </span>
                </label>

                {/* Public Radio */}
                <label className="relative flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    disabled={isProcessing}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  />
                  <div className="relative flex items-center justify-center">
                    <div className={cn(
                      "h-4.5 w-4.5 rounded-full border bg-white dark:bg-slate-800 transition-all duration-200",
                      visibility === 'public' ? "border-[#2563eb] ring-2 ring-blue-50 dark:ring-blue-900/30" : "border-slate-300 dark:border-slate-700"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'public' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'public' ? "text-[#2563eb] dark:text-blue-455" : "text-[#5F6E80] dark:text-slate-400"
                  )}>
                    {t.upload.public}
                  </span>
                </label>

              </div>
            </div>

          </div>

          {/* AI Processing Configuration Card */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#2563eb] dark:text-blue-455 animate-pulse" />
              <h3 className="text-base font-extrabold text-[#0B1A30] dark:text-slate-100 tracking-tight select-none">
                {t.upload.aiProcessing}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generate Summary Checkbox Card */}
              <label
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white dark:bg-slate-900",
                  generateSummary
                    ? "border-blue-100 bg-[#F4F7FF]/30 dark:border-blue-900/30 dark:bg-blue-955/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-855/35"
                )}
              >
                <input
                  type="checkbox"
                  checked={generateSummary}
                  onChange={(e) => setGenerateSummary(e.target.checked)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  disabled={isProcessing}
                />
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    generateSummary
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  )}
                >
                  {generateSummary && (
                    <svg
                      className="h-3.5 w-3.5 stroke-[3] stroke-current"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-bold text-[#0B1A30] dark:text-slate-200">
                  {t.upload.genSummary}
                </span>
              </label>

              {/* Create Flashcards Checkbox Card */}
              <label
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white dark:bg-slate-900",
                  createFlashcards
                    ? "border-blue-100 bg-[#F4F7FF]/30 dark:border-blue-900/30 dark:bg-blue-955/20 shadow-xs"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-855/35"
                )}
              >
                <input
                  type="checkbox"
                  checked={createFlashcards}
                  onChange={(e) => setCreateFlashcards(e.target.checked)}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                  disabled={isProcessing}
                />
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    createFlashcards
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  )}
                >
                  {createFlashcards && (
                    <svg
                      className="h-3.5 w-3.5 stroke-[3] stroke-current"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-bold text-[#0B1A30] dark:text-slate-200">
                  {t.upload.createFlashcards}
                </span>
              </label>
            </div>
          </div>

          {/* Action buttons Cancel & Process */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(`/dashboard/documents/subject/${subjectId}`)}
              disabled={isProcessing}
              className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 shadow-xs px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
            >
              {t.upload.cancel}
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || !fileAttached}
              className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {isProcessing ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.upload.processing}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t.upload.processAI}
                </>
              )}
            </button>
          </div>

        </div>
      </form>

      {/* Page Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-[#8B98A5] dark:text-slate-500 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div>© 2024 LumiEdu. Empowering Deep Learning.</div>
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <Link to="/privacy-policy" className="hover:text-[#2563eb] transition-colors">{language === 'en' ? 'Privacy Policy' : (language === 'vi' ? 'Chính sách bảo mật' : (language === 'ja' ? 'プライバシーポリシー' : '개인정보처리방침'))}</Link>
          <Link to="/terms-of-service" className="hover:text-[#2563eb] transition-colors">{language === 'en' ? 'Terms of Service' : (language === 'vi' ? 'Điều khoản dịch vụ' : (language === 'ja' ? '利用規約' : '서비스 약관'))}</Link>
          <a href="#" className="hover:text-[#2563eb] transition-colors">{language === 'en' ? 'Help Center' : (language === 'vi' ? 'Trung tâm trợ giúp' : (language === 'ja' ? 'ヘルプセンター' : '고객센터'))}</a>
        </div>
      </div>
      {/* Approval Pending Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false)
          setFileAttached(false)
          setSelectedFile(null)
          setFileName('')
          setFileSize('')
          setUploadProgress(0)
          setUploadComplete(false)
          setDocTitle('')
          setDescription('')
          navigate(`/dashboard/documents/subject/${subjectId}`)
        }}
        title={
          moderationState === 'scanning'
            ? (language === 'en' ? 'AI Security Scanning...' : 'AI đang quét kiểm duyệt...')
            : moderationState === 'approved'
            ? (language === 'en' ? 'Upload Successful' : 'Tải lên thành công')
            : moderationState === 'pending_review'
            ? (language === 'en' ? 'Moderation Pending' : 'Chờ kiểm duyệt')
            : (language === 'en' ? 'Document Processing' : 'Đang xử lý tài liệu')
        }
        description={
          moderationState === 'scanning'
            ? (language === 'en' ? 'AI is running safety and policy checks on your document.' : 'Hệ thống AI đang thực hiện kiểm tra an toàn và nội dung tài liệu.')
            : moderationState === 'approved'
            ? (language === 'en' ? 'Your document is verified and ready to use!' : 'Tài liệu của bạn đã được kiểm duyệt và sẵn sàng để sử dụng!')
            : moderationState === 'pending_review'
            ? (language === 'en' ? 'Potential content violations detected.' : 'Phát hiện nội dung cần được xem xét thêm.')
            : (language === 'en' ? 'AI analysis is running in the background.' : 'AI đang tiếp tục xử lý phân tích tài liệu chạy ẩn.')
        }
        className="max-w-[480px]"
      >
        <div className="space-y-6 text-center py-2 select-none">
          {moderationState === 'scanning' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-955/50 text-[#2563eb] dark:text-blue-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {moderationState === 'approved' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-955/30 text-emerald-500">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          )}
          {moderationState === 'pending_review' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-955/30 text-amber-500">
              <FileText className="h-8 w-8 text-amber-500" />
            </div>
          )}
          {moderationState === 'timeout' && (
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-955/30 text-sky-500">
              <FileText className="h-8 w-8 text-sky-500" />
            </div>
          )}

          <div className="space-y-2 max-w-sm mx-auto">
            <p className="text-sm text-slate-605 dark:text-slate-400 font-medium leading-relaxed">
              {moderationState === 'scanning' &&
                (language === 'en'
                  ? 'AI is verifying your document. Please wait a few seconds...'
                  : 'AI đang tiến hành xác thực tài liệu của bạn. Vui lòng đợi trong giây lát...')}
              {moderationState === 'approved' &&
                (language === 'en'
                  ? 'Congratulations! Your document has been automatically moderated and approved.'
                  : 'Chúc mừng! Tài liệu của bạn đã được kiểm duyệt tự động và phê chuẩn thành công.')}
              {moderationState === 'pending_review' &&
                (language === 'en'
                  ? 'AI flagged potential violations. It has been sent to admin for manual review, and is only listed in Upload History.'
                  : 'AI phát hiện tài liệu chứa nội dung cần xem xét. Tài liệu đã được chuyển tới Admin duyệt thủ công và hiện chỉ hiển thị trong Lịch sử tải lên.')}
              {moderationState === 'timeout' &&
                (language === 'en'
                  ? 'Your document is being processed in the background. You can check its status later in your Upload History.'
                  : 'Tài liệu của bạn vẫn đang tiếp tục được xử lý chạy ẩn. Bạn có thể kiểm tra lại trạng thái sau tại Lịch sử tải lên.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {moderationState === 'scanning' && (
              <button
                type="button"
                onClick={() => {
                  setApprovalModalOpen(false)
                  setFileAttached(false)
                  setSelectedFile(null)
                  setFileName('')
                  setFileSize('')
                  setUploadProgress(0)
                  setUploadComplete(false)
                  setDocTitle('')
                  setDescription('')
                  navigate(`/dashboard/documents/subject/${subjectId}`)
                }}
                className="w-full sm:w-auto rounded-xl font-bold bg-[#2563eb] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 px-5 py-2.5 text-xs transition-all cursor-pointer"
              >
                {language === 'en' ? 'Run in Background' : 'Chạy ẩn'}
              </button>
            )}

            {moderationState === 'approved' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalModalOpen(false)
                    setFileAttached(false)
                    setSelectedFile(null)
                    setFileName('')
                    setFileSize('')
                    setUploadProgress(0)
                    setUploadComplete(false)
                    setDocTitle('')
                    setDescription('')
                    if (uploadedDocId) {
                      navigate(`/dashboard/documents/document/${uploadedDocId}`)
                    }
                  }}
                  className="w-full sm:w-auto rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 px-5 py-2.5 text-xs transition-all cursor-pointer"
                >
                  {language === 'en' ? 'View Document' : 'Xem tài liệu'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalModalOpen(false)
                    setFileAttached(false)
                    setSelectedFile(null)
                    setFileName('')
                    setFileSize('')
                    setUploadProgress(0)
                    setUploadComplete(false)
                    setDocTitle('')
                    setDescription('')
                    navigate(`/dashboard/documents/subject/${subjectId}`)
                  }}
                  className="w-full sm:w-auto rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 px-5 py-2.5 text-xs transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Back to Subject' : 'Quay lại môn học'}
                </button>
              </>
            )}

            {(moderationState === 'pending_review' || moderationState === 'timeout') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalModalOpen(false)
                    setFileAttached(false)
                    setSelectedFile(null)
                    setFileName('')
                    setFileSize('')
                    setUploadProgress(0)
                    setUploadComplete(false)
                    setDocTitle('')
                    setDescription('')
                    navigate('/dashboard/documents/upload-history')
                  }}
                  className="w-full sm:w-auto rounded-xl font-bold bg-[#2563eb] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10 px-5 py-2.5 text-xs transition-all cursor-pointer"
                >
                  {language === 'en' ? 'View Upload History' : 'Xem lịch sử tải lên'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApprovalModalOpen(false)
                    setFileAttached(false)
                    setSelectedFile(null)
                    setFileName('')
                    setFileSize('')
                    setUploadProgress(0)
                    setUploadComplete(false)
                    setDocTitle('')
                    setDescription('')
                    navigate(`/dashboard/documents/subject/${subjectId}`)
                  }}
                  className="w-full sm:w-auto rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 px-5 py-2.5 text-xs transition-all cursor-pointer"
                >
                  {language === 'en' ? 'Back to Subject' : 'Quay lại môn học'}
                </button>
              </>
            )}
          </div>
        </div>
      </Modal>

    </div>
  )
}



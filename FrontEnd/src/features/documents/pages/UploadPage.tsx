import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloudUpload,
  FileText,
  X,
  Sparkles,
  FileCheck,
  Image as ImageIcon,
  BookOpen,
  FileCode,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

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

const SUBJECT_MAP: Record<string, { title: string; courseCode: string }> = {
  COMPSCI: { title: 'Software Engineering', courseCode: 'CS-402' },
  MATHEMATICS: { title: 'Mathematics', courseCode: 'Calculus II' },
  BIOLOGY: { title: 'Molecular Biology', courseCode: 'BIO-201' },
  PHYSICS: { title: 'Physics', courseCode: 'PHY-301' },
  PHILOSOPHY: { title: 'Philosophy', courseCode: 'PHIL-101' },
  ECONOMICS: { title: 'Economics', courseCode: 'ECON-201' },
  GENERAL: { title: 'General Studies', courseCode: 'GEN-101' }
}

const AVAILABLE_TAGS = ['Notes', 'Assignment', 'Lecture', 'Midterm', 'Final Exam']

const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-design-patterns',
    title: 'Design Patterns',
    fileName: 'Design_Patterns_Java_Guide.pdf',
    uploadedAt: 'Uploaded 2 hours ago',
    uploadedDateObj: new Date(),
    size: '3.8 MB',
    sizeKb: 3890,
    subject: 'COMPSCI',
    status: 'ANALYZED',
    type: 'pdf',
  },
  {
    id: 'doc-agile',
    title: 'Agile Methodologies',
    fileName: 'Agile_Scrum_Kanban_DeepDive.docx',
    uploadedAt: 'Uploaded Yesterday',
    uploadedDateObj: new Date(Date.now() - 24 * 60 * 60 * 1000),
    size: '1.9 MB',
    sizeKb: 1945,
    subject: 'GENERAL',
    status: 'ANALYZED',
    type: 'word',
    essential: true,
  }
]

export function UploadPage() {
  const navigate = useNavigate()
  const toast = useToast()

  // Form states
  const [docTitle, setDocTitle] = useState('Lecture_Notes_Week4')
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'>('BIOLOGY') // Default Biology / Molecular Biology per Figma
  const [description, setDescription] = useState('Week 4 lecture covering cellular respiration and metabolic pathways.')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Notes']) // Default 'Notes' selected per Figma
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [generateSummary, setGenerateSummary] = useState(true)
  const [createFlashcards, setCreateFlashcards] = useState(true)

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileAttached, setFileAttached] = useState(true) // Start with default mockup pdf file attached
  const [uploadProgress, setUploadProgress] = useState(75) // Start at 75% per Figma mockup
  const [uploadComplete, setUploadComplete] = useState(false)
  const [fileName, setFileName] = useState('Lecture_Notes_Week4.pdf')
  const [fileSize, setFileSize] = useState('1.8 MB')

  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const subjectInfo = SUBJECT_MAP[selectedSubjectKey] || SUBJECT_MAP.GENERAL

  // Smoothly animate simulated progress bar from 65% to 100% on mount
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
        const next = prev + Math.floor(Math.random() * 8) + 2
        return next > 100 ? 100 : next
      })
    }, 450)

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
    setSelectedFile(file)
    setFileName(file.name)
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`)

    // Auto-detect type
    const ext = file.name.split('.').pop()?.toLowerCase()
    let detectedType: 'pdf' | 'word' | 'image' | 'text' | 'slides' = 'pdf'
    if (ext === 'pdf') detectedType = 'pdf'
    else if (ext === 'docx' || ext === 'doc') detectedType = 'word'
    else if (ext === 'txt') detectedType = 'text'
    else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') detectedType = 'image'
    else if (ext === 'pptx' || ext === 'ppt') detectedType = 'slides'

    setFileType(detectedType)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileAttached) {
      toast.error('Please attach a study document first!')
      return
    }

    const finalTitle = docTitle.trim() || fileName.split('.')[0].replace(/_/g, ' ')
    setIsProcessing(true)

    // Premium short AI processing duration simulation for amazing feedback
    setTimeout(() => {
      const finalFileName = selectedFile?.name || fileName
      const finalSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : fileSize
      const finalSizeKb = selectedFile ? Math.round(selectedFile.size / 1024) : 4300

      const newDoc: DocumentItem = {
        id: `doc-${Date.now()}`,
        title: finalTitle,
        fileName: finalFileName,
        uploadedAt: 'Uploaded Just Now',
        uploadedDateObj: new Date(),
        size: finalSize,
        sizeKb: finalSizeKb,
        subject: selectedSubjectKey,
        status: 'ANALYZED',
        type: fileType,
        essential: selectedTags.includes('Lecture') || selectedTags.includes('Midterm')
      }

      // Load existing documents from localStorage and append the new one
      const savedDocsStr = localStorage.getItem('ai_study_hub_documents')
      let currentDocs: DocumentItem[] = savedDocsStr ? JSON.parse(savedDocsStr) : INITIAL_DOCUMENTS
      
      // Check if duplicate ID exists, if so filter or change ID
      currentDocs = currentDocs.filter(d => d.id !== newDoc.id)
      const updatedDocs = [newDoc, ...currentDocs]

      // Save back to localStorage
      localStorage.setItem('ai_study_hub_documents', JSON.stringify(updatedDocs))

      // Toast Success Alert
      toast.success(`Tài liệu "${finalTitle}" được tải lên và xử lý AI thành công!`)

      setIsProcessing(false)

      // Navigate back to Folder View
      navigate(`/dashboard/documents/subject/${selectedSubjectKey}`)
    }, 1200)
  }

  // Dynamically compute the document icon for card display
  const renderPreviewFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-6 w-6 stroke-[1.8] text-rose-500" />
      case 'word':
        return <FileCode className="h-6 w-6 stroke-[1.8] text-blue-500" />
      case 'text':
        return <BookOpen className="h-6 w-6 stroke-[1.8] text-emerald-500" />
      case 'image':
        return <ImageIcon className="h-6 w-6 stroke-[1.8] text-sky-500" />
      case 'slides':
      default:
        return <FileText className="h-6 w-6 stroke-[1.8] text-amber-500" />
    }
  }

  const getFileTypeStyle = () => {
    switch (fileType) {
      case 'pdf':
        return 'bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30'
      case 'word':
        return 'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30'
      case 'text':
        return 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30'
      case 'image':
        return 'bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30'
      case 'slides':
      default:
        return 'bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30'
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in max-w-[680px] mx-auto pt-2 px-4 md:px-6">
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.pptx,.ppt"
      />



      {/* Header Title and Description */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-[28px] font-extrabold text-[#0B1A30] tracking-tight">
          Upload Document
        </h1>
        <p className="text-xs md:text-sm font-medium text-[#5F6E80]">
          Add new study materials to your library. AI will automatically generate summaries and flashcards
        </p>
      </div>

      {/* Main Single Column Content Card */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-[22px] border border-[#EAF1FB] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.012)] space-y-6">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFilesClick}
            className={cn(
              "flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed py-8 px-6 text-center min-h-[190px] transition-all duration-300 cursor-pointer",
              isDragOver
                ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
                : "border-[#C3D2FF] bg-[#F4F7FF]/35 hover:bg-[#F4F7FF]/55"
            )}
          >
            {/* White Cloud Circle */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1FB] text-[#2563eb] mb-3.5">
              <CloudUpload className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />
            </div>
            
            <h3 className="text-lg font-extrabold text-[#0B1A30] tracking-tight">
              Drag and drop your files here
            </h3>
            
            <p className="text-xs font-semibold text-[#8B98A5] mt-1">
              Support for PDF, DOCX, and PPTX files (Max 50MB)
            </p>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseFilesClick()
              }}
              className="mt-5 rounded-xl border border-[#D5E1F2] bg-white hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
            >
              Browse Files
            </button>
          </div>

          {/* Active Upload Progress Card */}
          {fileAttached && (
            <div className="rounded-xl bg-[#F0F4F9]/60 p-5 shadow-none animate-fade-in select-none relative overflow-hidden">
              {/* Row: Icon, Filename, Percentage */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Styled Document Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                    {renderPreviewFileIcon()}
                  </div>
                  <span className="font-bold text-[#0B1A30] text-sm truncate pr-4" title={fileName}>
                    {fileName}
                  </span>
                </div>
                
                {/* Percentage on Right */}
                <span className="text-sm font-extrabold text-[#2563eb] shrink-0">
                  {uploadProgress}%
                </span>
              </div>

              {/* Progress Bar Row - Spans full width of card */}
              <div className="w-full bg-[#EAF1FB] rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    uploadComplete ? "bg-emerald-500" : "bg-[#2563eb]"
                  )}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => {
                  setFileAttached(false)
                  setSelectedFile(null)
                }}
                className="absolute top-3 right-3 rounded-full p-1 text-slate-400 hover:bg-slate-200/55 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                aria-label="Cancel upload"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Form Fields Stack */}
          <div className="space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="upload-title" className="block text-sm font-bold text-[#5F6E80] select-none">
                Document Title
              </label>
              <input
                id="upload-title"
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Enter document title"
                disabled={isProcessing}
                required
                className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400"
              />
            </div>

            {/* Subject Dropdown Select */}
            <div className="space-y-2">
              <label htmlFor="upload-subject" className="block text-sm font-bold text-[#5F6E80] select-none">
                Subject
              </label>
              <div className="relative">
                <select
                  id="upload-subject"
                  value={selectedSubjectKey}
                  onChange={(e) => setSelectedSubjectKey(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full appearance-none rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] cursor-pointer"
                >
                  <option value="COMPSCI">Software Engineering</option>
                  <option value="MATHEMATICS">Mathematics</option>
                  <option value="BIOLOGY">Molecular Biology</option>
                  <option value="PHYSICS">Physics</option>
                  <option value="PHILOSOPHY">Philosophy</option>
                  <option value="ECONOMICS">Economics</option>
                  <option value="GENERAL">General Studies</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#5F6E80]">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label htmlFor="upload-desc" className="block text-sm font-bold text-[#5F6E80] select-none">
                Description
              </label>
              <textarea
                id="upload-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this study document..."
                disabled={isProcessing}
                className="w-full rounded-xl border border-transparent bg-[#F0F4F9]/60 hover:bg-[#F0F4F9]/80 focus:bg-white focus:border-[#2563eb] focus:outline-none transition-all px-4 py-3 text-sm font-semibold text-[#0B1A30] placeholder:text-slate-400 min-h-[100px] resize-none"
              />
            </div>

            {/* Tags Pills Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] select-none">
                Tags
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
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* File Type & Visibility Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            
            {/* File Type Display */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] select-none">
                File Type
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[#EAF1FB] bg-white px-4 py-3 text-sm text-slate-700 font-semibold select-none">
                <FileText className="h-4.5 w-4.5 text-[#5F6E80]" />
                <span>Auto-detected: {fileType.toUpperCase()}</span>
              </div>
            </div>

            {/* Visibility Choices */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#5F6E80] select-none">
                Visibility
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
                      "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                      visibility === 'private' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'private' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'private' ? "text-[#2563eb]" : "text-[#5F6E80]"
                  )}>
                    Private
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
                      "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                      visibility === 'shared' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'shared' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'shared' ? "text-[#2563eb]" : "text-[#5F6E80]"
                  )}>
                    Shared
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
                      "h-4.5 w-4.5 rounded-full border bg-white transition-all duration-200",
                      visibility === 'public' ? "border-[#2563eb] ring-2 ring-blue-50" : "border-slate-300"
                    )} />
                    <div className={cn(
                      "absolute h-2.5 w-2.5 rounded-full bg-[#2563eb] transition-all duration-200 scale-0",
                      visibility === 'public' && "scale-100"
                    )} />
                  </div>
                  <span className={cn(
                    "text-sm font-bold transition-colors duration-200",
                    visibility === 'public' ? "text-[#2563eb]" : "text-[#5F6E80]"
                  )}>
                    Public
                  </span>
                </label>

              </div>
            </div>

          </div>

          {/* AI Processing Configuration Card */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#2563eb] animate-pulse" />
              <h3 className="text-base font-extrabold text-[#0B1A30] tracking-tight select-none">
                AI Processing
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generate Summary Checkbox Card */}
              <label
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white",
                  generateSummary
                    ? "border-blue-100 bg-[#F4F7FF]/30 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50/50"
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
                <span className="text-sm font-bold text-[#0B1A30]">
                  Generate summary
                </span>
              </label>

              {/* Create Flashcards Checkbox Card */}
              <label
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white",
                  createFlashcards
                    ? "border-blue-100 bg-[#F4F7FF]/30 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50/50"
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
                <span className="text-sm font-bold text-[#0B1A30]">
                  Create flashcards
                </span>
              </label>
            </div>
          </div>

          {/* Action buttons Cancel & Process */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/dashboard/documents')}
              disabled={isProcessing}
              className="rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isProcessing || !fileAttached}
              className="group flex items-center gap-2 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 px-6 h-[44px] cursor-pointer transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {isProcessing ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Process with AI
                </>
              )}
            </button>
          </div>

        </div>
      </form>


    </div>
  )
}

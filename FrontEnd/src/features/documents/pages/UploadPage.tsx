import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
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
  BIOLOGY: { title: 'Biology', courseCode: 'Genetics Lab' },
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
  const [docTitle, setDocTitle] = useState('')
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<'MATHEMATICS' | 'BIOLOGY' | 'PHYSICS' | 'COMPSCI' | 'PHILOSOPHY' | 'ECONOMICS' | 'GENERAL'>('COMPSCI') // Default Software Engineering
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Notes']) // Default 'Notes' selected per Figma
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [generateSummary, setGenerateSummary] = useState(true)
  const [createFlashcards, setCreateFlashcards] = useState(true)

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileAttached, setFileAttached] = useState(true) // Start with default mockup pdf file attached
  const [uploadProgress, setUploadProgress] = useState(65) // Start at 65% per Figma
  const [uploadComplete, setUploadComplete] = useState(false)
  const [fileName, setFileName] = useState('Software_Patterns_Notes.pdf')
  const [fileSize, setFileSize] = useState('4.2 MB')

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
      navigate(`/dashboard/documents/subject/${selectedSubjectKey.toLowerCase()}`)
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
        return 'bg-rose-50 border border-rose-100'
      case 'word':
        return 'bg-blue-50 border border-blue-100'
      case 'text':
        return 'bg-emerald-50 border border-emerald-100'
      case 'image':
        return 'bg-sky-50 border border-sky-100'
      case 'slides':
      default:
        return 'bg-amber-50 border border-amber-100'
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-6xl mx-auto pt-2 px-4 md:px-6">
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.pptx,.ppt"
      />

      {/* Back Link Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/documents')}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#2563eb] transition-colors focus:outline-none w-fit cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </button>
      </div>

      {/* Header Title with dynamic badge */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Upload New Document
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF1FF] px-3.5 py-1 text-xs font-bold text-[#3155F6] border border-blue-100/50 transition-all duration-300">
          <Folder className="h-3.5 w-3.5 fill-[#3155F6]/10" />
          {subjectInfo.title}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 -mt-2">
        Add new study materials directly to {subjectInfo.title}.
      </p>

      {/* Main Grid Content */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* Left Side: Upload Zone & Progress Card (Width ~42%) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseFilesClick}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center min-h-[300px] transition-all duration-300 cursor-pointer",
              isDragOver
                ? "border-[#2563eb] bg-blue-50/20 shadow-inner"
                : "border-[#C3D2FF] bg-[#F4F7FF]/55 hover:bg-[#F4F7FF]/80"
            )}
          >
            {/* White Cloud Circle */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm mb-5 border border-slate-100/60">
              <CloudUpload className="h-6 w-6 stroke-[1.8] text-[#2563eb]" />
            </div>
            
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Drag and drop your files here
            </h3>
            
            <p className="text-xs font-semibold text-slate-400 mt-2 max-w-[240px] leading-relaxed">
              Support PDF, DOCX, PPTX, XLSX, PNG,<br />JPG
            </p>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleBrowseFilesClick()
              }}
              className="mt-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#2563eb] font-bold text-xs px-6 py-2.5 shadow-sm transition-all cursor-pointer hover:border-blue-200"
            >
              Browse Files
            </button>
          </div>

          {/* Active Upload Progress Card */}
          {fileAttached && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm animate-fade-in select-none flex items-start gap-4">
              {/* File Icon container */}
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", getFileTypeStyle())}>
                {renderPreviewFileIcon()}
              </div>

              {/* Stack containing metadata, progress and cancel actions */}
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Row 1: Title and Size */}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800 truncate pr-4" title={fileName}>
                    {fileName}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 shrink-0">
                    {fileSize}
                  </span>
                </div>

                {/* Row 2: Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      uploadComplete ? "bg-emerald-500" : "bg-[#2563eb]"
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>

                {/* Row 3: Progress label and Close trigger */}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={cn(
                    uploadComplete ? "text-emerald-600 flex items-center gap-1" : "text-[#2563eb]"
                  )}>
                    {uploadComplete ? (
                      <span className="flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                        Upload Complete
                      </span>
                    ) : (
                      `Uploading... ${uploadProgress}%`
                    )}
                  </span>
                  
                  {/* Cancel / Remove Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setFileAttached(false)
                      setSelectedFile(null)
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Cancel upload"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Form Fields & AI Processing Card (Width ~58%) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Card Form */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-5">
            
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="upload-title" className="block text-sm font-bold text-slate-700 select-none">
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
                className="w-full rounded-xl border border-slate-200 bg-[#F0F4FF]/25 px-4 py-3 text-sm focus:border-[#2563eb] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-semibold text-slate-800"
              />
            </div>

            {/* Subject Dropdown Select */}
            <div className="space-y-2">
              <label htmlFor="upload-subject" className="block text-sm font-bold text-slate-700 select-none">
                Subject
              </label>
              <div className="relative">
                <select
                  id="upload-subject"
                  value={selectedSubjectKey}
                  onChange={(e) => setSelectedSubjectKey(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-[#F0F4FF]/25 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-[#2563eb] focus:bg-white focus:outline-none transition-all cursor-pointer"
                >
                  <option value="COMPSCI">Software Engineering</option>
                  <option value="MATHEMATICS">Mathematics</option>
                  <option value="BIOLOGY">Biology</option>
                  <option value="PHYSICS">Physics</option>
                  <option value="PHILOSOPHY">Philosophy</option>
                  <option value="ECONOMICS">Economics</option>
                  <option value="GENERAL">General Studies</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label htmlFor="upload-desc" className="block text-sm font-bold text-slate-700 select-none">
                Description
              </label>
              <textarea
                id="upload-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this study document..."
                disabled={isProcessing}
                className="w-full rounded-xl border border-slate-200 bg-[#F0F4FF]/25 px-4 py-3 text-sm focus:border-[#2563eb] focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 min-h-[100px] resize-none font-semibold text-slate-800"
              />
            </div>

            {/* Tags Pills Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 select-none">
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
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Type & Visibility Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* File Type Display */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 select-none">
                  File Type
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F0F4FF]/25 px-4 py-3 text-sm text-slate-700 font-semibold select-none">
                  <FileText className="h-4.5 w-4.5 text-slate-400" />
                  <span>Auto-detected: {fileType.toUpperCase()}</span>
                </div>
              </div>

              {/* Visibility Choices */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 select-none">
                  Visibility
                </label>
                <div className="flex items-center gap-4 h-[46px]">
                  
                  {/* Private Radio */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                      disabled={isProcessing}
                      className="sr-only"
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
                      visibility === 'private' ? "text-[#2563eb]" : "text-slate-700"
                    )}>
                      Private
                    </span>
                  </label>

                  {/* Shared Radio */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="visibility"
                      value="shared"
                      checked={visibility === 'shared'}
                      onChange={() => setVisibility('shared')}
                      disabled={isProcessing}
                      className="sr-only"
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
                      visibility === 'shared' ? "text-[#2563eb]" : "text-slate-700"
                    )}>
                      Shared
                    </span>
                  </label>

                  {/* Public Radio */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                      disabled={isProcessing}
                      className="sr-only"
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
                      visibility === 'public' ? "text-[#2563eb]" : "text-slate-700"
                    )}>
                      Public
                    </span>
                  </label>

                </div>
              </div>

            </div>

          </div>

          {/* AI Processing Configuration Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative">
            {/* Elegant Indigo-accent top border as seen in Figma */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500 via-[#3155F6] to-indigo-500" />
            
            <div className="flex items-center gap-2 mb-4 pt-1">
              <Sparkles className="h-5 w-5 text-[#2563eb] animate-pulse" />
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight select-none">
                AI Processing
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generate Summary Checkbox Card */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white",
                  generateSummary
                    ? "border-blue-100 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    generateSummary
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-slate-300 bg-white"
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
                <span className="text-sm font-bold text-slate-800">
                  Generate summary
                </span>
                <input
                  type="checkbox"
                  checked={generateSummary}
                  onChange={(e) => setGenerateSummary(e.target.checked)}
                  className="sr-only"
                  disabled={isProcessing}
                />
              </label>

              {/* Create Flashcards Checkbox Card */}
              <label
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-all cursor-pointer select-none bg-white",
                  createFlashcards
                    ? "border-blue-100 shadow-xs"
                    : "border-slate-200 hover:bg-slate-50/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    createFlashcards
                      ? "border-[#2563eb] bg-[#2563eb] text-white"
                      : "border-slate-300 bg-white"
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
                <span className="text-sm font-bold text-slate-800">
                  Create flashcards
                </span>
                <input
                  type="checkbox"
                  checked={createFlashcards}
                  onChange={(e) => setCreateFlashcards(e.target.checked)}
                  className="sr-only"
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>

          {/* Action buttons Cancel & Process */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/documents')}
              disabled={isProcessing}
              className="rounded-xl font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs px-6 h-[44px] cursor-pointer transition-all disabled:opacity-50 text-sm"
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

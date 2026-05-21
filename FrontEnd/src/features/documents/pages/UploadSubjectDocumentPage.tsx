import React, { useState } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  CloudUpload,
  Sparkles,
  FileCode,
  FileText,
  Image as ImageIcon,
  BookOpen,
  FolderDown,
  CheckCircle,
  Eye,
  Lock,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  showToast: (msg: string) => void
}

const COURSE_NAMES: Record<string, string> = {
  COMPSCI: 'Software Engineering',
  MATHEMATICS: 'Mathematics',
  BIOLOGY: 'Biology',
  PHYSICS: 'Physics',
  PHILOSOPHY: 'Philosophy',
  ECONOMICS: 'Economics',
  GENERAL: 'General Education'
}

export function UploadSubjectDocumentPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { setDocuments, showToast } = useOutletContext<DocumentsLayoutContext>()

  const activeSubjectKey = (subjectId?.toUpperCase() || 'GENERAL') as keyof typeof COURSE_NAMES
  const subjectName = COURSE_NAMES[activeSubjectKey] || COURSE_NAMES.GENERAL

  // Form states
  const [docTitle, setDocTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [fileType, setFileType] = useState<'pdf' | 'word' | 'image' | 'text' | 'slides'>('pdf')
  const [visibility, setVisibility] = useState<'public' | 'private' | 'group'>('public')

  // AI checkboxes
  const [aiSummary, setAiSummary] = useState(true)
  const [aiFlashcards, setAiFlashcards] = useState(true)
  const [aiQuiz, setAiQuiz] = useState(true)
  const [aiFormulas, setAiFormulas] = useState(false)

  // File Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Progress states
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')

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
    if (!docTitle) {
      const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ')
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
    }

    // Auto-detect type
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') setFileType('pdf')
    else if (ext === 'docx' || ext === 'doc') setFileType('word')
    else if (ext === 'txt') setFileType('text')
    else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') setFileType('image')
    else if (ext === 'pptx' || ext === 'ppt') setFileType('slides')
  }

  // Trigger file dialog
  const triggerFileSelect = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = (e) => handleFileChange(e as any)
    input.click()
  }

  // Upload submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile && !docTitle) return

    setIsProcessing(true)
    setProgress(5)
    setProgressMsg('Establishing secure upload connection...')

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setProgressMsg('Uploading document bytes...')
          return prev + Math.floor(Math.random() * 8) + 4
        } else if (prev < 60) {
          setProgressMsg('AI is extracting key phrases & raw text...')
          return prev + Math.floor(Math.random() * 6) + 4
        } else if (prev < 85) {
          setProgressMsg('Running machine intelligence semantic indexing...')
          return prev + Math.floor(Math.random() * 5) + 3
        } else if (prev < 98) {
          setProgressMsg('Generating summaries & active recall flashcards...')
          return prev + 2
        } else {
          clearInterval(interval)
          setProgressMsg('Success! Saving to secure course repository...')
          
          setTimeout(() => {
            const finalTitle = docTitle || selectedFile?.name.split('.')[0] || 'Untitled Material'
            const finalFileName = selectedFile?.name || `${finalTitle.toLowerCase().replace(/\s+/g, '_')}.${fileType}`
            const finalSize = selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.8 MB'
            const finalSizeKb = selectedFile ? Math.round(selectedFile.size / 1024) : 1843

            const newDoc: DocumentItem = {
              id: `doc-${Date.now()}`,
              title: finalTitle,
              fileName: finalFileName,
              uploadedAt: 'Uploaded Just Now',
              uploadedDateObj: new Date(),
              size: finalSize,
              sizeKb: finalSizeKb,
              subject: activeSubjectKey,
              status: 'ANALYZED',
              type: fileType
            }

            setDocuments((prev) => [newDoc, ...prev])
            setIsProcessing(false)
            setProgress(0)
            showToast(`Tài liệu "${finalTitle}" đã được tải lên và phân tích AI thành công!`)
            navigate(`/dashboard/documents/subject/${activeSubjectKey}`)
          }, 1000)

          return 100
        }
      })
    }, 200)
  }

  // File icon mapper for preview
  const renderPreviewFileIcon = () => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-rose-500" />
      case 'word':
        return <FileCode className="h-8 w-8 text-blue-500" />
      case 'text':
        return <BookOpen className="h-8 w-8 text-emerald-500" />
      case 'image':
        return <ImageIcon className="h-8 w-8 text-sky-500" />
      case 'slides':
      default:
        return <FolderDown className="h-8 w-8 text-amber-500" />
    }
  }

  return (
    <div className="space-y-5 animate-fade-in pb-16 max-w-5xl mx-auto pt-2">
      
      {/* Back link breadcrumb */}
      <div className="-mb-2">
        <button
          onClick={() => navigate(`/dashboard/documents/subject/${activeSubjectKey}`)}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-primary transition-colors focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Subject
        </button>
      </div>

      {/* Main Container */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-[rgba(195,198,215,0.65)] bg-white p-6 shadow-xl shadow-[rgba(37,99,235,0.03)] md:p-10 space-y-8 relative overflow-hidden">
        
        {/* Header Title */}
        <div className="border-b border-border pb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl tracking-tight">
              Upload New Document
            </h1>
            <p className="mt-2 text-sm text-muted font-medium">
              Add study resources to this subject. AI will build flashcards, summaries, and quizzes.
            </p>
          </div>
          <span className="rounded-full bg-blue-50/70 border border-blue-100 px-4 py-2 text-xs font-extrabold text-primary tracking-wide">
            🏫 Subject: {subjectName}
          </span>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          
          {/* LEFT COLUMN: Drag & Drop upload area, Browse Files button, Upload progress card, File preview */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                File Attachment
              </label>
              
              {isProcessing ? (
                /* Simulated active AI Processing inside Left Column */
                <div className="rounded-2xl border border-blue-100 bg-blue-50/10 p-6 space-y-6 shadow-xs animate-fade-in flex flex-col items-center">
                  {/* Glowing Circular Progress */}
                  <div className="relative flex h-32 w-32 items-center justify-center shrink-0">
                    <svg className="absolute inset-0 size-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-slate-100 fill-none"
                        strokeWidth="7"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        className="stroke-primary fill-none transition-all duration-300 ease-out"
                        strokeWidth="7"
                        strokeDasharray={2 * Math.PI * 56}
                        strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="flex flex-col items-center justify-center z-10">
                      <span className="text-2xl font-black text-primary tracking-tight">{progress}%</span>
                      <span className="text-[9px] uppercase font-extrabold tracking-widest text-muted mt-0.5">Progress</span>
                    </div>
                    <div className="absolute inset-3 rounded-full bg-primary/5 blur-lg -z-10" />
                  </div>
                  
                  {/* Status Tracker */}
                  <div className="w-full space-y-4">
                    <div className="text-center">
                      <h3 className="text-sm font-extrabold text-foreground tracking-tight">
                        AI Academic Processing
                      </h3>
                      <p className="text-[11px] text-muted leading-relaxed mt-1 h-8 px-2">
                        {progressMsg}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[rgba(195,198,215,0.4)] bg-slate-50/50 p-4 space-y-3 shadow-inner">
                      {/* Step 1 */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {progress >= 15 ? (
                            <CheckCircle className="size-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                          ) : (
                            <div className={cn("size-3.5 rounded-full border-2 shrink-0", progress >= 5 ? "border-primary animate-pulse" : "border-slate-300")} />
                          )}
                          <span className={cn(progress >= 15 ? "text-muted line-through" : "text-foreground")}>
                            1. Establishing secure connection
                          </span>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {progress >= 40 ? (
                            <CheckCircle className="size-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                          ) : (
                            <div className={cn("size-3.5 rounded-full border-2 shrink-0", progress >= 15 ? "border-primary animate-pulse" : "border-slate-300")} />
                          )}
                          <span className={cn(progress >= 40 ? "text-muted line-through" : "text-foreground")}>
                            2. Uploading document chunks
                          </span>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {progress >= 70 ? (
                            <CheckCircle className="size-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                          ) : (
                            <div className={cn("size-3.5 rounded-full border-2 shrink-0", progress >= 40 ? "border-primary animate-pulse" : "border-slate-300")} />
                          )}
                          <span className={cn(progress >= 70 ? "text-muted line-through" : "text-foreground")}>
                            3. Semantic text extraction
                          </span>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          {progress >= 90 ? (
                            <CheckCircle className="size-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                          ) : (
                            <div className={cn("size-3.5 rounded-full border-2 shrink-0", progress >= 70 ? "border-primary animate-pulse" : "border-slate-300")} />
                          )}
                          <span className={cn(progress >= 90 ? "text-muted line-through" : "text-foreground")}>
                            4. Generating summaries & flashcards
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !selectedFile ? (
                /* Active Drag & Drop Box with Browse Files button */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={cn(
                    "group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 min-h-[220px]",
                    isDragOver
                      ? "border-primary bg-primary/5 shadow-inner"
                      : "border-slate-300 hover:border-primary hover:bg-blue-50/20"
                  )}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                    <CloudUpload className="h-7 w-7 animate-pulse" />
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                      Drag and drop your study file here
                    </p>
                    <p className="text-xs text-muted mt-2 leading-relaxed font-medium">
                      or click to <span className="text-primary font-extrabold hover:underline">Browse Files</span>
                    </p>
                    <p className="text-[10px] text-muted/80 mt-2 font-medium">
                      PDF, DOCX, TXT, PNG, PPTX up to 50MB
                    </p>
                  </div>
                </div>
              ) : (
                /* Selected File Preview Container with remove × action */
                <div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-blue-50/10 p-5 shadow-xs select-none animate-fade-in">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
                      {renderPreviewFileIcon()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted font-bold bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded-md">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <span className="inline-block size-1 bg-slate-300 rounded-full" />
                        <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                          <CheckCircle className="size-3" /> Ready
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedFile(null)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-muted hover:text-danger hover:border-danger/30 hover:bg-rose-50/30 transition-all shadow-xs cursor-pointer"
                    title="Remove file"
                  >
                    <span className="text-lg font-black leading-none">×</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Form fields (Document Title, pre-filled Subject, Description, Tags, Format, Visibility) */}
          <div className="space-y-5">
            
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="upload-title" className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                Document Title
              </label>
              <Input
                id="upload-title"
                placeholder="e.g. Design Patterns Lecture Notes, Calculus Cheat Sheet"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                required
                disabled={isProcessing}
                className="rounded-xl border-border py-3 focus-visible:ring-primary/20 bg-white disabled:bg-slate-50"
              />
            </div>

            {/* Pre-filled Subject */}
            <div className="space-y-2">
              <label htmlFor="upload-subject" className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                Subject
              </label>
              <Input
                id="upload-subject"
                value={subjectName}
                disabled
                className="rounded-xl border-border py-3 bg-slate-50 text-muted/80 font-bold cursor-not-allowed border-dashed"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="upload-desc" className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                Description (Optional)
              </label>
              <Textarea
                id="upload-desc"
                placeholder="Enter details to help AI contextualize summaries..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isProcessing}
                className="rounded-xl border-border min-h-[90px] focus-visible:ring-primary/20 bg-white disabled:bg-slate-50"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label htmlFor="upload-tags" className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                Tags (Comma-separated)
              </label>
              <Input
                id="upload-tags"
                placeholder="e.g. creational, patterns, mid-term"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isProcessing}
                className="rounded-xl border-border py-3 focus-visible:ring-primary/20 bg-white disabled:bg-slate-50"
              />
            </div>

            {/* Format dropdown */}
            <div className="space-y-2">
              <label htmlFor="upload-type" className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                File Type
              </label>
              <div className="relative">
                <select
                  id="upload-type"
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as any)}
                  disabled={isProcessing}
                  className="w-full appearance-none rounded-xl border border-border bg-white px-4.5 py-3 pr-10 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 cursor-pointer font-semibold disabled:bg-slate-50"
                >
                  <option value="pdf">PDF File (.pdf)</option>
                  <option value="word">Word Document (.docx)</option>
                  <option value="text">Text File (.txt)</option>
                  <option value="image">Image Note (.png, .jpg)</option>
                  <option value="slides">Presentation Slides (.pptx)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted">
                  <svg className="size-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Visibility options selector cards: Private, Shared, Public */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
                Visibility
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  disabled={isProcessing}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    visibility === 'private'
                      ? "border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-border hover:bg-slate-50 text-muted disabled:opacity-50"
                  )}
                >
                  <Lock className="h-4.5 w-4.5 mb-1.5" />
                  <span className="text-[10px] font-bold">Private</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('group')}
                  disabled={isProcessing}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    visibility === 'group'
                      ? "border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-border hover:bg-slate-50 text-muted disabled:opacity-50"
                  )}
                >
                  <Users className="h-4.5 w-4.5 mb-1.5" />
                  <span className="text-[10px] font-bold">Shared</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  disabled={isProcessing}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer",
                    visibility === 'public'
                      ? "border-primary bg-primary/5 text-primary shadow-xs"
                      : "border-border hover:bg-slate-50 text-muted disabled:opacity-50"
                  )}
                >
                  <Eye className="h-4.5 w-4.5 mb-1.5" />
                  <span className="text-[10px] font-bold">Public</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: AI Processing selection card & action buttons */}
        <div className="border-t border-border pt-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted select-none">
              AI Processing
            </label>
            
            {/* AI Processing Card containing Generate Summary and Create Flashcards checkboxes */}
            <div className="rounded-2xl border border-border bg-slate-50/50 p-5 shadow-inner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-body select-none">
                  <input
                    type="checkbox"
                    checked={aiSummary}
                    onChange={(e) => setAiSummary(e.target.checked)}
                    disabled={isProcessing}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-50"
                  />
                  Generate summary
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer text-sm font-semibold text-body select-none">
                  <input
                    type="checkbox"
                    checked={aiFlashcards}
                    onChange={(e) => setAiFlashcards(e.target.checked)}
                    disabled={isProcessing}
                    className="h-4.5 w-4.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-50"
                  />
                  Create flashcards
                </label>
              </div>
            </div>
          </div>

          {/* Cancel and Process with AI action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/dashboard/documents/subject/${activeSubjectKey}`)}
              disabled={isProcessing}
              className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isProcessing || (!selectedFile && !docTitle)}
              className="group flex items-center gap-2 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/15 px-6 hover:bg-primary-dark cursor-pointer transition-all duration-200"
            >
              <Sparkles className="h-4.5 w-4.5" />
              Process with AI
            </Button>
          </div>
        </div>

      </form>
      
    </div>
  )
}

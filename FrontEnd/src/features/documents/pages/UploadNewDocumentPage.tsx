import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  CloudUpload,
  FileText,
  X,
  Sparkles,
  Lock,
  Users,
  Globe,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
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
  essential?: boolean
}

interface DocumentsContextType {
  documents: DocumentItem[]
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>
  showToast: (message: string) => void
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

export default function UploadNewDocumentPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const activeSubjectId = (subjectId || 'GENERAL').toUpperCase()
  const subjectInfo = SUBJECT_MAP[activeSubjectId] || SUBJECT_MAP.GENERAL

  const { setDocuments, showToast } = useOutletContext<DocumentsContextType>()

  // Form states
  const [docTitle, setDocTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(['Notes']) // Default 'Notes' active
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private')
  const [generateSummary, setGenerateSummary] = useState(true)
  const [createFlashcards, setCreateFlashcards] = useState(true)

  // Upload simulation states
  const [fileAttached, setFileAttached] = useState(true) // Start with default Figma mock file attached
  const [uploadProgress, setUploadProgress] = useState(65) // Start at 65% per Figma
  const [uploadComplete, setUploadComplete] = useState(false)
  const [fileName, setFileName] = useState('Software_Patterns_Notes.pdf')
  const [fileSize, setFileSize] = useState('4.2 MB')

  // Smoothly animate the uploading progress from 65% to 100% on mount
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
    }, 400)

    return () => clearInterval(interval)
  }, [fileAttached, uploadComplete])

  // Handle file select simulation
  const handleBrowseFilesClick = () => {
    setFileName('Software_Design_Doc.pdf')
    setFileSize('3.5 MB')
    setUploadProgress(0)
    setUploadComplete(false)
    setFileAttached(true)
  }

  // Handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Form submit (Simulate saving the new uploaded document)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fileAttached) {
      alert('Please select or upload a document first!')
      return
    }

    const finalTitle = docTitle.trim() || fileName.split('.')[0].replace(/_/g, ' ')

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: finalTitle,
      fileName: fileName,
      uploadedAt: 'Uploaded Just Now',
      uploadedDateObj: new Date(),
      size: fileSize,
      sizeKb: parseFloat(fileSize) * 1024 || 1500,
      subject: activeSubjectId as any,
      status: 'ANALYZED',
      type: 'pdf',
      essential: selectedTags.includes('Lecture') || selectedTags.includes('Midterm')
    }

    // Add to global state
    setDocuments((prev) => [newDoc, ...prev])

    // Success notifications
    showToast(`Tài liệu "${finalTitle}" được tải lên và xử lý AI thành công!`)

    // Navigate back to the subject page
    navigate(`/dashboard/documents/subject/${subjectId}`)
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Back Link */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/dashboard/documents/subject/${subjectId}`)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-primary transition-colors focus:outline-none w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Subject
        </button>
      </div>

      {/* Header Block */}
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
          Upload New Document
        </h1>
        <span className="inline-flex items-center rounded-full bg-[#EBF1FF] px-3 py-1 text-xs font-bold text-primary border border-blue-100/50 uppercase tracking-wider">
          {subjectInfo.title}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 -mt-2">
        Add new study materials directly to {subjectInfo.title}.
      </p>

      {/* Main Grid Content */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
        
        {/* Left Side: Upload Zone & Progress */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Drag & Drop Area */}
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B8C8FF] bg-[#F4F7FF]/60 p-8 text-center min-h-[280px] transition-all hover:bg-[#F4F7FF]/90">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF1FF] text-primary shadow-sm mb-4">
              <CloudUpload className="h-6 w-6 stroke-[1.8]" />
            </div>
            
            <h3 className="text-[17px] font-black text-slate-900 tracking-tight">
              Drag and drop your files here
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-2 max-w-[240px] leading-relaxed">
              Support PDF, DOCX, PPTX, XLSX, PNG, JPG
            </p>
            
            <Button
              type="button"
              variant="secondary"
              onClick={handleBrowseFilesClick}
              className="mt-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm font-bold text-xs px-6 py-2.5 h-[38px] transition-all"
            >
              Browse Files
            </Button>
          </div>

          {/* Upload Progress Indicator */}
          {fileAttached && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-fade-in">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100/50">
                    <FileText className="h-6 w-6 stroke-[1.8]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate" title={fileName}>
                      {fileName}
                    </h4>
                    <p className="text-xs font-semibold text-slate-400 mt-0.5">
                      {fileSize}
                    </p>
                  </div>
                </div>
                
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={() => setFileAttached(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label="Cancel upload"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Progress and status message */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className={cn(
                    uploadComplete ? "text-emerald-600 flex items-center gap-1" : "text-[#2563eb]"
                  )}>
                    {uploadComplete ? (
                      <>
                        <FileCheck className="h-3.5 w-3.5" />
                        Upload Complete
                      </>
                    ) : (
                      `Uploading... ${uploadProgress}%`
                    )}
                  </span>
                </div>
                
                {/* Progress bar container */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      uploadComplete ? "bg-emerald-500" : "bg-[#2563eb]"
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Form Fields & AI Processing */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Card Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            
            {/* Title Input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Document Title
              </label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Enter document title"
                className="w-full rounded-xl border border-slate-200 bg-[#F4F7FF]/20 px-4 py-3 text-sm focus:border-primary focus:bg-white focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Subject (Disabled - Auto) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Subject
              </label>
              <Input
                value={subjectInfo.title}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-[#EBF1FF]/70 px-4 py-3 text-sm font-bold text-slate-500 cursor-not-allowed select-none border-blue-100/30"
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this study document..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none transition-all placeholder:text-slate-400 min-h-[96px] resize-none"
              />
            </div>

            {/* Tags Pills Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
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
                      className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold border transition-all duration-200 focus:outline-none",
                        isSelected
                          ? "bg-primary border-primary text-white shadow-sm shadow-blue-500/10"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* File Type & Visibility Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              
              {/* File Type Display */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                  File Type
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#F4F7FF]/40 px-4 py-3 text-sm text-slate-700 font-bold border-blue-50/50">
                  <FileText className="h-4.5 w-4.5 text-slate-400" />
                  <span>Auto-detected: PDF</span>
                </div>
              </div>

              {/* Visibility Choice */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
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
                      className="peer sr-only"
                    />
                    <div className="relative flex items-center justify-center">
                      <div className="h-4.5 w-4.5 rounded-full border border-slate-300 bg-white transition-colors peer-checked:border-primary"></div>
                      <div className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
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
                      className="peer sr-only"
                    />
                    <div className="relative flex items-center justify-center">
                      <div className="h-4.5 w-4.5 rounded-full border border-slate-300 bg-white transition-colors peer-checked:border-primary"></div>
                      <div className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
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
                      className="peer sr-only"
                    />
                    <div className="relative flex items-center justify-center">
                      <div className="h-4.5 w-4.5 rounded-full border border-slate-300 bg-white transition-colors peer-checked:border-primary"></div>
                      <div className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-slate-400" />
                      Public
                    </span>
                  </label>

                </div>
              </div>

            </div>

          </div>

          {/* AI Processing Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden relative">
            {/* Blue-Indigo Top Gradient Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-blue-500 via-[#3155F6] to-indigo-500" />
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                AI Processing
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generate Summary Checkbox */}
              <div className="flex items-center rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 transition-colors hover:bg-slate-50">
                <Checkbox
                  id="chk-summary"
                  label="Generate summary"
                  checked={generateSummary}
                  onChange={(e) => setGenerateSummary(e.target.checked)}
                  className="font-bold text-slate-700 text-sm"
                />
              </div>

              {/* Create Flashcards Checkbox */}
              <div className="flex items-center rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 transition-colors hover:bg-slate-50">
                <Checkbox
                  id="chk-flashcards"
                  label="Create flashcards"
                  checked={createFlashcards}
                  onChange={(e) => setCreateFlashcards(e.target.checked)}
                  className="font-bold text-slate-700 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-xl bg-primary hover:bg-blue-700 py-3 font-bold text-white shadow-md shadow-blue-500/10 active:scale-[0.99] transition-all duration-300 text-sm"
          >
            Upload Document
          </Button>

        </div>

      </form>
    </div>
  )
}

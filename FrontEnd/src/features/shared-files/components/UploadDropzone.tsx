import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { CloudUpload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void
  onValidationError: (msg: string) => void
}

const ALLOWED_EXTENSIONS = ['pdf']
const MAX_FILE_SIZE_MB = 50

export function UploadDropzone({ onFileSelect, onValidationError }: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const validateAndProcessFile = (file: File) => {
    // 1. Validate File Size
    const fileSizeMb = file.size / (1024 * 1024)
    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      onValidationError('File size exceeds 50MB')
      return
    }

    // 2. Validate File Type
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      onValidationError('Unsupported file type. Please upload PDF only.')
      return
    }

    onFileSelect(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      validateAndProcessFile(files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      validateAndProcessFile(files[0])
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleBrowseClick}
      className={cn(
        "flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed p-10 text-center min-h-[220px] transition-all duration-300 cursor-pointer select-none",
        isDragOver
          ? "border-[#3155F6] bg-blue-50/10 dark:bg-blue-955/15 shadow-inner"
          : "border-slate-200 dark:border-slate-800 bg-[#F4F7FF]/35 hover:bg-[#F4F7FF]/55 dark:bg-slate-900 dark:hover:bg-slate-800/60"
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf"
      />

      {/* Cloud Upload Circle Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#3155F6] dark:text-blue-400 mb-4 shrink-0 shadow-xs">
        <CloudUpload className="h-7 w-7 stroke-[1.8]" />
      </div>

      <h3 className="text-lg font-black text-slate-850 dark:text-white tracking-tight">
        Drag and drop your files here
      </h3>

      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1.5">
        Support for PDF files (Max 50MB)
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleBrowseClick()
        }}
        className="mt-5 rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-[#3155F6] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-extrabold text-xs px-6 py-2.5 shadow-xs hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      >
        Browse Files
      </button>
    </div>
  )
}

export default UploadDropzone

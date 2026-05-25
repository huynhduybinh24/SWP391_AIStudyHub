import { X, FileText, FileSpreadsheet, Image as ImageIcon, BookOpen, Presentation } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadProgressCardProps {
  fileName: string
  fileSize: string
  fileType: string
  progress: number
  onCancel: () => void
}

export function UploadProgressCard({
  fileName,
  fileSize,
  fileType,
  progress,
  onCancel
}: UploadProgressCardProps) {
  
  const getFileIcon = () => {
    const ext = fileType.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-5.5 w-5.5 text-rose-500" />
    if (ext === 'xlsx' || ext === 'xls') return <FileSpreadsheet className="h-5.5 w-5.5 text-emerald-500" />
    if (ext === 'docx' || ext === 'doc') return <FileText className="h-5.5 w-5.5 text-blue-500" />
    if (ext === 'pptx' || ext === 'ppt') return <Presentation className="h-5.5 w-5.5 text-amber-500" />
    if (ext === 'txt') return <BookOpen className="h-5.5 w-5.5 text-slate-500" />
    if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return <ImageIcon className="h-5.5 w-5.5 text-sky-500" />
    return <FileText className="h-5.5 w-5.5 text-slate-400" />
  }

  const isComplete = progress >= 100

  return (
    <div className="rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 p-4.5 shadow-none select-none relative overflow-hidden border border-slate-100 dark:border-slate-850 text-left">
      <div className="flex items-center justify-between mb-3.5 pr-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Styled Document Icon Wrapper */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 shadow-xs">
            {getFileIcon()}
          </div>
          <div className="min-w-0">
            <span className="block font-extrabold text-slate-850 dark:text-white text-sm truncate" title={fileName}>
              {fileName}
            </span>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
              {fileSize} &bull; {fileType.toUpperCase()}
            </span>
          </div>
        </div>

        <span className={cn(
          "text-xs font-black shrink-0",
          isComplete ? "text-emerald-500" : "text-[#3155F6] dark:text-blue-400"
        )}>
          {progress}%
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isComplete ? "bg-emerald-500 animate-pulse" : "bg-[#3155F6]"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="absolute top-4 right-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Cancel upload"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default UploadProgressCard

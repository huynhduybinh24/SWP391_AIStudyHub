
import { FileText, FileSpreadsheet, Folder, Image as ImageIcon, Video, File, Music, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileTypeIconProps {
  type: string;
  className?: string;
}

export function FileTypeIcon({ type, className }: FileTypeIconProps) {
  const normType = type.toLowerCase()

  switch (normType) {
    case 'pdf':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-955/35 text-red-500", className)}>
          <FileText className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'doc':
    case 'docx':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-955/35 text-blue-500", className)}>
          <FileText className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'xls':
    case 'xlsx':
    case 'spreadsheet':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-955/35 text-emerald-600 dark:text-emerald-450", className)}>
          <FileSpreadsheet className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'image':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-955/35 text-amber-500", className)}>
          <ImageIcon className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'video':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-955/35 text-rose-500", className)}>
          <Video className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'mp3':
    case 'wav':
    case 'm4a':
    case 'audio':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-955/35 text-emerald-500", className)}>
          <Music className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'recording':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-violet-50 dark:bg-violet-955/35 text-violet-500", className)}>
          <Mic className="size-4.5 stroke-[2]" />
        </div>
      )
    case 'folder':
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-955/35 text-indigo-500", className)}>
          <Folder className="size-4.5 stroke-[2]" />
        </div>
      )
    default:
      return (
        <div className={cn("size-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-500", className)}>
          <File className="size-4.5 stroke-[2]" />
        </div>
      )
  }
}

export default FileTypeIcon

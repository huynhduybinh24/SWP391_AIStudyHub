import { cn } from '@/lib/utils'

interface FileMetadataPanelProps {
  fileName: string
  subject: string
  description: string
  tags: string[]
  fileSize: string
  uploadedAt: string
  className?: string
}

export function FileMetadataPanel({
  fileName,
  subject,
  description,
  tags,
  fileSize,
  uploadedAt,
  className
}: FileMetadataPanelProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-5",
        className
      )}
      aria-label="Document Metadata Panel"
    >
      {/* Subject badge label */}
      <div className="flex">
        <span className="text-[10px] tracking-widest font-black uppercase bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-400 px-3.5 py-1.5 rounded-full shadow-sm">
          {subject}
        </span>
      </div>

      {/* Title / description info */}
      <div className="space-y-2.5">
        <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100 leading-snug break-words">
          {fileName}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-justify">
          {description}
        </p>
      </div>

      {/* Tags Pills container */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors select-none"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      )}

      {/* File telemetry grid */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">File Size</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-350 select-all">
            {fileSize}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider">Uploaded</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-350 select-none">
            {uploadedAt.replace('Uploaded ', '')}
          </p>
        </div>
      </div>
    </div>
  )
}

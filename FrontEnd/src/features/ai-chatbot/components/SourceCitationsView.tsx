import { BookOpen, FileText } from 'lucide-react'
import { SourceCitation } from '@/services/aiService'

interface SourceCitationsViewProps {
  sources?: SourceCitation[]
}

export function SourceCitationsView({ sources }: SourceCitationsViewProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mb-2">
        <BookOpen className="size-3.5 text-blue-600 dark:text-blue-400" />
        <span>Nguồn tài liệu trích dẫn ({sources.length}):</span>
      </div>
      <div className="flex flex-col gap-2">
        {sources.map((source, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-slate-900/60 border border-blue-100/50 dark:border-slate-800 text-left"
          >
            <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold mb-1">
              <span className="truncate flex items-center gap-1.5 text-xs text-blue-700 dark:text-blue-400">
                <FileText className="size-3.5 shrink-0" />
                {source.documentTitle}
              </span>
              {source.pageNumber ? (
                <span className="text-[10px] text-slate-400 font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  Trang {source.pageNumber}
                </span>
              ) : source.section ? (
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                  {source.section}
                </span>
              ) : null}
            </div>
            {source.excerpt && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 italic leading-relaxed line-clamp-2 pl-5 border-l-2 border-blue-400/50">
                "{source.excerpt}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

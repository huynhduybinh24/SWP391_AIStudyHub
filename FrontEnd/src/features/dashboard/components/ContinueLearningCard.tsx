import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useTranslation } from '@/context/LanguageContext'
import { ContinueLearningItem } from '../types'

interface ContinueLearningCardProps {
  item?: ContinueLearningItem | null
}

export function ContinueLearningCard({ item }: ContinueLearningCardProps) {
  const { t, language } = useTranslation()

  if (!item) {
    // Empty state
    return (
      <Link to="/dashboard/documents" className="col-span-12 block group">
        <Card className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 hover:shadow-md transition-all duration-300 dark:hover:border-slate-700/80 cursor-pointer">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
              <BookOpen className="size-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-base font-bold text-foreground">
                {t.dashboard.noRecentDocs}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t.dashboard.noRecentDocsDesc}
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1 shrink-0">
            {t.dashboard.browseDocs}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </Card>
      </Link>
    )
  }

  // Active state
  return (
    <Link to={`/dashboard/documents/${item.id}`} className="col-span-12 block group">
      <Card className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 dark:hover:border-slate-700/80 cursor-pointer">
        <div className="flex items-start gap-4 min-w-0 flex-1 w-full">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
            <FileText className="size-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-base font-bold text-foreground" title={item.title}>
                {item.title}
              </h4>
              {item.course && (
                <Badge variant="default" className="shrink-0 font-semibold">
                  {item.course}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>
                {language === 'vi' ? 'Mở gần nhất: ' : 'Last opened: '}
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.lastOpened}</span>
              </span>
              {item.resumeLabel && (
                <>
                  <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {item.resumeLabel}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:max-w-xs pt-1">
              <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                {item.progress}%
              </span>
            </div>
          </div>
        </div>

        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1 shrink-0 w-full md:w-auto justify-center md:justify-start">
          {t.dashboard.continueReading}
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </Card>
    </Link>
  )
}

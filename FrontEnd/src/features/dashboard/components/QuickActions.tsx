import { Link } from 'react-router-dom'
import { Bot, CalendarDays, Search, Share2, Upload } from 'lucide-react'
import { CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

export function QuickActions() {
  const { t } = useTranslation()

  const actions = [
    { label: t.dashboard.actionUpload, icon: Upload, to: '/dashboard/upload' },
    { label: t.dashboard.actionSearch, icon: Search, to: '/dashboard/documents/search' },
    { label: t.dashboard.actionAIChat, icon: Bot, to: '/dashboard/chat' },
    { label: t.dashboard.actionShared, icon: Share2, to: '/dashboard/shared' },
    { label: t.dashboard.actionStudyPlans, icon: CalendarDays, to: '/dashboard/study-plans' },
  ]

  return (
    <section className="col-span-8 space-y-4">
      <CardTitle>{t.dashboard.quickActions}</CardTitle>
      <div className="grid grid-cols-5 gap-3">
        {actions.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800',
              'bg-white dark:bg-slate-900 py-7 transition-colors hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800',
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
              <Icon className="size-4" />
            </span>
            <span className="text-center text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}


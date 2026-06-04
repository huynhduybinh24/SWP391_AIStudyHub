import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { useTranslation } from '@/context/LanguageContext'

interface StorageWidgetProps {
  usedMb?: number
  totalMb?: number
}

export function StorageWidget({ usedMb = 0, totalMb = 1024 }: StorageWidgetProps) {
  const { t } = useTranslation()
  
  const safeUsedMb = usedMb ?? 0
  const safeTotalMb = totalMb ?? 1024
  
  const percent = safeTotalMb > 0 ? Math.round((safeUsedMb / safeTotalMb) * 100) : 0
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (percent / 100) * circumference

  const displayUsed = safeUsedMb >= 100 ? `${(safeUsedMb / 1024).toFixed(1)} GB` : `${safeUsedMb.toFixed(0)} MB`
  const displayTotal = safeTotalMb >= 1024 ? `${(safeTotalMb / 1024).toFixed(0)} GB` : `${safeTotalMb.toFixed(0)} MB`

  return (
    <section className="col-span-4 space-y-4">
      <CardTitle>{t.dashboard.storage}</CardTitle>
      <Card className="flex items-center gap-5 p-5">
        <div className="relative size-16 shrink-0">
          <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-[#e5eeff] dark:text-slate-800" strokeWidth="6" />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#2563eb"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
            {percent}%
          </span>
        </div>
        <div>
          <p className="text-base text-body">
            {t.dashboard.storageUsedText(displayUsed, displayTotal)}
          </p>
          <Link to="/dashboard/storage" className="mt-2 block text-base text-primary hover:underline">
            {t.dashboard.manageStorage}
          </Link>
        </div>
      </Card>
    </section>
  )
}


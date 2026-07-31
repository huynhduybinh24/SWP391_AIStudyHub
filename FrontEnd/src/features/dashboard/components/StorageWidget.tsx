import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardTitle } from '@/components/ui/Card'
import { useTranslation } from '@/context/LanguageContext'
import { formatStorageSize, calculateStorageUsage } from '@/utils/storageFormat'
import { getCurrentUserStorageSummary } from '@/services/storageService'

interface StorageWidgetProps {
  usedMb?: number
  totalMb?: number
}

export function StorageWidget({ usedMb: propUsedMb, totalMb: propTotalMb }: StorageWidgetProps) {
  const { t } = useTranslation()

  // Lazy-initialise from helper so we always have a non-zero starting point
  const [summary, setSummary] = useState(() => getCurrentUserStorageSummary())

  // Re-read when another user is selected (plan may change)
  useEffect(() => {
    const refresh = () => setSummary(getCurrentUserStorageSummary())
    window.addEventListener('aiStudyHubUserChanged', refresh)
    return () => window.removeEventListener('aiStudyHubUserChanged', refresh)
  }, [])

  // Prefer live API props when they carry a real non-zero used value;
  // fall back to helper otherwise (mock / API not yet connected).
  const usedMb  = (propUsedMb  != null && propUsedMb  > 0) ? propUsedMb  : summary.usedMb
  const totalMb = (propTotalMb != null && propTotalMb > 0) ? propTotalMb : summary.totalMb

  const usage = calculateStorageUsage(usedMb, totalMb)
  const percent = usage.percentage
  const circumference = 2 * Math.PI * 28
  const offset = circumference - (percent / 100) * circumference

  const displayUsed  = formatStorageSize(usedMb)
  const displayTotal = formatStorageSize(totalMb)

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

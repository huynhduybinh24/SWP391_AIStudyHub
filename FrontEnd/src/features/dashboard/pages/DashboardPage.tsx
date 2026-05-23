import { useState, useEffect } from 'react'
import { LoadingOverlay } from '@/components/feedback/LoadingOverlay'
import { ErrorState } from '@/components/feedback/ErrorState'
import { WelcomeBanner } from '@/features/dashboard/components/WelcomeBanner'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import { StorageWidget } from '@/features/dashboard/components/StorageWidget'
import { RecentDocuments } from '@/features/dashboard/components/RecentDocuments'
import { QuickAskCard } from '@/features/dashboard/components/QuickAskCard'
import { WeeklyActivityChart } from '@/features/dashboard/components/WeeklyActivityChart'
import { RecentAlerts } from '@/features/dashboard/components/RecentAlerts'
import { useDashboard } from '@/features/dashboard/hooks/useDashboard'
import { CreateStudyPlanModal } from '@/features/study-plans/pages/CreateStudyPlanModal'
import { useTranslation } from '@/context/LanguageContext'

export function DashboardPage() {
  const { t } = useTranslation()
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const { data, isLoading, isError, error, refetch } = useDashboard()

  useEffect(() => {
    let lastRefetch = 0
    const handleUpdate = () => {
      const now = Date.now()
      // Limit refetching to once every 5 seconds to keep it high performance
      if (now - lastRefetch > 5000) {
        lastRefetch = now
        refetch()
      }
    }
    window.addEventListener('study-time-updated', handleUpdate)
    return () => window.removeEventListener('study-time-updated', handleUpdate)
  }, [refetch])

  if (isLoading) return <LoadingOverlay label={t.common.loading} />
  if (isError || !data) {
    return (
      <ErrorState
        message={error?.message ?? t.common.error}
        onRetry={() => refetch()}
      />
    )
  }


  return (
    <div className="space-y-6">
      <WelcomeBanner
        pendingPlans={data.pendingPlans}
        newSharedDocuments={data.newSharedDocuments}
        onNewPlanClick={() => setIsCreatePlanModalOpen(true)}
      />

      <div className="grid grid-cols-12 gap-6">
        <QuickActions />
        <StorageWidget usedGb={data.storageUsedGb} totalGb={data.storageTotalGb} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <RecentDocuments documents={data.documents} />
        <QuickAskCard />
        <WeeklyActivityChart
          data={data.weeklyActivity}
          totalHours={data.weeklyHours}
          trend={data.weeklyTrend}
        />
        <RecentAlerts alerts={data.alerts} />
      </div>

      <CreateStudyPlanModal
        isOpen={isCreatePlanModalOpen}
        onClose={() => setIsCreatePlanModalOpen(false)}
      />
    </div>
  )
}


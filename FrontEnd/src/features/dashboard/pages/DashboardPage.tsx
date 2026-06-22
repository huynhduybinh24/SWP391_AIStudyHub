import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false)
  const { data, isLoading, isError, error, refetch } = useDashboard()

  useEffect(() => {
    const handleUpdate = () => refetch()
    window.addEventListener('aiStudyHubNotificationsUpdated', handleUpdate)
    window.addEventListener('aiStudyHubUserChanged', handleUpdate)
    return () => {
      window.removeEventListener('aiStudyHubNotificationsUpdated', handleUpdate)
      window.removeEventListener('aiStudyHubUserChanged', handleUpdate)
    }
  }, [refetch])

  if (user?.role?.toLowerCase() === 'admin') {
    return <Navigate to="/dashboard/admin" replace />
  }

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
        <StorageWidget usedMb={data.storageUsedMb} totalMb={data.storageTotalMb} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <RecentDocuments documents={data.documents} />
        <QuickAskCard />
        <WeeklyActivityChart
          data={data.weeklyActivity.map((item, idx) => ({
            ...item,
            day: (t.dashboard.weekdays && t.dashboard.weekdays[idx]) || item.day
          }))}
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


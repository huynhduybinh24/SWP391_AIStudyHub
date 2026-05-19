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

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading) return <LoadingOverlay label="Loading dashboard..." />
  if (isError || !data) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load dashboard'}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner
        pendingPlans={data.pendingPlans}
        newSharedDocuments={data.newSharedDocuments}
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
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
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

      {user?.role?.toLowerCase() === 'teacher' && user?.plan !== 'pro' && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_50%)]" />
          <div className="relative z-10 space-y-1">
            <h3 className="text-xl font-bold">
              {language === 'vi'
                ? 'Đăng ký tài khoản Giáo viên thành công!'
                : (language === 'ja' ? 'æ•™å“¡ã‚¢ã‚«ã‚¦ãƒ³ãƒˆã ®ç™»éŒ²ã Œå®Œäº†ã —ã ¾ã —ã Ÿï¼ ' : (language === 'ko' ? 'êµ ì‚¬ ê³„ì • ê°€ìž… ì„±ê³µ!' : 'Teacher Registration Successful!'))}
            </h3>
            <p className="text-sm text-blue-100 font-medium">
              {language === 'vi'
                ? 'Hãy gửi liên hệ hợp tác để được hệ thống nâng cấp lên tài khoản PRO (50 GB dung lượng) miễn phí!'
                : (language === 'ja' ? 'ç„¡æ–™ã ®PROã‚¢ã‚«ã‚¦ãƒ³ãƒˆï¼ˆå®¹é‡ 50GBï¼‰ã «ã‚¢ãƒƒãƒ—ã‚°ãƒ¬ãƒ¼ãƒ‰ã ™ã‚‹ã Ÿã‚ ã ®æ  æ ºãƒªã‚¯ã‚¨ã‚¹ãƒˆã‚’é€ ä¿¡ã —ã ¦ã  ã  ã •ã „ã€‚' : (language === 'ko' ? 'ë¬´ë£Œ PRO ê³„ì •(50GB ìš©ëŸ‰)ìœ¼ë¡œ ì—…ê·¸ë ˆì ´ë“œí•˜ê¸° ìœ„í•´ íŒŒíŠ¸ë„ˆì‹­ ìš”ì²­ì „ ë³´ë‚´ì£¼ì„¸ìš”.' : 'Submit a partnership request to get upgraded to a PRO account (50 GB storage) for free!'))}
            </p>
          </div>
          <Link
            to="/partnership"
            className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-2xl text-sm font-extrabold shadow-md active:scale-95 transition-all select-none cursor-pointer"
          >
            {language === 'vi'
              ? 'Gửi yêu cầu Hợp tác'
              : (language === 'ja' ? 'æ  æ ºãƒªã‚¯ã‚¨ã‚¹ãƒˆã‚’é€ ä¿¡' : (language === 'ko' ? 'íŒŒíŠ¸ë„ˆì‹­ ì‹ ì²­í•˜ê¸°' : 'Submit Partnership Request'))}
          </Link>
        </div>
      )}

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


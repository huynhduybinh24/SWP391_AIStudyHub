import { useState } from 'react'
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
                : (language === 'ja' ? '教員アカウントの登録が完了しました！' : (language === 'ko' ? '교사 계정 가입 성공!' : 'Teacher Registration Successful!'))}
            </h3>
            <p className="text-sm text-blue-100 font-medium">
              {language === 'vi' 
                ? 'Hãy gửi liên hệ hợp tác để được hệ thống nâng cấp lên tài khoản PRO (50 GB dung lượng) miễn phí!' 
                : (language === 'ja' ? '無料のPROアカウント（容量50GB）にアップグレードするための提携リクエストを送信してください。' : (language === 'ko' ? '무료 PRO 계정(50GB 용량)으로 업그레이드하기 위해 파트너십 요청을 보내주세요.' : 'Submit a partnership request to get upgraded to a PRO account (50 GB storage) for free!'))}
            </p>
          </div>
          <Link
            to="/partnership"
            className="relative z-10 shrink-0 inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-2xl text-sm font-extrabold shadow-md active:scale-95 transition-all select-none cursor-pointer"
          >
            {language === 'vi' 
              ? 'Gửi yêu cầu Hợp tác' 
              : (language === 'ja' ? '提携リクエストを送信' : (language === 'ko' ? '파트너십 신청하기' : 'Submit Partnership Request'))}
          </Link>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <QuickActions />
        <StorageWidget usedGb={data.storageUsedGb} totalGb={data.storageTotalGb} />
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


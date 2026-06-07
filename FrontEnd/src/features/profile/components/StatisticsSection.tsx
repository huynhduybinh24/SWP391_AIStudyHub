import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Sparkles, Share2, Cloud } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { StatisticsCard, StatisticItem } from './StatisticsCard'
import { StatisticsDetailModal } from './StatisticsDetailModal'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { formatStorageSize } from '@/utils/storageFormat'

export function StatisticsSection() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)

  const totalMb = getStorageLimitByPlan(user?.plan)
  const usedMb = user?.plan === 'pro' 
    ? 2457.6 
    : (user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')
      ? 8192
      : 8

  // Localized statistics values recalculated on language change
  const statistics = useMemo<StatisticItem[]>(() => [
    {
      id: 'studyPlans',
      label: t.profile.studyPlansLabel,
      value: 12,
      description: t.profile.studyPlansDesc,
      route: '/study-plans',
    },
    {
      id: 'aiSummaries',
      label: t.profile.aiSummariesLabel,
      value: 86,
      description: t.profile.aiSummariesDesc,
      route: '/ai-summaries',
    },
    {
      id: 'sharedFiles',
      label: t.profile.sharedFilesLabel,
      value: 24,
      description: t.profile.sharedFilesDesc,
      route: '/shared-files',
    },
    {
      id: 'storageUsed',
      label: t.profile.storageUsedLabel,
      value: formatStorageSize(usedMb),
      description: language === 'vi' 
        ? `Đã dùng trên ${formatStorageSize(totalMb)}` 
        : `Used of ${formatStorageSize(totalMb)}`,
      route: '/cloud-storage',
    },
  ], [t, language, usedMb, totalMb])

  const [selectedStatistic, setSelectedStatistic] = useState<StatisticItem | null>(null)
  const [statisticDetailOpen, setStatisticDetailOpen] = useState(false)

  // Safe Router Redirection Mapper to prevent 404/redirect to root page
  const routeMapper = (route: string) => {
    switch (route) {
      case '/study-plans':
        return '/dashboard/study-plans'
      case '/ai-summaries':
        return '/dashboard/documents'
      case '/shared-files':
        return '/dashboard/shared'
      case '/cloud-storage':
        return '/dashboard/storage'
      default:
        return '/dashboard'
    }
  }

  const getToastMessage = (id: string, label: string) => {
    switch (id) {
      case 'studyPlans':
        return t.profile.openingToast(t.profile.studyPlansLabel)
      case 'aiSummaries':
        return t.profile.openingToast(t.profile.aiSummariesLabel)
      case 'sharedFiles':
        return t.profile.openingToast(t.profile.sharedFilesLabel)
      case 'storageUsed':
        return t.profile.openingToast(t.profile.storageUsedLabel)
      default:
        return t.profile.openingToast(label)
    }
  }

  const handleCardClick = (item: StatisticItem) => {
    const toastMsg = getToastMessage(item.id, item.label)
    toast.success(toastMsg)
    navigate(routeMapper(item.route))
  }

  const handleViewDetails = (item: StatisticItem) => {
    setSelectedStatistic(item)
    setStatisticDetailOpen(true)
  }

  const handleModalNavigate = (route: string, id: string, label: string) => {
    const toastMsg = getToastMessage(id, label)
    toast.success(toastMsg)
    setStatisticDetailOpen(false)
    navigate(routeMapper(route))
  }

  const getIcon = (id: string) => {
    switch (id) {
      case 'studyPlans':
        return CalendarDays
      case 'aiSummaries':
        return Sparkles
      case 'sharedFiles':
        return Share2
      case 'storageUsed':
        return Cloud
      default:
        return Sparkles
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statistics.map((item) => (
          <StatisticsCard
            key={item.id}
            item={item}
            icon={getIcon(item.id)}
            onClick={() => handleCardClick(item)}
            onViewDetails={() => handleViewDetails(item)}
          />
        ))}
      </div>

      {/* Statistics Detail Modal */}
      <StatisticsDetailModal
        isOpen={statisticDetailOpen}
        onClose={() => {
          setStatisticDetailOpen(false)
          setSelectedStatistic(null)
        }}
        item={selectedStatistic}
        onNavigate={handleModalNavigate}
      />
    </div>
  )
}
export default StatisticsSection

import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Sparkles, Share2, Cloud, Users, ShieldAlert, ClipboardList, HardDrive } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { StatisticsCard, StatisticItem } from './StatisticsCard'
import { StatisticsDetailModal } from './StatisticsDetailModal'
import { useTranslation } from '@/context/LanguageContext'
import { getCurrentUserStorageSummary } from '@/services/storageService'
import { formatStorageSize } from '@/utils/storageFormat'
import { useAuthStore } from '@/stores/authStore'
import { adminService } from '@/features/admin/services/adminService'

export function StatisticsSection() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role?.toLowerCase() === 'admin'

  // Use shared helper so all pages stay in sync
  const [storageSummary, setStorageSummary] = useState(() => getCurrentUserStorageSummary())
  const [adminStats, setAdminStats] = useState<any>(null)

  useEffect(() => {
    const refresh = () => setStorageSummary(getCurrentUserStorageSummary())
    window.addEventListener('aiStudyHubUserChanged', refresh)
    return () => window.removeEventListener('aiStudyHubUserChanged', refresh)
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    const fetchStats = async () => {
      try {
        const stats = await adminService.getAdminStats()
        if (active) {
          setAdminStats(stats)
        }
      } catch (e) {
        console.error('Failed to load admin stats for profile page:', e)
      }
    }
    fetchStats()
    return () => { active = false }
  }, [isAdmin])

  const { usedMb, totalMb } = storageSummary

  // Localized statistics values recalculated on language change
  const statistics = useMemo<StatisticItem[]>(() => {
    if (isAdmin) {
      const stats = adminStats || {
        totalUsers: 142,
        flaggedDocuments: 8,
        pendingDocuments: 3,
        storageUsedGB: 12.4,
        storageLimitGB: 500
      }
      return [
        {
          id: 'adminUsers',
          label: language === 'vi' ? 'Tổng người dùng' : 'Total Users',
          value: stats.totalUsers,
          description: language === 'vi' ? 'Người dùng đã đăng ký' : 'Registered users',
          route: '/admin/users',
        },
        {
          id: 'adminPendingDocs',
          label: language === 'vi' ? 'Tài liệu chờ duyệt' : 'Pending Documents',
          value: stats.pendingDocuments,
          description: language === 'vi' ? 'Cần phê duyệt thủ công' : 'Require manual approval',
          route: '/admin/documents',
        },
        {
          id: 'adminFlaggedDocs',
          label: language === 'vi' ? 'Tài liệu bị gắn cờ' : 'Flagged Documents',
          value: stats.flaggedDocuments,
          description: language === 'vi' ? 'Vi phạm tiêu chuẩn' : 'Content violations',
          route: '/admin/documents',
        },
        {
          id: 'adminStorage',
          label: language === 'vi' ? 'Lưu trữ hệ thống' : 'System Storage',
          value: `${stats.storageUsedGB} GB`,
          description: language === 'vi' 
            ? `Đã dùng trên ${stats.storageLimitGB} GB` 
            : `Used of ${stats.storageLimitGB} GB`,
          route: '/admin/storage',
        }
      ]
    }

    return [
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
    ]
  }, [t, language, usedMb, totalMb, isAdmin, adminStats])

  const [selectedStatistic, setSelectedStatistic] = useState<StatisticItem | null>(null)
  const [statisticDetailOpen, setStatisticDetailOpen] = useState(false)

  // Safe Router Redirection Mapper to prevent 404/redirect to root page
  const routeMapper = (route: string) => {
    if (isAdmin) {
      return '/dashboard/admin'
    }
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
    if (isAdmin) {
      return language === 'vi'
        ? `Đang chuyển tới trang Quản lý (${label})`
        : `Opening Management Page (${label})`
    }
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
    if (isAdmin) {
      toast.success(getToastMessage(item.id, item.label))
      navigate(routeMapper(item.route))
      return
    }
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
      case 'adminUsers':
        return Users
      case 'adminPendingDocs':
        return ClipboardList
      case 'adminFlaggedDocs':
        return ShieldAlert
      case 'adminStorage':
        return HardDrive
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

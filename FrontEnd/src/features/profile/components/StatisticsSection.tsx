import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Sparkles, Share2, Cloud } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { StatisticsCard, StatisticItem } from './StatisticsCard'
import { StatisticsDetailModal } from './StatisticsDetailModal'

const defaultStatistics: StatisticItem[] = [
  {
    id: 'studyPlans',
    label: 'Study Plans',
    value: 12,
    description: 'Active study plans',
    route: '/study-plans',
  },
  {
    id: 'aiSummaries',
    label: 'AI Summaries',
    value: 86,
    description: 'Generated summaries',
    route: '/ai-summaries',
  },
  {
    id: 'sharedFiles',
    label: 'Shared Files',
    value: 24,
    description: 'Files shared with others',
    route: '/shared-files',
  },
  {
    id: 'storageUsed',
    label: 'Storage Used',
    value: '18GB',
    description: 'Used of 50GB',
    route: '/cloud-storage',
  },
]

export function StatisticsSection() {
  const navigate = useNavigate()
  const toast = useToast()

  // State Management according to specification
  const [statistics] = useState<StatisticItem[]>(defaultStatistics)
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

  const getToastMessage = (label: string) => {
    switch (label) {
      case 'Study Plans':
        return 'Opening Study Plans'
      case 'AI Summaries':
        return 'Opening AI Summaries'
      case 'Shared Files':
        return 'Opening Shared Files'
      case 'Storage Used':
        return 'Opening Cloud Storage'
      default:
        return `Opening ${label}`
    }
  }

  const handleCardClick = (item: StatisticItem) => {
    const toastMsg = getToastMessage(item.label)
    toast.success(toastMsg)
    navigate(routeMapper(item.route))
  }

  const handleViewDetails = (item: StatisticItem) => {
    setSelectedStatistic(item)
    setStatisticDetailOpen(true)
  }

  const handleModalNavigate = (route: string, label: string) => {
    const toastMsg = getToastMessage(label)
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

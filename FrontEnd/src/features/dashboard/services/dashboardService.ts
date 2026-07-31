import type { DashboardData, AlertItem } from '@/features/dashboard/types'
import { getCurrentWeekDays, getTrackedSeconds, addTrackedSeconds, formatDateLocal } from '../utils/studyTime'
import { useAuthStore } from '@/stores/authStore'
import { storageService } from '@/services/storageService'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { documentService } from '@/services/documentService'
import { userNotificationService } from '@/features/notifications/services/userNotificationService'

function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const now = new Date()
    
    // check if today
    if (d.toDateString() === now.toDateString()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    
    // check if yesterday
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    // otherwise short date
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (e) {
    return dateStr
  }
}

function detectType(fileName: string, mimeType: string): 'pdf' | 'word' | 'image' {
  const nameLower = (fileName || '').toLowerCase()
  const mimeLower = (mimeType || '').toLowerCase()
  
  if (nameLower.endsWith('.pdf') || mimeLower === 'application/pdf') {
    return 'pdf'
  }
  
  if (
    nameLower.endsWith('.docx') ||
    nameLower.endsWith('.doc') ||
    mimeLower.startsWith('application/msword') ||
    mimeLower === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'word'
  }
  
  if (
    nameLower.endsWith('.png') ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.gif') ||
    nameLower.endsWith('.webp') ||
    mimeLower.startsWith('image/')
  ) {
    return 'image'
  }
  
  return 'pdf'
}

const MOCK_DASHBOARD: DashboardData = {
  pendingPlans: 3,
  newSharedDocuments: 2,
  storageUsedMb: 75 * 1024,
  storageTotalMb: 100 * 1024,
  weeklyHours: 14,
  weeklyTrend: '+2 hrs',
  documents: [],
  alerts: [],
  weeklyActivity: [
    { day: 'M', hours: 2 },
    { day: 'T', hours: 3 },
    { day: 'W', hours: 5 },
    { day: 'T', hours: 1.5 },
    { day: 'F', hours: 2 },
    { day: 'S', hours: 0.5 },
    { day: 'S', hours: 0 },
  ],
}

export const dashboardService = {
  async getDashboard(): Promise<DashboardData> {
    const weekDays = getCurrentWeekDays()
    const todayStr = formatDateLocal(new Date())

    const dynamicActivity = weekDays.map((day) => {
      const mockDay = MOCK_DASHBOARD.weeklyActivity[day.index]
      const mockHours = mockDay ? mockDay.hours : 0
      let seconds = getTrackedSeconds(day.dateStr)

      if (seconds === 0) {
        if (day.dateStr <= todayStr) {
          seconds = addTrackedSeconds(day.dateStr, mockHours * 3600)
        }
      }

      const hours = seconds / 3600
      return {
        day: day.label,
        hours: Number(hours.toFixed(2)),
        dateStr: day.dateStr,
      }
    })

    const totalWeeklyHours = dynamicActivity.reduce((acc, curr) => acc + curr.hours, 0)
    const formattedTotalWeeklyHours = Number(totalWeeklyHours.toFixed(1))

    const diff = formattedTotalWeeklyHours - 12
    const weeklyTrend = diff >= 0 ? `+${diff.toFixed(1)} hrs` : `-${Math.abs(diff).toFixed(1)} hrs`

    const user = useAuthStore.getState().user
    let storageTotalMb = getStorageLimitByPlan(user?.plan)
    let storageUsedMb = 0
    let documents: DashboardData["documents"] = []
    let alerts: AlertItem[] = []

    if (user?.id) {
      const [storageRes, docsRes, notifsRes] = await Promise.allSettled([
        storageService.getStorageUsage(Number(user.id)),
        documentService.getAllDocuments(Number(user.id)),
        userNotificationService.getNotifications(user)
      ])

      if (storageRes.status === 'fulfilled' && storageRes.value) {
        storageUsedMb = storageRes.value.storageUsedMb
        storageTotalMb = Math.max(
          storageRes.value.storageLimitMb || 0,
          user?.storageLimitMb || 0,
          getStorageLimitByPlan(user?.plan)
        )
      }

      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
        const sortedDocs = [...docsRes.value].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        const latestDocs = sortedDocs.slice(0, 3)
        documents = latestDocs.map((doc) => ({
          id: String(doc.id),
          name: doc.originalFileName || doc.title,
          course: doc.subject || "General",
          timestamp: formatTimestamp(doc.createdAt),
          type: detectType(doc.fileName || doc.originalFileName || '', doc.mimeType || '')
        }))
      }

      if (notifsRes.status === 'fulfilled' && Array.isArray(notifsRes.value)) {
        const sortedNotifs = [...notifsRes.value].sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        const latestNotifs = sortedNotifs.slice(0, 4)
        alerts = latestNotifs.map((n) => {
          let variant: AlertItem['variant'] = 'info'
          switch (n.type) {
            case 'document_approved':
              variant = 'success'
              break
            case 'document_rejected':
            case 'document_deleted':
              variant = 'warning'
              break
            case 'shared_file':
              variant = 'success'
              break
            case 'ai_update':
              variant = 'neutral'
              break
            case 'system':
              variant = 'info'
              break
            default:
              variant = 'info'
          }
          return {
            id: n.id,
            title: n.title || n.message,
            time: n.time || formatTimestamp(n.createdAt),
            variant
          }
        })
      }
    }

    return {
      ...MOCK_DASHBOARD,
      documents,
      alerts,
      storageUsedMb,
      storageTotalMb,
      weeklyHours: formattedTotalWeeklyHours,
      weeklyTrend,
      weeklyActivity: dynamicActivity,
    }
  },
}



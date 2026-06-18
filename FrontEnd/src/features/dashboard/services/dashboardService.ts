import type { DashboardData } from '@/features/dashboard/types'
import { getCurrentWeekDays, getTrackedSeconds, addTrackedSeconds, formatDateLocal } from '../utils/studyTime'
import { useAuthStore } from '@/stores/authStore'
import { storageService } from '@/services/storageService'
import { getStorageLimitByPlan } from '@/constants/storagePlans'
import { documentService } from '@/services/documentService'

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
  alerts: [
    { id: '1', title: "Study Plan 'Finals Week' starts tomorrow", time: '2h ago', variant: 'info' },
    { id: '2', title: 'Dr. Smith shared "Midterm Review.pdf"', time: '5h ago', variant: 'success' },
    { id: '3', title: 'Storage is 75% full', time: '1d ago', variant: 'warning' },
    { id: '4', title: 'AI summarized your latest upload', time: '2d ago', variant: 'neutral' },
  ],
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
    await new Promise((r) => setTimeout(r, 300))

    const weekDays = getCurrentWeekDays()
    const todayStr = formatDateLocal(new Date())

    const dynamicActivity = weekDays.map((day) => {
      // Find default mock hours for this day of the week
      const mockDay = MOCK_DASHBOARD.weeklyActivity[day.index]
      const mockHours = mockDay ? mockDay.hours : 0

      // Read current tracked seconds from localStorage
      let seconds = getTrackedSeconds(day.dateStr)

      // If no tracked time exists yet
      if (seconds === 0) {
        // Only initialize past days or today to make the dashboard look populated and natural
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

    // Calculate total hours for this week
    const totalWeeklyHours = dynamicActivity.reduce((acc, curr) => acc + curr.hours, 0)
    const formattedTotalWeeklyHours = Number(totalWeeklyHours.toFixed(1))

    // Calculate dynamic trend (compared to baseline of 12 hours)
    const diff = formattedTotalWeeklyHours - 12
    const weeklyTrend = diff >= 0 ? `+${diff.toFixed(1)} hrs` : `-${Math.abs(diff).toFixed(1)} hrs`

    const user = useAuthStore.getState().user
    let storageTotalMb = getStorageLimitByPlan(user?.plan)
    let storageUsedMb = user?.plan === 'pro' 
      ? 2457.6 
      : (user?.plan === 'premium' || user?.plan === 'institutional' || user?.plan === 'enterprise')
        ? 8192
        : 8

    if (user?.id) {
      try {
        const usage = await storageService.getStorageUsage(Number(user.id))
        storageUsedMb = usage.storageUsedMb
        storageTotalMb = usage.storageLimitMb
      } catch (e) {
        console.error('Failed to fetch storage usage for dashboard:', e)
      }
    }

    let documents: DashboardData["documents"] = []
    if (user?.id) {
      try {
        const backendDocs = await documentService.getAllDocuments(Number(user.id))
        const sortedDocs = [...backendDocs].sort((a, b) => {
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
      } catch (e) {
        console.error('Failed to fetch user documents for dashboard:', e)
      }
    }

    // Update alert contents dynamically for storage
    const dynamicAlerts = MOCK_DASHBOARD.alerts.map(alert => {
      if (alert.id === '3') {
        const percentage = Math.round((storageUsedMb / storageTotalMb) * 100)
        return { ...alert, title: `Storage is ${percentage}% full` }
      }
      return alert
    })

    return {
      ...MOCK_DASHBOARD,
      documents,
      storageUsedMb,
      storageTotalMb,
      alerts: dynamicAlerts,
      weeklyHours: formattedTotalWeeklyHours,
      weeklyTrend,
      weeklyActivity: dynamicActivity,
    }
  },
}


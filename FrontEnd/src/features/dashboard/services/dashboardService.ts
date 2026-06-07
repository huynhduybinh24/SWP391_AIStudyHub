import type { DashboardData } from '@/features/dashboard/types'
import { getCurrentWeekDays, getTrackedSeconds, addTrackedSeconds, formatDateLocal } from '../utils/studyTime'
import { useAuthStore } from '@/stores/authStore'
import { env } from '@/config/env'
import { storageService } from '@/services/storageService'
import { getStorageLimitByPlan } from '@/constants/storagePlans'

const MOCK_DASHBOARD: DashboardData = {
  pendingPlans: 3,
  newSharedDocuments: 2,
  storageUsedMb: 75 * 1024,
  storageTotalMb: 100 * 1024,
  weeklyHours: 14,
  weeklyTrend: '+2 hrs',
  documents: [
    { id: '1', name: 'Lecture_Notes_Week5.pdf', course: 'CS401', timestamp: 'Today, 10:30 AM', type: 'pdf' },
    { id: '2', name: 'Essay_Draft_v2.docx', course: 'ECON202', timestamp: 'Yesterday', type: 'word' },
    { id: '3', name: 'Diagram_Flow.png', course: 'CS401', timestamp: 'Oct 12', type: 'image' },
  ],
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
      storageUsedMb,
      storageTotalMb,
      alerts: dynamicAlerts,
      weeklyHours: formattedTotalWeeklyHours,
      weeklyTrend,
      weeklyActivity: dynamicActivity,
    }
  },
}


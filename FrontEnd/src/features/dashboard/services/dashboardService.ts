import type { DashboardData } from '@/features/dashboard/types'

const MOCK_DASHBOARD: DashboardData = {
  pendingPlans: 3,
  newSharedDocuments: 2,
  storageUsedGb: 75,
  storageTotalGb: 100,
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
    return MOCK_DASHBOARD
  },
}

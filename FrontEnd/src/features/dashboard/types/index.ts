export interface DocumentItem {
  id: string
  name: string
  course: string
  timestamp: string
  type: 'pdf' | 'word' | 'image'
}

export interface AlertItem {
  id: string
  title: string
  time: string
  variant: 'info' | 'success' | 'warning' | 'neutral'
}

export interface WeeklyActivityDay {
  day: string
  hours: number
}

export interface DashboardData {
  pendingPlans: number
  newSharedDocuments: number
  storageUsedGb: number
  storageTotalGb: number
  weeklyHours: number
  weeklyTrend: string
  documents: DocumentItem[]
  alerts: AlertItem[]
  weeklyActivity: WeeklyActivityDay[]
}

// Removed useAuthStore import to prevent circular dependency

export interface SystemLog {
  id: string
  eventKey?: string
  category: 'security' | 'subscription' | 'ai-audit' | 'moderation'
  performer: string
  performerEmail: string
  timestamp: string
  detailsKey?: string
  status: 'success' | 'warning' | 'failed'
  eventTextEn?: string
  eventTextVi?: string
  detailsTextEn?: string
  detailsTextVi?: string
  userId?: string
}

const LOGS_STORAGE_KEY = 'ai_study_hub_realtime_activity_logs'
const LOGOUT_TIMES_KEY = 'ai_study_hub_user_logout_times'

const getCurrentUserFromStorage = () => {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('aiStudyHubCurrentUser')
    return stored ? JSON.parse(stored) : null
  } catch (e) {
    return null
  }
}


const SEED_LOGS: SystemLog[] = [
  {
    id: 'log-1',
    eventKey: 'passwordRestored',
    category: 'security',
    performer: 'Admin User',
    performerEmail: 'admin@example.com',
    timestamp: '2026-05-26 12:45',
    detailsKey: 'passwordRestored',
    status: 'success',
  },
  {
    id: 'log-2',
    eventKey: 'aiScanViolationDetected',
    category: 'ai-audit',
    performer: 'AI Guard System',
    performerEmail: 'system@lumiedu.vn',
    timestamp: '2026-05-26 11:20',
    detailsKey: 'aiScanViolationDetected',
    status: 'warning',
  },
  {
    id: 'log-3',
    eventKey: 'userAccountLocked',
    category: 'security',
    performer: 'Admin User',
    performerEmail: 'admin@example.com',
    timestamp: '2026-05-26 10:15',
    detailsKey: 'userAccountLocked',
    status: 'success',
  },
  {
    id: 'log-4',
    eventKey: 'accountPackageUpgraded',
    category: 'subscription',
    performer: 'Ngoc Tan',
    performerEmail: 'tan@example.com',
    timestamp: '2026-05-25 18:32',
    detailsKey: 'accountPackageUpgraded',
    status: 'success',
  },
  {
    id: 'log-5',
    eventKey: 'documentApproved',
    category: 'moderation',
    performer: 'Admin User',
    performerEmail: 'admin@example.com',
    timestamp: '2026-05-25 14:02',
    detailsKey: 'documentApproved',
    status: 'success',
  },
  {
    id: 'log-6',
    eventKey: 'systemNotificationBroadcast',
    category: 'moderation',
    performer: 'Admin User',
    performerEmail: 'admin@example.com',
    timestamp: '2026-05-24 10:15',
    detailsKey: 'systemNotificationBroadcast',
    status: 'success',
  },
  {
    id: 'log-7',
    eventKey: 'paymentTransactionFailed',
    category: 'subscription',
    performer: 'Sarah Jenkins',
    performerEmail: 'sarah.j@school.edu',
    timestamp: '2026-05-23 09:44',
    detailsKey: 'paymentTransactionFailed',
    status: 'failed',
  },
]

export const getLogs = (): SystemLog[] => {
  if (typeof window === 'undefined') return SEED_LOGS
  try {
    const stored = localStorage.getItem(LOGS_STORAGE_KEY)
    let logs: SystemLog[] = []
    if (stored) {
      logs = JSON.parse(stored) as SystemLog[]
    } else {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(SEED_LOGS))
      logs = SEED_LOGS
    }
    
    // Lọc bỏ tất cả logs của admin (cả log có sẵn và log lưu trong localStorage)
    return logs.filter(log => {
      const email = log.performerEmail?.toLowerCase()
      const name = log.performer?.toLowerCase()
      const isSystem = email === 'system@lumiedu.vn'
      
      if (isSystem) return true
      
      const isAdminEmail = email?.includes('admin') || email === 'huynhduybinh242k5@gmail.com'
      const isAdminName = name?.includes('admin')
      
      return !(isAdminEmail || isAdminName)
    })
  } catch (e) {
    console.error('Failed to parse activity logs', e)
    return SEED_LOGS
  }
}

export const saveLogs = (logs: SystemLog[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs))
    window.dispatchEvent(new Event('aiStudyHubLogsUpdated'))
  } catch (e) {
    console.error('Failed to save activity logs', e)
  }
}

const formatTimestamp = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

export const logActivity = (params: {
  eventKey?: string
  category: 'security' | 'subscription' | 'ai-audit' | 'moderation'
  status: 'success' | 'warning' | 'failed'
  detailsKey?: string
  eventTextEn?: string
  eventTextVi?: string
  detailsTextEn?: string
  detailsTextVi?: string
}) => {
  try {
    const user = getCurrentUserFromStorage()
    // Không ghi nhận log hoạt động mới của Admin
    if (user?.role?.toLowerCase() === 'admin') {
      return
    }

    const performer = user?.name || 'Anonymous User'
    const performerEmail = user?.email || 'anonymous@lumiedu.vn'
    const userId = user?.id || 'anonymous'

    const newLog: SystemLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventKey: params.eventKey,
      category: params.category,
      performer,
      performerEmail,
      timestamp: formatTimestamp(new Date()),
      detailsKey: params.detailsKey,
      status: params.status,
      eventTextEn: params.eventTextEn,
      eventTextVi: params.eventTextVi,
      detailsTextEn: params.detailsTextEn,
      detailsTextVi: params.detailsTextVi,
      userId
    }

    const currentLogs = getLogs()
    saveLogs([newLog, ...currentLogs])
  } catch (e) {
    console.error('Failed to log activity:', e)
  }
}

export const recordLogoutTime = (emailOrId: string) => {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(LOGOUT_TIMES_KEY)
    const logoutTimes = stored ? JSON.parse(stored) : {}
    logoutTimes[emailOrId] = Date.now()
    localStorage.setItem(LOGOUT_TIMES_KEY, JSON.stringify(logoutTimes))
  } catch (e) {
    console.error('Failed to record logout time:', e)
  }
}

export const cancelLogoutTime = (emailOrId: string) => {
  if (typeof window === 'undefined') return
  try {
    const stored = localStorage.getItem(LOGOUT_TIMES_KEY)
    if (!stored) return
    const logoutTimes = JSON.parse(stored)
    if (logoutTimes[emailOrId]) {
      delete logoutTimes[emailOrId]
      localStorage.setItem(LOGOUT_TIMES_KEY, JSON.stringify(logoutTimes))
    }
  } catch (e) {
    console.error('Failed to cancel logout time:', e)
  }
}

export const checkAndPurgeExpiredLogs = () => {
  if (typeof window === 'undefined') return
  try {
    const logoutTimesStr = localStorage.getItem(LOGOUT_TIMES_KEY)
    if (!logoutTimesStr) return
    const logoutTimes = JSON.parse(logoutTimesStr)

    const now = Date.now()
    const ONE_HOUR = 60 * 60 * 1000 // 1 hour
    let logsChanged = false
    let logoutTimesChanged = false

    let logs = getLogs()

    for (const [emailOrId, logoutTime] of Object.entries(logoutTimes)) {
      if (now - (logoutTime as number) >= ONE_HOUR) {
        const beforeCount = logs.length
        logs = logs.filter(
          (log) =>
            log.userId !== emailOrId &&
            log.performerEmail?.toLowerCase() !== emailOrId.toLowerCase()
        )
        if (logs.length !== beforeCount) {
          logsChanged = true
        }
        delete logoutTimes[emailOrId]
        logoutTimesChanged = true
      }
    }

    if (logsChanged) {
      saveLogs(logs)
    }
    if (logoutTimesChanged) {
      localStorage.setItem(LOGOUT_TIMES_KEY, JSON.stringify(logoutTimes))
    }
  } catch (e) {
    console.error('Failed to purge expired logs:', e)
  }
}

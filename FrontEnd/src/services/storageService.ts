import { apiClient } from '@/lib/axios'
import { getStorageLimitByPlan } from '@/constants/storagePlans'

// ─── Storage Summary Helper ─────────────────────────────────────────────────
// Source of truth for personal storage values across all dashboard pages.
// Free = 1 GB / 8.3 MB used   |   Pro = 5 GB / 2.4 GB used   |   Premium = 50 GB / 8 GB used

export interface StorageSummary {
  plan: string
  totalMb: number
  usedMb: number
  remainingMb: number
  percentage: number
}

const MOCK_USED_MB: Record<string, number> = {
  free: 8.3,
  pro: 2457.6,
  premium: 8192,
  institutional: 8192,
  enterprise: 8192,
}

export function getCurrentUserStorageSummary(): StorageSummary {
  let plan = 'free'

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('aiStudyHubCurrentUser')
      if (raw) {
        const parsed = JSON.parse(raw)
        plan = (parsed?.plan ?? 'free').toLowerCase()
      }
    } catch (_) {}
  }

  const totalMb = getStorageLimitByPlan(plan)
  const usedMb = MOCK_USED_MB[plan] ?? MOCK_USED_MB.free
  const remainingMb = Math.max(totalMb - usedMb, 0)
  const percentage = Math.min(Math.round((usedMb / totalMb) * 100), 100)

  return { plan, totalMb, usedMb, remainingMb, percentage }
}

export interface StorageUsage {
  userId: number
  storageUsedMb: number
  storageLimitMb: number
  storagePercentage: number
}

export interface StorageAnalytics {
  totalUsedMb: number
  limitMb: number
  totalFiles: number
  categoryBreakdown: Record<string, number>
  snapshots: Array<{
    id: number
    totalUsedMb: number
    limitMb: number
    fileCount: number
    documentCount: number
    mediaCount: number
    otherCount: number
    snapshotDate: string
  }>
}

export interface StorageCleanupScan {
  id: number
  scanType: 'DUPLICATE' | 'LARGE'
  status: string
  filesFound: number
  spaceReclaimedMb: number
  createdAt: string
}

export const storageService = {
  async getStorageUsage(userId: number): Promise<StorageUsage> {
    try {
      const response = await apiClient.get<StorageUsage>(`/storage/usage?userId=${userId}`)
      return response.data
    } catch (e) {
      console.warn("Using mock storage usage fallback", e)
      let limitMb = 1024 // 1GB
      let usedMb = 8
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            limitMb = getStorageLimitByPlan(user.plan)
            usedMb = user.plan === 'pro'
              ? 2457.6
              : (user.plan === 'premium' || user.plan === 'institutional' || user.plan === 'enterprise')
                ? 8192
                : 8
          } catch (err) {}
        }
      }
      return {
        userId,
        storageUsedMb: usedMb,
        storageLimitMb: limitMb,
        storagePercentage: Number(((usedMb / limitMb) * 100).toFixed(1))
      }
    }
  },

  async getStorageAnalytics(userId: number): Promise<StorageAnalytics> {
    try {
      const response = await apiClient.get<StorageAnalytics>(`/storage/analytics?userId=${userId}`)
      return response.data
    } catch (e) {
      console.warn("Using mock storage analytics fallback", e)
      let limitMb = 1024 // 1GB
      let usedMb = 8
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            limitMb = getStorageLimitByPlan(user.plan)
            usedMb = user.plan === 'pro'
              ? 2457.6
              : (user.plan === 'premium' || user.plan === 'institutional' || user.plan === 'enterprise')
                ? 8192
                : 8
          } catch (err) {}
        }
      }
      return {
        totalUsedMb: usedMb,
        limitMb: limitMb,
        totalFiles: 3,
        categoryBreakdown: {
          'Documents': usedMb * 0.6,
          'Media': usedMb * 0.3,
          'Other': usedMb * 0.1
        },
        snapshots: [
          {
            id: 1,
            totalUsedMb: usedMb,
            limitMb: limitMb,
            fileCount: 3,
            documentCount: 2,
            mediaCount: 1,
            otherCount: 0,
            snapshotDate: new Date().toISOString()
          }
        ]
      }
    }
  },

  async getStorageOverview(userId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/storage/overview?userId=${userId}`)
      return response.data
    } catch (e) {
      console.warn("Using mock storage overview fallback", e)
      let limitMb = 1024 // 1GB
      let usedMb = 8
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            limitMb = getStorageLimitByPlan(user.plan)
            usedMb = user.plan === 'pro'
              ? 2457.6
              : (user.plan === 'premium' || user.plan === 'institutional' || user.plan === 'enterprise')
                ? 8192
                : 8
          } catch (err) {}
        }
      }
      return {
        totalUsedMb: usedMb,
        limitMb: limitMb,
        totalFiles: 3,
        categoryBreakdown: { pdf: 5, docx: 2, pptx: 1, other: 0 }
      }
    }
  },

  async getRecentUploads(userId: number): Promise<any[]> {
    try {
      const response = await apiClient.get(`/storage/recent-uploads?userId=${userId}`)
      return response.data
    } catch (e) {
      console.warn("Using mock recent uploads fallback", e)
      return [
        { id: 'd1', name: 'Neuroscience_Syllabus.pdf', sizeMB: 1.2, uploadedAt: '2024-05-18' },
        { id: 'd2', name: 'Study_Schedule.docx', sizeMB: 0.5, uploadedAt: '2024-05-19' }
      ]
    }
  },

  async runDuplicateCleanup(userId: number): Promise<StorageCleanupScan> {
    try {
      const response = await apiClient.post<StorageCleanupScan>(`/storage/cleanup/duplicate?userId=${userId}`)
      return response.data
    } catch (e) {
      console.warn("Using mock duplicate cleanup fallback", e)
      return {
        id: Date.now(),
        scanType: 'DUPLICATE',
        status: 'COMPLETED',
        filesFound: 1,
        spaceReclaimedMb: 2.1,
        createdAt: new Date().toISOString()
      }
    }
  },

  async runLargeCleanup(userId: number, minSizeMb = 10): Promise<StorageCleanupScan> {
    try {
      const response = await apiClient.post<StorageCleanupScan>(`/storage/cleanup/large?userId=${userId}&minSizeMb=${minSizeMb}`)
      return response.data
    } catch (e) {
      console.warn("Using mock large cleanup fallback", e)
      return {
        id: Date.now(),
        scanType: 'LARGE',
        status: 'COMPLETED',
        filesFound: 0,
        spaceReclaimedMb: 0,
        createdAt: new Date().toISOString()
      }
    }
  }
}

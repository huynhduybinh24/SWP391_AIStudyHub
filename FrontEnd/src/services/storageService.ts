import { apiClient } from '@/lib/axios'
import { getStorageLimitByPlan } from '@/constants/storagePlans'

export interface StorageSummary {
  plan: string
  totalMb: number
  usedMb: number
  remainingMb: number
  percentage: number
}

export function getCurrentUserStorageSummary(): StorageSummary {
  let plan = 'free'
  let usedMb = 0

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('aiStudyHubCurrentUser')
      if (raw) {
        const parsed = JSON.parse(raw)
        plan = (parsed?.plan ?? 'free').toLowerCase()
      }
      const storedUsed = localStorage.getItem('aiStudyHubStorageUsedMb')
      if (storedUsed) {
        const parsedUsed = parseFloat(storedUsed)
        // Guard against corrupted/overflow legacy values in localStorage
        if (!isNaN(parsedUsed) && parsedUsed >= 0 && parsedUsed <= 5000) {
          usedMb = parsedUsed
        } else {
          localStorage.removeItem('aiStudyHubStorageUsedMb')
          usedMb = 5.7
        }
      }
    } catch (_) {}
  }

  const totalMb = getStorageLimitByPlan(plan)
  const remainingMb = Math.max(totalMb - usedMb, 0)
  const rawPercentage = (usedMb / totalMb) * 100
  const percentage = usedMb > 0 ? Math.min(Math.max(1, Math.round(rawPercentage)), 100) : 0

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
    const response = await apiClient.get<StorageUsage>(`/storage/usage?userId=${userId}`)
    return response.data
  },

  async getStorageAnalytics(userId: number): Promise<StorageAnalytics> {
    const response = await apiClient.get<StorageAnalytics>(`/storage/analytics?userId=${userId}`)
    return response.data
  },

  async getStorageOverview(userId: number): Promise<any> {
    const response = await apiClient.get(`/storage/overview?userId=${userId}`)
    return response.data
  },

  async getRecentUploads(userId: number): Promise<any[]> {
    const response = await apiClient.get(`/storage/recent-uploads?userId=${userId}`)
    return response.data
  },

  async runDuplicateCleanup(userId: number): Promise<StorageCleanupScan> {
    const response = await apiClient.post<StorageCleanupScan>(`/storage/cleanup/duplicate?userId=${userId}`)
    return response.data
  },

  async runLargeCleanup(userId: number, minSizeMb = 10): Promise<StorageCleanupScan> {
    const response = await apiClient.post<StorageCleanupScan>(`/storage/cleanup/large?userId=${userId}&minSizeMb=${minSizeMb}`)
    return response.data
  }
}

import os

file_path = r"D:\SWP391_AIStudyHub\FrontEnd\src\services\storageService.ts"

code_content = """import { apiClient } from '@/lib/axios'
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
  const usedMb = 0
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
"""

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code_content)

print("Successfully cleaned storageService.ts")

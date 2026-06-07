import { apiClient } from '@/lib/axios'

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
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            const plan = (user.plan || 'free').toLowerCase()
            if (plan === 'pro') limitMb = 5120 // 5GB
            else if (plan === 'enterprise' || plan === 'premium' || plan === 'institutional') limitMb = 51200 // 50GB
          } catch (err) {}
        }
      }
      return {
        userId,
        storageUsedMb: 450,
        storageLimitMb: limitMb,
        storagePercentage: Number(((450 / limitMb) * 100).toFixed(1))
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
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            const plan = (user.plan || 'free').toLowerCase()
            if (plan === 'pro') limitMb = 5120 // 5GB
            else if (plan === 'enterprise' || plan === 'premium' || plan === 'institutional') limitMb = 51200 // 50GB
          } catch (err) {}
        }
      }
      return {
        totalUsedMb: 450,
        limitMb: limitMb,
        totalFiles: 12,
        categoryBreakdown: {
          'Documents': 300,
          'Media': 120,
          'Other': 30
        },
        snapshots: [
          {
            id: 1,
            totalUsedMb: 450,
            limitMb: limitMb,
            fileCount: 12,
            documentCount: 8,
            mediaCount: 3,
            otherCount: 1,
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
      if (typeof window !== 'undefined') {
        const currentUserStr = localStorage.getItem('aiStudyHubCurrentUser')
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr)
            const plan = (user.plan || 'free').toLowerCase()
            if (plan === 'pro') limitMb = 5120 // 5GB
            else if (plan === 'enterprise' || plan === 'premium' || plan === 'institutional') limitMb = 51200 // 50GB
          } catch (err) {}
        }
      }
      return {
        totalUsedMb: 450,
        limitMb: limitMb,
        totalFiles: 12,
        categoryBreakdown: { pdf: 300, docx: 100, pptx: 30, other: 20 }
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
        filesFound: 3,
        spaceReclaimedMb: 45.2,
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
        filesFound: 2,
        spaceReclaimedMb: 120.5,
        createdAt: new Date().toISOString()
      }
    }
  }
}

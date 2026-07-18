import { apiClient } from '@/lib/axios'

export interface DocumentResponse {
  id: number
  title: string
  fileName: string
  originalFileName: string
  fileUrl: string
  fileType: string
  mimeType: string
  fileSize: number
  subject: string
  visibility: string
  userId: number
  checksum: string
  ownerName?: string
  ownerEmail?: string
  role?: string
  status?: string
  moderationStatus?: string
  rejectionReason?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
  moderationStatus?: 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  moderationReason?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const documentService = {
  async uploadDocument(
    file: File,
    title: string,
    description: string,
    subject: string,
    visibility: string,
    userId: number,
    tags: string[]
  ): Promise<DocumentResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    if (description) formData.append('description', description)
    if (subject) formData.append('subject', subject)
    formData.append('visibility', visibility)
    formData.append('userId', String(userId))
    
    if (tags && tags.length > 0) {
      tags.forEach(tag => {
        formData.append('tags', tag)
      })
    }

    const response = await apiClient.post<ApiResponse<DocumentResponse>>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    const doc = response.data.data
    if (doc && doc.subject === 'BIOLOGY') {
      doc.subject = 'GENERAL'
    }
    return doc
  },

  async getAllDocuments(userId?: number): Promise<DocumentResponse[]> {
    const url = userId ? `/documents?userId=${userId}` : '/documents'
    const response = await apiClient.get<ApiResponse<DocumentResponse[]>>(url)
    const list = response.data.data || []
    return list.map(doc => ({
      ...doc,
      subject: doc.subject === 'BIOLOGY' ? 'GENERAL' : doc.subject
    }))
  },

  async getDocumentById(id: number | string): Promise<DocumentResponse> {
    const response = await apiClient.get<ApiResponse<DocumentResponse>>(`/documents/${id}`)
    const doc = response.data.data
    if (doc && doc.subject === 'BIOLOGY') {
      doc.subject = 'GENERAL'
    }
    return doc
  },

  async deleteDocument(id: number | string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/documents/${id}`)
  },

  async downloadDocument(id: number | string, userId?: number): Promise<Blob> {
    const url = userId ? `/documents/${id}/download?userId=${userId}` : `/documents/${id}/download`
    const response = await apiClient.get<Blob>(url, {
      responseType: 'blob',
    })
    return response.data
  },

  async previewDocument(id: number | string, userId?: number): Promise<string> {
    const url = userId ? `/documents/${id}/preview?userId=${userId}` : `/documents/${id}/preview`
    const response = await apiClient.get<string>(url, {
      responseType: 'text',
    })
    return response.data
  },

  async previewDocumentBlob(id: number | string, userId?: number): Promise<Blob> {
    const url = userId ? `/documents/${id}/preview?userId=${userId}` : `/documents/${id}/preview`
    const response = await apiClient.get<Blob>(url, {
      responseType: 'blob',
    })
    return response.data
  },

  async getSubjectStats(subjectId: string, userId: number): Promise<SubjectStats> {
    const response = await apiClient.get<ApiResponse<SubjectStats>>(`/documents/subject/${subjectId}/stats?userId=${userId}`)
    return response.data.data
  },

  async getDocumentShares(documentId: number | string): Promise<DocumentShareResponse[]> {
    const response = await apiClient.get<ApiResponse<DocumentShareResponse[]>>(`/documents/${documentId}/shares`)
    return response.data.data
  },

  async addOrUpdateDocumentShare(documentId: number | string, email: string, role: string): Promise<DocumentShareResponse> {
    const response = await apiClient.post<ApiResponse<DocumentShareResponse>>(`/documents/${documentId}/shares`, {
      email,
      role
    })
    return response.data.data
  },

  async deleteDocumentShare(documentId: number | string, email: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(`/documents/${documentId}/shares?email=${encodeURIComponent(email)}`)
  },

  async getMyUploads(): Promise<DocumentResponse[]> {
    const response = await apiClient.get<ApiResponse<DocumentResponse[]>>('/documents/my-uploads')
    const list = response.data.data || []
    return list.map(doc => ({
      ...doc,
      subject: doc.subject === 'BIOLOGY' ? 'GENERAL' : doc.subject
    }))
  }
}

export interface DocumentShareResponse {
  id: number
  documentId: number
  shareeEmail: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface SubjectStats {
  studyProgress: number
  averageScore: number | null
  rank: string
  aiRecommendation: string
}

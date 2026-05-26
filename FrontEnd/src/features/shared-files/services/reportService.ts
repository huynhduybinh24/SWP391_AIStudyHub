export type ReportReason = 'Plagiarism' | 'Copyright violation' | 'Inappropriate content' | 'Misleading information' | 'Other'
export type ReportStatus = 'pending' | 'reviewed' | 'rejected' | 'removed'

export interface DocumentReport {
  id: string
  documentId: string
  documentName: string
  documentType: string
  sharedBy: string
  sharedByEmail?: string
  reportedBy: string
  reportedByEmail: string
  reason: ReportReason
  description: string
  evidenceLink?: string
  status: ReportStatus
  createdAt: string
  reviewedAt?: string
  adminNote?: string
}

const STORAGE_KEY = 'aiStudyHubDocumentReports'

const defaultMockReports: DocumentReport[] = [
  {
    id: '1',
    documentId: 'file-1',
    documentName: 'Biology 101 Midterm Notes.pdf',
    documentType: 'pdf',
    reason: 'Plagiarism',
    description: 'This document contains copied text from Wikipedia without citation.',
    status: 'pending',
    reportedBy: 'Alex Rivera',
    reportedByEmail: 'alex@example.com',
    sharedBy: 'Sarah Jenkins',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: '2',
    documentId: 'lit-rev-pdf',
    documentName: 'Literature Review.pdf',
    documentType: 'pdf',
    reason: 'Copyright violation',
    description: 'Uploading a published book chapter which violates copyright.',
    status: 'pending',
    reportedBy: 'Marcus Knight',
    reportedByEmail: 'marcus@example.com',
    sharedBy: 'Emily Chen',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
  },
  {
    id: '3',
    documentId: 'proj-outline-docx',
    documentName: 'Project_Outline.docx',
    documentType: 'docx',
    reason: 'Misleading information',
    description: 'Contains factually incorrect steps for the project workflow.',
    status: 'reviewed',
    reportedBy: 'Ngoc Tan',
    reportedByEmail: 'tan@example.com',
    sharedBy: 'David Kim',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    adminNote: 'Reviewed and discussed with David Kim. It was an honest mistake, document has been updated.',
  }
]

export const reportService = {
  async getDocumentReports(): Promise<DocumentReport[]> {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    // Initialize with mock data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMockReports))
    return defaultMockReports
  },

  async createDocumentReport(payload: Omit<DocumentReport, 'id' | 'status' | 'createdAt'>): Promise<DocumentReport> {
    const reports = await this.getDocumentReports()
    const newReport: DocumentReport = {
      ...payload,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    reports.push(newReport)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    return newReport
  },

  async updateDocumentReport(reportId: string, updates: Partial<DocumentReport>): Promise<DocumentReport> {
    const reports = await this.getDocumentReports()
    const index = reports.findIndex(r => r.id === reportId)
    if (index === -1) throw new Error('Report not found')
    
    reports[index] = { ...reports[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    return reports[index]
  },

  async markReportReviewed(reportId: string, adminNote?: string): Promise<DocumentReport> {
    return this.updateDocumentReport(reportId, {
      status: 'reviewed',
      reviewedAt: new Date().toISOString(),
      adminNote,
    })
  },

  async rejectReport(reportId: string, adminNote?: string): Promise<DocumentReport> {
    return this.updateDocumentReport(reportId, {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      adminNote,
    })
  },

  async removeReportedDocument(reportId: string, adminNote?: string): Promise<DocumentReport> {
    return this.updateDocumentReport(reportId, {
      status: 'removed',
      reviewedAt: new Date().toISOString(),
      adminNote,
    })
  }
}

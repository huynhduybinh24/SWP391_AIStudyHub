import { apiClient } from '@/lib/axios';

export interface DocumentReport {
  id: string;
  reportedFile: string;
  documentId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  reportedAt: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface ReportPayload {
  documentId: string;
  reason: string;
  details: string;
  evidenceLink?: string;
  reportedFile?: string;
  reporterName?: string;
  reporterEmail?: string;
}

export const reportService = {
  getReports(): DocumentReport[] {
    try {
      const stored = localStorage.getItem('aiStudyHubDocumentReports');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse reports from localStorage', e);
      return [];
    }
  },

  createReport(payload: Omit<DocumentReport, 'id' | 'reportedAt' | 'status'>): DocumentReport {
    const newReport: DocumentReport = {
      ...payload,
      id: `rep-${Date.now()}`,
      reportedAt: new Date().toISOString(),
      status: 'pending'
    };

    try {
      const reports = this.getReports();
      reports.push(newReport);
      localStorage.setItem('aiStudyHubDocumentReports', JSON.stringify(reports));
      window.dispatchEvent(new Event('aiStudyHubDocumentReportsUpdated'));
    } catch (e) {
      console.error('Failed to save report to localStorage', e);
    }

    return newReport;
  },

  async reportDocument(payload: ReportPayload): Promise<any> {
    try {
      const response = await apiClient.post('/reports', payload);
      return response.data;
    } catch (e) {
      console.warn("Using mock reportDocument fallback", e);
    }
    return this.createReport({
      reportedFile: payload.reportedFile || 'Unknown File',
      documentId: payload.documentId,
      reporterName: payload.reporterName || 'Anonymous',
      reporterEmail: payload.reporterEmail || 'anonymous@example.com',
      reason: `${payload.reason} - ${payload.details}`
    });
  },

  updateReport(id: string, payload: Partial<DocumentReport>): DocumentReport | null {
    try {
      const reports = this.getReports();
      const index = reports.findIndex(r => r.id === id);
      if (index === -1) return null;

      reports[index] = { ...reports[index], ...payload };
      localStorage.setItem('aiStudyHubDocumentReports', JSON.stringify(reports));
      window.dispatchEvent(new Event('aiStudyHubDocumentReportsUpdated'));
      return reports[index];
    } catch (e) {
      console.error('Failed to update report in localStorage', e);
      return null;
    }
  }
};

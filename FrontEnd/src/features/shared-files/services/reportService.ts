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

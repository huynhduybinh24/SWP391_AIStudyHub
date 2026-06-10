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
  async reportDocument(payload: ReportPayload): Promise<any> {
    const response = await apiClient.post('/reports', payload);
    return response.data;
  }
};

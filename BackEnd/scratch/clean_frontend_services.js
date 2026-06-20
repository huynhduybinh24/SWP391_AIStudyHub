const fs = require('fs');
const path = require('path');

const cleanStorageService = `import { apiClient } from '@/lib/axios'
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
    const response = await apiClient.get<StorageUsage>(\`/storage/usage?userId=\${userId}\`)
    return response.data
  },

  async getStorageAnalytics(userId: number): Promise<StorageAnalytics> {
    const response = await apiClient.get<StorageAnalytics>(\`/storage/analytics?userId=\${userId}\`)
    return response.data
  },

  async getStorageOverview(userId: number): Promise<any> {
    const response = await apiClient.get(\`/storage/overview?userId=\${userId}\`)
    return response.data
  },

  async getRecentUploads(userId: number): Promise<any[]> {
    const response = await apiClient.get(\`/storage/recent-uploads?userId=\${userId}\`)
    return response.data
  },

  async runDuplicateCleanup(userId: number): Promise<StorageCleanupScan> {
    const response = await apiClient.post<StorageCleanupScan>(\`/storage/cleanup/duplicate?userId=\${userId}\`)
    return response.data
  },

  async runLargeCleanup(userId: number, minSizeMb = 10): Promise<StorageCleanupScan> {
    const response = await apiClient.post<StorageCleanupScan>(\`/storage/cleanup/large?userId=\${userId}&minSizeMb=\${minSizeMb}\`)
    return response.data
  }
}
`;

const cleanReportService = `import { apiClient } from '@/lib/axios';

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
`;

const cleanUserNotificationService = `import { apiClient } from '@/lib/axios';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  time?: string;
  isRead: boolean;
  targetUserEmail?: string;
  documentId?: string;
  documentName?: string;
  reason?: string;
  actionType?: string;
}

export const userNotificationService = {
  async getNotifications(currentUser?: any): Promise<UserNotification[]> {
    const email = currentUser?.email || '';
    const response = await apiClient.get(\`/notifications?email=\${encodeURIComponent(email)}\`);
    const list = response.data?.data || response.data;
    if (Array.isArray(list)) {
      return list;
    }
    return [];
  },

  async deleteNotification(id: string): Promise<void> {
    await apiClient.delete(\`/notifications/\${id}\`);
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.put(\`/notifications/\${id}/read\`);
  },

  async markUserNotificationAsRead(id: string, email?: string): Promise<void> {
    return this.markAsRead(id);
  },

  async markAllAsRead(email?: string): Promise<void> {
    await apiClient.put(\`/notifications/read-all?email=\${encodeURIComponent(email || '')}\`);
  },

  async markAllUserNotificationsAsRead(email?: string): Promise<void> {
    return this.markAllAsRead(email);
  },

  async addUserNotification(notification: any): Promise<any> {
    const response = await apiClient.post('/notifications', notification);
    return response.data?.data || response.data;
  },

  async addNotification(payload: any): Promise<any> {
    return this.addUserNotification(payload);
  }
};
`;

const cleanAdminService = `import { apiClient } from '@/lib/axios';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  documentsCount: number;
  storageUsedMB: number;
  plan: 'free' | 'pro' | 'enterprise' | 'institutional';
  isOnline: boolean;
  lastActiveVi?: string;
  lastActiveEn?: string;
}

export interface AdminDocument {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  fileType: string;
  sizeMB: number;
  uploadedAt: string;
  status: 'approved' | 'rejected' | 'pending';
  aiStatus: 'analyzed' | 'flagged' | 'pending';
  category: string;
  sharedCount: number;
  isAiGenerated: boolean;
  aiConfidenceScore: number;
  isFlagged: boolean;
  bannedKeywords: string[];
  reportCount: number;
  aiRiskLevel: 'low' | 'medium' | 'high';
  plagiarismScore: number;
  unsafeContentScore: number;
  spamScore: number;
  uploadSource: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  totalDocuments: number;
  pendingDocuments: number;
  storageUsedGB: number;
  aiProcessedDocuments: number;
  flaggedDocuments: number;
  newUsersThisWeek: number;
  newRegistrationsLast7Days: number[];
  pdfStorageMb: number;
  officeStorageMb: number;
  spreadsheetStorageMb: number;
  otherStorageMb: number;
}

const mapBackendDocumentToAdminDocument = (d: any): AdminDocument => ({
  id: String(d.id),
  title: d.title,
  ownerName: d.ownerName || 'User',
  ownerEmail: d.ownerEmail || 'user@example.com',
  fileType: d.fileType?.toLowerCase() || 'pdf',
  sizeMB: d.fileSize ? Number((d.fileSize / (1024 * 1024)).toFixed(2)) : (d.sizeMb || 0.5),
  uploadedAt: d.createdAt ? d.createdAt.split('T')[0] : '2024-05-18',
  status: d.status?.toLowerCase() || 'approved',
  aiStatus: d.status?.toLowerCase() === 'rejected' ? 'flagged' : (d.aiStatus?.toLowerCase() || 'analyzed'),
  category: d.subject || 'General',
  sharedCount: d.sharedCount || 0,
  isAiGenerated: d.isAiGenerated || false,
  aiConfidenceScore: d.aiConfidenceScore || 0,
  isFlagged: d.status?.toLowerCase() === 'rejected' || d.isFlagged || false,
  bannedKeywords: d.moderationReason ? [d.moderationReason] : (d.bannedKeywords || []),
  reportCount: d.reportCount || 0,
  aiRiskLevel: d.status?.toLowerCase() === 'rejected' ? 'high' : (d.aiRiskLevel?.toLowerCase() || 'low'),
  plagiarismScore: d.plagiarismScore || 0,
  unsafeContentScore: d.unsafeContentScore || 0,
  spamScore: d.spamScore || 0,
  uploadSource: d.uploadSource || 'web_upload'
});

export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/dashboard/stats');
  const statsData = response.data;
  return {
    totalUsers: statsData.totalUsers || 0,
    activeUsers: (statsData.totalUsers - statsData.totalAdmins) || 0,
    premiumUsers: statsData.premiumUsers || 0,
    totalDocuments: statsData.totalDocuments || 0,
    pendingDocuments: statsData.pendingDocuments || 0,
    storageUsedGB: Number(((statsData.totalStorageUsed || 0) / 1024).toFixed(2)),
    aiProcessedDocuments: statsData.totalDocuments - statsData.pendingDocuments,
    flaggedDocuments: statsData.rejectedDocuments || 0,
    newUsersThisWeek: (statsData.newRegistrationsLast7Days || []).reduce((a, b) => a + b, 0),
    newRegistrationsLast7Days: statsData.newRegistrationsLast7Days || [0, 0, 0, 0, 0, 0, 0],
    pdfStorageMb: statsData.pdfStorageMb || 0,
    officeStorageMb: statsData.officeStorageMb || 0,
    spreadsheetStorageMb: statsData.spreadsheetStorageMb || 0,
    otherStorageMb: statsData.otherStorageMb || 0,
  };
};

export const getUsers = async (
  keyword?: string,
  role?: string,
  status?: string,
  page = 0,
  size = 100
): Promise<AdminUser[]> => {
  const params: any = { page, size };
  if (keyword) params.keyword = keyword;
  if (role) params.role = role.toUpperCase();
  if (status) params.status = status.toUpperCase();

  const response = await apiClient.get('/admin/users', { params });
  const list = response.data?.data || response.data;
  if (Array.isArray(list)) {
    return list.map((u: any) => {
      const lastActive = u.updatedAt || u.createdAt;
      let lastActiveVi = 'Không rõ';
      let lastActiveEn = 'Unknown';
      if (lastActive) {
        const diffMs = Date.now() - new Date(lastActive).getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);
        if (diffMin < 2) {
          lastActiveVi = 'Vừa xong'; lastActiveEn = 'Just now';
        } else if (diffMin < 60) {
          lastActiveVi = \`\${diffMin} phút trước\`; lastActiveEn = \`\${diffMin}m ago\`;
        } else if (diffHr < 24) {
          lastActiveVi = \`\${diffHr} giờ trước\`; lastActiveEn = \`\${diffHr}h ago\`;
        } else if (diffDay < 30) {
          lastActiveVi = \`\${diffDay} ngày trước\`; lastActiveEn = \`\${diffDay}d ago\`;
        } else {
          const d = new Date(lastActive);
          lastActiveVi = d.toLocaleDateString('vi-VN');
          lastActiveEn = d.toLocaleDateString('en-US');
        }
      }

      return {
        id: String(u.id),
        name: u.fullName || u.name || 'Anonymous',
        email: u.email,
        role: u.role?.toLowerCase() === 'admin' ? 'admin' : u.role?.toLowerCase() === 'teacher' ? 'teacher' : 'user',
        status: u.accountStatus?.toLowerCase() || 'active',
        joinedAt: u.createdAt ? u.createdAt.split('T')[0] : '2023-01-15',
        documentsCount: u.documentsCount || 0,
        storageUsedMB: u.storageUsedMb || 0,
        plan: u.planType?.toLowerCase() || 'free',
        isOnline: false,
        lastActiveVi,
        lastActiveEn,
      };
    });
  }
  return [];
};

export const updateUser = async (
  userId: string,
  updates: Partial<AdminUser>,
  reason?: string
): Promise<AdminUser> => {
  if (updates.status) {
    await apiClient.patch(\`/admin/users/\${userId}/status\`, { status: updates.status.toUpperCase(), reason });
  }
  if (updates.role) {
    await apiClient.patch(\`/admin/users/\${userId}/role\`, { role: updates.role.toUpperCase() });
  }
  if (updates.plan) {
    await apiClient.patch(\`/admin/users/\${userId}/plan\`, { planType: updates.plan.toUpperCase() });
  }
  if (updates.name || updates.email) {
    await apiClient.put(\`/admin/users/\${userId}\`, {
      fullName: updates.name || '',
      email: updates.email || ''
    });
  }

  // Fetch updated list and return
  const response = await apiClient.get('/admin/users');
  const list = response.data?.data || response.data;
  if (Array.isArray(list)) {
    const u = list.find((item: any) => String(item.id) === String(userId));
    if (u) {
      return {
        id: String(u.id),
        name: u.fullName || u.name || 'Anonymous',
        email: u.email,
        role: u.role?.toLowerCase() === 'admin' ? 'admin' : u.role?.toLowerCase() === 'teacher' ? 'teacher' : 'user',
        status: u.accountStatus?.toLowerCase() || 'active',
        joinedAt: u.createdAt ? u.createdAt.split('T')[0] : '2023-01-15',
        documentsCount: u.documentsCount || 0,
        storageUsedMB: u.storageUsedMb || 0,
        plan: u.planType?.toLowerCase() || 'free',
        isOnline: false,
        lastActiveVi: 'Just now',
        lastActiveEn: 'Just now',
      };
    }
  }

  return {
    id: userId,
    name: updates.name || 'Anonymous',
    email: updates.email || '',
    role: updates.role || 'user',
    status: updates.status || 'active',
    joinedAt: new Date().toISOString().split('T')[0],
    documentsCount: 0,
    storageUsedMB: 0,
    plan: updates.plan || 'free',
    isOnline: false,
    lastActiveVi: 'Just now',
    lastActiveEn: 'Just now',
  };
};

export const deleteUser = async (userId: string, reason?: string): Promise<{ success: boolean }> => {
  await apiClient.delete(\`/admin/users/\${userId}\`);
  return { success: true };
};

export const getDocuments = async (): Promise<AdminDocument[]> => {
  const response = await apiClient.get('/admin/documents');
  const list = response.data?.data || response.data;
  if (Array.isArray(list)) {
    return list.map(mapBackendDocumentToAdminDocument);
  }
  return [];
};

export const updateDocument = async (
  documentId: string,
  updates: Partial<AdminDocument>,
  reason?: string
): Promise<AdminDocument> => {
  let status = updates.status?.toUpperCase();
  if (updates.isFlagged === true) {
    status = 'REJECTED';
  } else if (updates.isFlagged === false) {
    status = 'APPROVED';
  }

  if (status) {
    const response = await apiClient.patch(\`/admin/documents/\${documentId}/moderate\`, { status, reason });
    if (response.data) {
      return mapBackendDocumentToAdminDocument(response.data);
    }
  }

  const response = await apiClient.get(\`/admin/documents/\${documentId}\`);
  if (response.data) {
    return mapBackendDocumentToAdminDocument(response.data);
  }

  throw new Error("Failed to update document");
};

export const deleteDocument = async (documentId: string, reason?: string): Promise<{ success: boolean }> => {
  await apiClient.delete(\`/admin/documents/\${documentId}\`);
  return { success: true };
};

export const approveDocument = async (documentId: string): Promise<AdminDocument> => {
  const response = await apiClient.patch(\`/admin/documents/\${documentId}/moderate\`, { status: 'APPROVED' });
  return mapBackendDocumentToAdminDocument(response.data?.data || response.data);
};

export const rejectDocument = async (documentId: string, reason?: string): Promise<AdminDocument> => {
  const response = await apiClient.patch(\`/admin/documents/\${documentId}/moderate\`, { status: 'REJECTED', reason });
  return mapBackendDocumentToAdminDocument(response.data?.data || response.data);
};

export const bulkApproveDocuments = async (documentIds: string[]): Promise<AdminDocument[]> => {
  await apiClient.post('/admin/documents/bulk-approve', { ids: documentIds.map(Number) });
  const allDocs = await getDocuments();
  return allDocs.filter((d) => documentIds.includes(d.id));
};

export const bulkRejectDocuments = async (documentIds: string[], reason?: string): Promise<AdminDocument[]> => {
  await apiClient.post('/admin/documents/bulk-reject', { ids: documentIds.map(Number), reason });
  const allDocs = await getDocuments();
  return allDocs.filter((d) => documentIds.includes(d.id));
};

export const bulkDeleteDocuments = async (documentIds: string[]): Promise<{ success: boolean }> => {
  await apiClient.delete('/admin/documents/bulk', { data: { ids: documentIds.map(Number) } });
  return { success: true };
};

export const exportModerationReport = async (documentIds: string[]): Promise<{ downloadUrl: string; filename: string }> => {
  const filename = \`moderation_report_\${new Date().toISOString().split("T")[0]}.csv\`;
  const params = documentIds && documentIds.length > 0 ? { ids: documentIds.join(',') } : undefined;
  const response = await apiClient.get('/admin/documents/export-report', {
    params,
    responseType: 'blob'
  });
  
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return {
    downloadUrl: url,
    filename
  };
};

export const getDashboardSummary = async () => {
  const [stats, users, docs] = await Promise.all([
    getAdminStats(),
    getUsers(),
    getDocuments(),
  ]);
  
  return {
    stats,
    users,
    documents: docs,
  };
};

export const adminService = {
  getAdminStats,
  getUsers,
  updateUser,
  deleteUser,
  getDocuments,
  updateDocument,
  deleteDocument,
  approveDocument,
  rejectDocument,
  bulkApproveDocuments,
  bulkRejectDocuments,
  bulkDeleteDocuments,
  exportModerationReport,
  getDashboardSummary,
  getReports: async () => {
    const response = await apiClient.get('/admin/reports');
    return response.data?.data || response.data || [];
  },
  updateReportStatus: async (id: string | number, status: 'pending' | 'resolved' | 'ignored') => {
    const response = await apiClient.patch(\`/admin/reports/\${id}/status\`, { status });
    return response.data?.data || response.data || { id, status };
  },
  getActivityLogs: async () => {
    const response = await apiClient.get('/admin/activity-logs');
    return response.data?.data || response.data || [];
  }
};
`;

fs.writeFileSync(path.resolve('D:/SWP391_AIStudyHub/FrontEnd/src/services/storageService.ts'), cleanStorageService, 'utf8');
console.log('Cleaned storageService.ts');

fs.writeFileSync(path.resolve('D:/SWP391_AIStudyHub/FrontEnd/src/features/shared-files/services/reportService.ts'), cleanReportService, 'utf8');
console.log('Cleaned reportService.ts');

fs.writeFileSync(path.resolve('D:/SWP391_AIStudyHub/FrontEnd/src/features/notifications/services/userNotificationService.ts'), cleanUserNotificationService, 'utf8');
console.log('Cleaned userNotificationService.ts');

fs.writeFileSync(path.resolve('D:/SWP391_AIStudyHub/FrontEnd/src/features/admin/services/adminService.ts'), cleanAdminService, 'utf8');
console.log('Cleaned adminService.ts');

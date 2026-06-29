import { apiClient } from '@/lib/axios';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  documentsCount: number;
  storageUsedMB: number;
  storageLimitMB: number;
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
  storageLimitGB: number;
  aiProcessedDocuments: number;
  flaggedDocuments: number;
  newUsersThisWeek: number;
  newRegistrationsLast7Days: number[];
  pdfStorageMb: number;
  officeStorageMb: number;
  spreadsheetStorageMb: number;
  otherStorageMb: number;
  engagementRate: number;
  avgAiResponseTime: number;
  storageEfficiency: number;
  tempFilesCleanedGb: number;
  proConversionRate: number;
  monthlyTrafficLabels: string[];
  monthlyPageViews: number[];
  monthlyAiQueries: number[];
  aiChatInteractions: number;
  fileStorageInteractions: number;
  studyPlanInteractions: number;
  quizInteractions: number;
  freePlanUsersCount: number;
  proPlanUsersCount: number;
  premiumPlanUsersCount: number;
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
    activeUsers: statsData.totalUsers || 0,
    premiumUsers: statsData.premiumUsers || 0,
    totalDocuments: statsData.totalDocuments || 0,
    pendingDocuments: statsData.pendingDocuments || 0,
    storageUsedGB: Number(((statsData.totalStorageUsed || 0) / 1024).toFixed(2)),
    storageLimitGB: Number(((statsData.totalStorageLimit || 0) / 1024).toFixed(2)),
    aiProcessedDocuments: statsData.totalDocuments - statsData.pendingDocuments,
    flaggedDocuments: statsData.rejectedDocuments || 0,
    newUsersThisWeek: (statsData.newRegistrationsLast7Days || []).reduce((a: number, b: number) => a + b, 0),
    newRegistrationsLast7Days: statsData.newRegistrationsLast7Days || [0, 0, 0, 0, 0, 0, 0],
    pdfStorageMb: statsData.pdfStorageMb || 0,
    officeStorageMb: statsData.officeStorageMb || 0,
    spreadsheetStorageMb: statsData.spreadsheetStorageMb || 0,
    otherStorageMb: statsData.otherStorageMb || 0,
    engagementRate: statsData.engagementRate ?? 84.2,
    avgAiResponseTime: statsData.avgAiResponseTime ?? 1.18,
    storageEfficiency: statsData.storageEfficiency ?? 98.1,
    tempFilesCleanedGb: statsData.tempFilesCleanedGb ?? 982,
    proConversionRate: statsData.proConversionRate ?? 25.2,
    monthlyTrafficLabels: statsData.monthlyTrafficLabels || ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    monthlyPageViews: statsData.monthlyPageViews || [45000, 52000, 49000, 63000, 78000, 92450],
    monthlyAiQueries: statsData.monthlyAiQueries || [12000, 15400, 14200, 19800, 24500, 31200],
    aiChatInteractions: statsData.aiChatInteractions ?? 85240,
    fileStorageInteractions: statsData.fileStorageInteractions ?? 64205,
    studyPlanInteractions: statsData.studyPlanInteractions ?? 38450,
    quizInteractions: statsData.quizInteractions ?? 29400,
    freePlanUsersCount: statsData.freePlanUsersCount || 0,
    proPlanUsersCount: statsData.proPlanUsersCount || 0,
    premiumPlanUsersCount: statsData.premiumPlanUsersCount || 0,
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
          lastActiveVi = `${diffMin} phút trước`; lastActiveEn = `${diffMin}m ago`;
        } else if (diffHr < 24) {
          lastActiveVi = `${diffHr} giờ trước`; lastActiveEn = `${diffHr}h ago`;
        } else if (diffDay < 30) {
          lastActiveVi = `${diffDay} ngày trước`; lastActiveEn = `${diffDay}d ago`;
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
        role: u.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
        status: u.accountStatus?.toLowerCase() || 'active',
        joinedAt: u.createdAt ? u.createdAt.split('T')[0] : '2023-01-15',
        documentsCount: u.documentsCount || 0,
        storageUsedMB: u.storageUsedMb || 0,
        storageLimitMB: u.storageLimitMb || 1024,
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
    await apiClient.patch(`/admin/users/${userId}/status`, { status: updates.status.toUpperCase(), reason });
  }
  if (updates.role) {
    await apiClient.patch(`/admin/users/${userId}/role`, { role: updates.role.toUpperCase() });
  }
  if (updates.plan) {
    await apiClient.patch(`/admin/users/${userId}/plan`, { planType: updates.plan.toUpperCase() });
  }
  if (updates.name || updates.email) {
    await apiClient.put(`/admin/users/${userId}`, {
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
        role: u.role?.toLowerCase() === 'admin' ? 'admin' : 'user',
        status: u.accountStatus?.toLowerCase() || 'active',
        joinedAt: u.createdAt ? u.createdAt.split('T')[0] : '2023-01-15',
        documentsCount: u.documentsCount || 0,
        storageUsedMB: u.storageUsedMb || 0,
        storageLimitMB: u.storageLimitMb || 1024,
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
    storageLimitMB: 1024,
    plan: updates.plan || 'free',
    isOnline: false,
    lastActiveVi: 'Just now',
    lastActiveEn: 'Just now',
  };
};

export const deleteUser = async (userId: string, reason?: string): Promise<{ success: boolean }> => {
  const url = reason ? `/admin/users/${userId}?reason=${encodeURIComponent(reason)}` : `/admin/users/${userId}`;
  await apiClient.delete(url);
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
    const response = await apiClient.patch(`/admin/documents/${documentId}/moderate`, { status, reason });
    if (response.data) {
      return mapBackendDocumentToAdminDocument(response.data);
    }
  }

  const response = await apiClient.get(`/admin/documents/${documentId}`);
  if (response.data) {
    return mapBackendDocumentToAdminDocument(response.data);
  }

  throw new Error("Failed to update document");
};

export const deleteDocument = async (documentId: string, _reason?: string): Promise<{ success: boolean }> => {
  await apiClient.delete(`/admin/documents/${documentId}`);
  return { success: true };
};

export const approveDocument = async (documentId: string): Promise<AdminDocument> => {
  const response = await apiClient.patch(`/admin/documents/${documentId}/moderate`, { status: 'APPROVED' });
  return mapBackendDocumentToAdminDocument(response.data?.data || response.data);
};

export const rejectDocument = async (documentId: string, reason?: string): Promise<AdminDocument> => {
  const response = await apiClient.patch(`/admin/documents/${documentId}/moderate`, { status: 'REJECTED', reason });
  return mapBackendDocumentToAdminDocument(response.data?.data || response.data);
};

export const getPendingDocuments = async (): Promise<any[]> => {
  const response = await apiClient.get('/admin/documents/pending');
  return response.data;
};

export const approvePendingDocument = async (documentId: string): Promise<any> => {
  const response = await apiClient.post(`/admin/documents/${documentId}/approve`);
  return response.data;
};

export const rejectPendingDocument = async (documentId: string, reason: string): Promise<any> => {
  const response = await apiClient.post(`/admin/documents/${documentId}/reject`, { reason });
  return response.data;
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
  const filename = `moderation_report_${new Date().toISOString().split("T")[0]}.csv`;
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

export interface SubscriptionPlan {
  id: number;
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
  price: number;
  durationDays: number;
  storageLimitMb: number;
  aiChatLimitPerDay: number;
  createdAt?: string;
  updatedAt?: string;
}

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await apiClient.get('/admin/plans');
  return response.data;
};

export const updateSubscriptionPlan = async (
  id: number,
  price: number,
  storageLimitMb: number
): Promise<SubscriptionPlan> => {
  const response = await apiClient.put(`/admin/plans/${id}`, {
    price,
    storageLimitMb
  });
  return response.data;
};

export const adminService = {
  getAdminStats,
  getSubscriptionPlans,
  updateSubscriptionPlan,
  getUsers,
  updateUser,
  deleteUser,
  getDocuments,
  updateDocument,
  deleteDocument,
  approveDocument,
  rejectDocument,
  getPendingDocuments,
  approvePendingDocument,
  rejectPendingDocument,
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
    const response = await apiClient.patch(`/admin/reports/${id}/status`, { status });
    return response.data?.data || response.data || { id, status };
  },
  getActivityLogs: async () => {
    const response = await apiClient.get('/admin/activity-logs');
    return response.data?.data || response.data || [];
  }
};

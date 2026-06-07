import { userNotificationService } from '@/features/notifications/services/userNotificationService';
import { UserRole } from '@/types/auth';

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "inactive" | "banned";
  joinedAt: string;
  documentsCount: number;
  storageUsedMB: number;
  avatar?: string;
  plan?: string;
  lastActiveVi?: string;
  lastActiveEn?: string;
  isOnline?: boolean;
};

export type AdminDocument = {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  fileType: "pdf" | "docx" | "pptx" | "xlsx" | "image" | "txt";
  sizeMB: number;
  uploadedAt: string;
  status: "approved" | "pending" | "rejected" | "deleted";
  aiStatus: "not_analyzed" | "analyzing" | "analyzed" | "flagged";
  category: string;
  sharedCount: number;
  isAiGenerated: boolean;
  aiConfidenceScore: number;
  isFlagged: boolean;
  bannedKeywords: string[];
  reportCount: number;
  aiRiskLevel: "low" | "medium" | "high";
  plagiarismScore: number;
  unsafeContentScore: number;
  spamScore: number;
  uploadSource: "web_upload" | "api_sync" | "partner_portal";
};

export type DeletedDocumentRecord = {
  id: string;
  documentId: string;
  documentName: string;
  ownerName: string;
  ownerEmail?: string;
  deletedBy: string;
  deletedAt: string;
  reason: string;
  noticeMessage: string;
};

export type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  totalDocuments: number;
  pendingDocuments: number;
  storageUsedGB: number;
  aiProcessedDocuments: number;
  flaggedDocuments: number;
  newUsersThisWeek: number;
};

const DEFAULT_MOCK_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "Alex Rivera",
    email: "alex@example.com",
    role: "user",
    status: "active",
    joinedAt: "2023-01-15",
    documentsCount: 45,
    storageUsedMB: 1500,
    plan: "pro",
    lastActiveVi: "2 phút trước",
    lastActiveEn: "2 minutes ago",
    isOnline: true,
  },
  {
    id: "u2",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    role: "user",
    status: "active",
    joinedAt: "2023-03-22",
    documentsCount: 120,
    storageUsedMB: 5400,
    plan: "pro",
    lastActiveVi: "1 giờ trước",
    lastActiveEn: "1 hour ago",
    isOnline: false,
  },
  {
    id: "u3",
    name: "Huynh Duy Binh",
    email: "binh@example.com",
    role: "user",
    status: "active",
    joinedAt: "2024-01-10",
    documentsCount: 12,
    storageUsedMB: 350,
    plan: "free",
    lastActiveVi: "3 ngày trước",
    lastActiveEn: "3 days ago",
    isOnline: false,
  },
  {
    id: "u4",
    name: "Ngoc Tan",
    email: "tan@example.com",
    role: "user",
    status: "inactive",
    joinedAt: "2024-02-05",
    documentsCount: 5,
    storageUsedMB: 120,
    plan: "free",
    lastActiveVi: "5 ngày trước",
    lastActiveEn: "5 days ago",
    isOnline: false,
  },
  {
    id: "u5",
    name: "Marcus Knight",
    email: "marcus@example.com",
    role: "user",
    status: "active",
    joinedAt: "2024-03-12",
    documentsCount: 25,
    storageUsedMB: 850,
    plan: "free",
    lastActiveVi: "10 phút trước",
    lastActiveEn: "10 minutes ago",
    isOnline: true,
  },
  {
    id: "u6",
    name: "Emily R.",
    email: "emily@example.com",
    role: "user",
    status: "banned",
    joinedAt: "2023-08-19",
    documentsCount: 88,
    storageUsedMB: 3200,
    plan: "free",
    lastActiveVi: "2 tuần trước",
    lastActiveEn: "2 weeks ago",
    isOnline: false,
  },
];

const loadUsersFromStorage = (): AdminUser[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aiStudyHubUsers');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        
        // If the parsed list doesn't have the new active properties, reset to DEFAULT_MOCK_USERS
        if (parsed.length > 0 && !parsed[0].hasOwnProperty('lastActiveVi')) {
          localStorage.setItem('aiStudyHubUsers', JSON.stringify(DEFAULT_MOCK_USERS));
          return [...DEFAULT_MOCK_USERS];
        }

        // Ensure default mock users are always present in the list to prevent them from disappearing
        let changed = false;
        DEFAULT_MOCK_USERS.forEach((defaultUser) => {
          if (!parsed.some((u: any) => u.email?.toLowerCase() === defaultUser.email?.toLowerCase())) {
            parsed.push(defaultUser);
            changed = true;
          }
        });

        const updatedList = parsed.map((u: any) => {
          let role = u.role;
          let name = u.name;
          if (name === 'Student User' || name === 'Instructor User') {
            name = 'LumiEdu User';
            changed = true;
          }
          if (u.email === 'alex@example.com' && role === 'admin') {
            role = 'user';
            changed = true;
          }
          if (changed) {
            return { ...u, role, name };
          }
          return u;
        });

        if (changed) {
          localStorage.setItem('aiStudyHubUsers', JSON.stringify(updatedList));
          return updatedList;
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing users from localStorage', e);
      }
    }
    localStorage.setItem('aiStudyHubUsers', JSON.stringify(DEFAULT_MOCK_USERS));
  }
  return [...DEFAULT_MOCK_USERS];
};

let mockUsers: AdminUser[] = loadUsersFromStorage();

const saveUsersToStorage = (usersList: AdminUser[]) => {
  mockUsers = usersList;
  if (typeof window !== 'undefined') {
    localStorage.setItem('aiStudyHubUsers', JSON.stringify(usersList));
  }
};

let mockDocuments: AdminDocument[] = [
  {
    id: "d1",
    title: "Advanced Neuroscience Syllabus 2024",
    ownerName: "Sarah Jenkins",
    ownerEmail: "sarah@school.edu",
    fileType: "pdf",
    sizeMB: 2.4,
    uploadedAt: "2024-05-20",
    status: "approved",
    aiStatus: "analyzed",
    category: "Syllabus",
    sharedCount: 45,
    isAiGenerated: false,
    aiConfidenceScore: 12,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 0,
    aiRiskLevel: "low",
    plagiarismScore: 5,
    unsafeContentScore: 1,
    spamScore: 2,
    uploadSource: "web_upload",
  },
  {
    id: "d2",
    title: "Group Project Research Materials",
    ownerName: "Huynh Duy Binh",
    ownerEmail: "binh@example.com",
    fileType: "docx",
    sizeMB: 1.2,
    uploadedAt: "2024-05-22",
    status: "pending",
    aiStatus: "not_analyzed",
    category: "Research",
    sharedCount: 3,
    isAiGenerated: true,
    aiConfidenceScore: 78,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 1,
    aiRiskLevel: "medium",
    plagiarismScore: 18,
    unsafeContentScore: 15,
    spamScore: 45,
    uploadSource: "web_upload",
  },
  {
    id: "d3",
    title: "Organic Chemistry Study Plan",
    ownerName: "Marcus Knight",
    ownerEmail: "marcus@example.com",
    fileType: "pdf",
    sizeMB: 3.5,
    uploadedAt: "2024-05-23",
    status: "approved",
    aiStatus: "analyzed",
    category: "Study Guide",
    sharedCount: 12,
    isAiGenerated: false,
    aiConfidenceScore: 4,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 0,
    aiRiskLevel: "low",
    plagiarismScore: 10,
    unsafeContentScore: 0,
    spamScore: 1,
    uploadSource: "partner_portal",
  },
  {
    id: "d4",
    title: "Biology 101 Midterm Notes Leaked Exam",
    ownerName: "Alex Rivera",
    ownerEmail: "alex@example.com",
    fileType: "pdf",
    sizeMB: 5.1,
    uploadedAt: "2024-05-24",
    status: "pending",
    aiStatus: "flagged",
    category: "Notes",
    sharedCount: 8,
    isAiGenerated: true,
    aiConfidenceScore: 96,
    isFlagged: true,
    bannedKeywords: ["leak", "exam", "midterm"],
    reportCount: 4,
    aiRiskLevel: "high",
    plagiarismScore: 85,
    unsafeContentScore: 92,
    spamScore: 80,
    uploadSource: "web_upload",
  },
  {
    id: "d5",
    title: "Literature Review Copy Paste Plagiarized",
    ownerName: "Emily R.",
    ownerEmail: "emily@example.com",
    fileType: "pdf",
    sizeMB: 1.8,
    uploadedAt: "2024-05-21",
    status: "rejected",
    aiStatus: "flagged",
    category: "Review",
    sharedCount: 0,
    isAiGenerated: false,
    aiConfidenceScore: 0,
    isFlagged: true,
    bannedKeywords: ["plagiarized", "copy"],
    reportCount: 15,
    aiRiskLevel: "high",
    plagiarismScore: 98,
    unsafeContentScore: 12,
    spamScore: 90,
    uploadSource: "api_sync",
  },
  {
    id: "d6",
    title: "Data Set_V1",
    ownerName: "Huynh Duy Binh",
    ownerEmail: "binh@example.com",
    fileType: "xlsx",
    sizeMB: 12.5,
    uploadedAt: "2024-05-25",
    status: "approved",
    aiStatus: "analyzed",
    category: "Data",
    sharedCount: 2,
    isAiGenerated: false,
    aiConfidenceScore: 2,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 0,
    aiRiskLevel: "low",
    plagiarismScore: 2,
    unsafeContentScore: 0,
    spamScore: 1,
    uploadSource: "api_sync",
  },
  {
    id: "d7",
    title: "Project_Outline",
    ownerName: "Ngoc Tan",
    ownerEmail: "tan@example.com",
    fileType: "docx",
    sizeMB: 0.5,
    uploadedAt: "2024-05-18",
    status: "approved",
    aiStatus: "analyzed",
    category: "Outline",
    sharedCount: 1,
    isAiGenerated: false,
    aiConfidenceScore: 0,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 0,
    aiRiskLevel: "low",
    plagiarismScore: 4,
    unsafeContentScore: 0,
    spamScore: 3,
    uploadSource: "web_upload",
  },
  {
    id: "d8",
    title: "Brainstorming_Diagram",
    ownerName: "Marcus Knight",
    ownerEmail: "marcus@example.com",
    fileType: "image",
    sizeMB: 4.2,
    uploadedAt: "2024-05-26",
    status: "pending",
    aiStatus: "not_analyzed",
    category: "Diagram",
    sharedCount: 5,
    isAiGenerated: false,
    aiConfidenceScore: 0,
    isFlagged: false,
    bannedKeywords: [],
    reportCount: 0,
    aiRiskLevel: "low",
    plagiarismScore: 0,
    unsafeContentScore: 0,
    spamScore: 0,
    uploadSource: "web_upload",
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 300); // 300-600ms

export const getAdminStats = async (): Promise<AdminStats> => {
  await randomDelay();
  const currentUsers = loadUsersFromStorage();
  const storageMB = currentUsers.reduce((sum, u) => sum + u.storageUsedMB, 0);
  
  return {
    totalUsers: currentUsers.length,
    activeUsers: currentUsers.filter((u) => u.status === "active").length,
    totalDocuments: mockDocuments.length,
    pendingDocuments: mockDocuments.filter((d) => d.status === "pending").length,
    storageUsedGB: Number((storageMB / 1024).toFixed(2)),
    aiProcessedDocuments: mockDocuments.filter((d) => d.aiStatus === "analyzed").length,
    flaggedDocuments: mockDocuments.filter((d) => d.aiStatus === "flagged").length,
    newUsersThisWeek: 2,
  };
};

export const getUsers = async (): Promise<AdminUser[]> => {
  await randomDelay();
  return loadUsersFromStorage();
};

export const updateUser = async (
  userId: string,
  updates: Partial<AdminUser>,
  reason?: string
): Promise<AdminUser> => {
  await randomDelay();
  const currentUsers = loadUsersFromStorage();
  const index = currentUsers.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("User not found");
  
  const user = currentUsers[index];
  if (updates.status === 'inactive' && reason) {
    console.log(`[Email Notification Sent] To: ${user.email} | Subject: Account Suspension Notice | Reason: ${reason}`);
  }
  
  currentUsers[index] = { ...currentUsers[index], ...updates };
  saveUsersToStorage(currentUsers);

  // Sync with persistent switcher and active session stores
  if (typeof window !== 'undefined') {
    const email = user.email;
    
    // 1. Sync logged-in accounts switcher (aiStudyHubLoggedInAccounts)
    const loggedInAccountsStr = localStorage.getItem('aiStudyHubLoggedInAccounts');
    if (loggedInAccountsStr) {
      try {
        const accounts = JSON.parse(loggedInAccountsStr);
        if (Array.isArray(accounts)) {
          let accountsChanged = false;
          const updatedAccounts = accounts.map((acc: any) => {
            if (acc.email?.toLowerCase() === email?.toLowerCase()) {
              accountsChanged = true;
              return {
                ...acc,
                plan: updates.plan ? updates.plan.toUpperCase() : acc.plan,
                role: updates.role ? updates.role : acc.role
              };
            }
            return acc;
          });
          if (accountsChanged) {
            localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updatedAccounts));
            window.dispatchEvent(new Event('aiStudyHubLoggedInAccountsUpdated'));
          }
        }
      } catch (e) {
        console.error('Error updating logged-in accounts switcher in adminService', e);
      }
    }

    // 2. Sync active user store session if it's the updated user!
    try {
      const activeUserStr = localStorage.getItem('aiStudyHubCurrentUser');
      if (activeUserStr) {
        const activeUser = JSON.parse(activeUserStr);
        if (activeUser.email?.toLowerCase() === email?.toLowerCase()) {
          if (updates.plan) {
            activeUser.plan = updates.plan.toLowerCase();
          }
          if (updates.role) {
            activeUser.role = updates.role;
          }
          localStorage.setItem('aiStudyHubCurrentUser', JSON.stringify(activeUser));
          
          // Dynamically require or update Zustand state if window is active
          const { useAuthStore } = await import('@/stores/authStore');
          const currentAuth = useAuthStore.getState().user;
          if (currentAuth) {
            useAuthStore.setState({
              user: {
                ...currentAuth,
                plan: updates.plan ? (updates.plan.toLowerCase() as 'free' | 'pro') : currentAuth.plan,
                role: updates.role ? (updates.role as any) : currentAuth.role
              }
            });
          }
        }
      }
    } catch (err) {
      console.error('Error syncing active auth session in adminService', err);
    }
  }

  return { ...currentUsers[index] };
};

export const deleteUser = async (userId: string, reason?: string): Promise<{ success: boolean }> => {
  await randomDelay();
  const currentUsers = loadUsersFromStorage();
  const index = currentUsers.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("User not found");
  
  const user = currentUsers[index];
  if (reason) {
    console.log(`[Email Notification Sent] To: ${user.email} | Subject: Account Termination Notice | Reason: ${reason}`);
  }
  
  // Remove from the switcher accounts registry so they disappear from the "Change User" popup modal
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('aiStudyHubLoggedInAccounts');
      if (stored) {
        let list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const updatedList = list.filter((u: any) => u.email?.toLowerCase() !== user.email?.toLowerCase());
          localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(updatedList));
        }
      }
    } catch (e) {
      console.error('Failed to remove deleted user from quick switcher registry:', e);
    }
  }

  const updatedUsers = currentUsers.filter((u) => u.id !== userId);
  saveUsersToStorage(updatedUsers);
  return { success: true };
};

export const getDocuments = async (): Promise<AdminDocument[]> => {
  await randomDelay();
  return [...mockDocuments];
};

export const updateDocument = async (
  documentId: string,
  updates: Partial<AdminDocument>,
  reason?: string
): Promise<AdminDocument> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  const doc = mockDocuments[index];
  if (updates.isFlagged === true && reason) {
    console.log(`[Email Notification Sent] To: ${doc.ownerEmail} | Subject: Document Flagged Notice | Reason: ${reason}`);
  }
  
  mockDocuments[index] = { ...mockDocuments[index], ...updates };
  return { ...mockDocuments[index] };
};

export const deleteDocument = async (documentId: string, reason?: string): Promise<{ success: boolean }> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  const doc = mockDocuments[index];

  if (reason) {
    const record: DeletedDocumentRecord = {
      id: `del_${Date.now()}`,
      documentId: doc.id,
      documentName: doc.title,
      ownerName: doc.ownerName,
      ownerEmail: doc.ownerEmail,
      deletedBy: "Admin",
      deletedAt: new Date().toISOString(),
      reason: reason,
      noticeMessage: `Your document "${doc.title}" was removed by admin. Reason: ${reason}`
    };

    const existingNotices = JSON.parse(localStorage.getItem('aiStudyHubDeletedDocumentNotices') || '[]');
    existingNotices.push(record);
    localStorage.setItem('aiStudyHubDeletedDocumentNotices', JSON.stringify(existingNotices));

    userNotificationService.addUserNotification({
      targetUserEmail: doc.ownerEmail || 'binh@example.com',
      type: "document_deleted",
      title: "Document removed by admin",
      message: record.noticeMessage,
      documentId: doc.id,
      documentName: doc.title,
      reason: reason,
      actionType: "removed"
    });
  }

  mockDocuments = mockDocuments.filter((d) => d.id !== documentId);
  return { success: true };
};

export const approveDocument = async (documentId: string): Promise<AdminDocument> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  mockDocuments[index] = {
    ...mockDocuments[index],
    status: "approved",
    aiStatus: mockDocuments[index].aiStatus === "not_analyzed" ? "analyzed" : mockDocuments[index].aiStatus,
  };
  return { ...mockDocuments[index] };
};

export const rejectDocument = async (documentId: string, reason?: string): Promise<AdminDocument> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  mockDocuments[index] = {
    ...mockDocuments[index],
    status: "rejected",
  };
  
  const doc = mockDocuments[index];
  if (reason) {
    console.log(`[Email Notification Sent] To: ${doc.ownerEmail} | Subject: Document Rejection Notice | Reason: ${reason}`);
    
    userNotificationService.addUserNotification({
      targetUserEmail: doc.ownerEmail || 'binh@example.com',
      type: "document_rejected",
      title: "Document rejected by admin",
      message: `Your document "${doc.title}" was rejected by admin. Reason: ${reason}`,
      documentId: doc.id,
      documentName: doc.title,
      reason: reason,
      actionType: "rejected"
    });
  }
  
  return { ...mockDocuments[index] };
};

export const bulkApproveDocuments = async (documentIds: string[]): Promise<AdminDocument[]> => {
  await randomDelay();
  mockDocuments = mockDocuments.map((d) => {
    if (documentIds.includes(d.id)) {
      return {
        ...d,
        status: "approved",
        aiStatus: d.aiStatus === "not_analyzed" ? "analyzed" : d.aiStatus,
      };
    }
    return d;
  });
  return mockDocuments.filter((d) => documentIds.includes(d.id));
};

export const bulkRejectDocuments = async (documentIds: string[]): Promise<AdminDocument[]> => {
  await randomDelay();
  mockDocuments = mockDocuments.map((d) => {
    if (documentIds.includes(d.id)) {
      return { ...d, status: "rejected" };
    }
    return d;
  });
  return mockDocuments.filter((d) => documentIds.includes(d.id));
};

export const bulkDeleteDocuments = async (documentIds: string[]): Promise<{ success: boolean }> => {
  await randomDelay();
  mockDocuments = mockDocuments.filter((d) => !documentIds.includes(d.id));
  return { success: true };
};

export const exportModerationReport = async (_documentIds: string[]): Promise<{ downloadUrl: string; filename: string }> => {
  await randomDelay();
  return {
    downloadUrl: "#",
    filename: `moderation_report_${new Date().toISOString().split("T")[0]}.csv`,
  };
};

export const getDashboardSummary = async () => {
  await randomDelay();
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
};

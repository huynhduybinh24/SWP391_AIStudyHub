export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  status: "active" | "inactive" | "banned";
  joinedAt: string;
  documentsCount: number;
  storageUsedMB: number;
  avatar?: string;
};

export type AdminDocument = {
  id: string;
  title: string;
  ownerName: string;
  ownerEmail: string;
  fileType: "pdf" | "docx" | "pptx" | "xlsx" | "image" | "txt";
  sizeMB: number;
  uploadedAt: string;
  status: "approved" | "pending" | "rejected";
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

let mockUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Alex Rivera",
    email: "alex@example.com",
    role: "admin",
    status: "active",
    joinedAt: "2023-01-15",
    documentsCount: 45,
    storageUsedMB: 1500,
  },
  {
    id: "u2",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    role: "teacher",
    status: "active",
    joinedAt: "2023-03-22",
    documentsCount: 120,
    storageUsedMB: 5400,
  },
  {
    id: "u3",
    name: "Huynh Duy Binh",
    email: "binh@example.com",
    role: "student",
    status: "active",
    joinedAt: "2024-01-10",
    documentsCount: 12,
    storageUsedMB: 350,
  },
  {
    id: "u4",
    name: "Ngoc Tan",
    email: "tan@example.com",
    role: "student",
    status: "inactive",
    joinedAt: "2024-02-05",
    documentsCount: 5,
    storageUsedMB: 120,
  },
  {
    id: "u5",
    name: "Marcus Knight",
    email: "marcus@example.com",
    role: "student",
    status: "active",
    joinedAt: "2024-03-12",
    documentsCount: 25,
    storageUsedMB: 850,
  },
  {
    id: "u6",
    name: "Emily R.",
    email: "emily@example.com",
    role: "teacher",
    status: "banned",
    joinedAt: "2023-08-19",
    documentsCount: 88,
    storageUsedMB: 3200,
  },
];

let mockDocuments: AdminDocument[] = [
  {
    id: "d1",
    title: "Advanced Neuroscience Syllabus 2024",
    ownerName: "Sarah Jenkins",
    ownerEmail: "sarah@example.com",
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
  const storageMB = mockUsers.reduce((sum, u) => sum + u.storageUsedMB, 0);
  
  return {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter((u) => u.status === "active").length,
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
  return [...mockUsers];
};

export const updateUser = async (
  userId: string,
  updates: Partial<AdminUser>
): Promise<AdminUser> => {
  await randomDelay();
  const index = mockUsers.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("User not found");
  
  mockUsers[index] = { ...mockUsers[index], ...updates };
  return { ...mockUsers[index] };
};

export const deleteUser = async (userId: string): Promise<{ success: boolean }> => {
  await randomDelay();
  const index = mockUsers.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("User not found");
  
  mockUsers = mockUsers.filter((u) => u.id !== userId);
  return { success: true };
};

export const getDocuments = async (): Promise<AdminDocument[]> => {
  await randomDelay();
  return [...mockDocuments];
};

export const updateDocument = async (
  documentId: string,
  updates: Partial<AdminDocument>
): Promise<AdminDocument> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  mockDocuments[index] = { ...mockDocuments[index], ...updates };
  return { ...mockDocuments[index] };
};

export const deleteDocument = async (documentId: string): Promise<{ success: boolean }> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
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

export const rejectDocument = async (documentId: string): Promise<AdminDocument> => {
  await randomDelay();
  const index = mockDocuments.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error("Document not found");
  
  mockDocuments[index] = {
    ...mockDocuments[index],
    status: "rejected",
  };
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

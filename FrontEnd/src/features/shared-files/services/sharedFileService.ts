import { apiClient } from '@/lib/axios';

export interface SharedFile {
  id: string;
  name: string;
  owner: string;
  ownerName?: string;
  ownerEmail?: string;
  permission: 'Viewer' | 'Editor' | 'Owner';
  dateShared: string;
  type: 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'image' | 'txt' | 'folder';
  size: string;
  totalPages?: number;
  description?: string;
  tags?: string[];
  previewContent?: string;
  url?: string;
  editHistory?: Array<{
    id: string;
    user: string;
    action: string;
    time: string;
    avatarBg: string;
  }>;
}



export const sharedFileService = {
  async getSharedFiles(): Promise<SharedFile[]> {
    const response = await apiClient.get('/shared-files');
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response.data?.data)) {
      return response.data.data;
    }
    return [];
  }
};

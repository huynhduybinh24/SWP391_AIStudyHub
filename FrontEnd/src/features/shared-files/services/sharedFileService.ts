import { apiClient } from '@/lib/axios';

export interface SharedFile {
  id: string;
  name: string;
  owner: string;
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

const DEFAULT_SHARED_FILES: SharedFile[] = [
  {
    id: 'file-1',
    name: 'Biology 101 Midterm Notes.pdf',
    owner: 'Sarah Jenkins',
    permission: 'Viewer',
    dateShared: '2h ago',
    type: 'pdf',
    size: '2.4 MB',
    totalPages: 42,
    description: 'Comprehensive study guide and midterm summary for General Biology 101, containing cellular respiration diagrams, metabolic pathway notes, and mitosis stages.',
    tags: ['CellBiology', 'KrebsCycle'],
    previewContent: 'Biology 101 Midterm Notes preview content.',
    url: '',
    editHistory: [
      { id: 'h-1-1', user: 'Sarah Jenkins', action: 'Đã tạo tài liệu', time: '5 ngày trước', avatarBg: 'bg-emerald-500' },
      { id: 'h-1-2', user: 'Sarah Jenkins', action: 'Đã chia sẻ tài liệu với bạn', time: '2 giờ trước', avatarBg: 'bg-emerald-500' }
    ]
  },
  {
    id: 'file-2',
    name: 'Group Project Assets',
    owner: 'David Kim',
    permission: 'Editor',
    dateShared: 'Oct 22, 2023',
    type: 'folder',
    size: '15.8 MB',
    description: 'Group assets folder containing images, mock data, design specifications, and reference links.',
    tags: ['GroupProject', 'Assets'],
    previewContent: 'Folder contents: assets, design specifications.',
    url: '',
    editHistory: [
      { id: 'h-2-1', user: 'David Kim', action: 'Đã tạo thư mục', time: '1 tháng trước', avatarBg: 'bg-blue-500' },
      { id: 'h-2-2', user: 'David Kim', action: 'Đã chia sẻ quyền chỉnh sửa (Editor) cho bạn', time: 'Oct 22, 2023', avatarBg: 'bg-blue-500' }
    ]
  },
  {
    id: 'file-3',
    name: 'Physics Lab Data.xlsx',
    owner: 'Emily Chen',
    permission: 'Viewer',
    dateShared: 'Oct 18, 2023',
    type: 'xlsx',
    size: '1.2 MB',
    totalPages: 10,
    description: 'Tabulated values of raw experimental logs, voltage sweeps, and resistance indexes from the electromagnetism laboratory session.',
    tags: ['Physics', 'LabData'],
    previewContent: 'Voltage, Current, Resistance sweep tables.',
    url: '',
    editHistory: [
      { id: 'h-3-1', user: 'Emily Chen', action: 'Đã tạo tài liệu', time: 'Oct 15, 2023', avatarBg: 'bg-purple-500' },
      { id: 'h-3-2', user: 'Emily Chen', action: 'Đã chia sẻ quyền xem (Viewer) cho bạn', time: 'Oct 18, 2023', avatarBg: 'bg-purple-500' }
    ]
  }
];

export const sharedFileService = {
  async getSharedFiles(): Promise<SharedFile[]> {
    try {
      const response = await apiClient.get('/shared-files');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (e) {
      console.warn("Using mock shared files fallback", e);
    }
    return DEFAULT_SHARED_FILES;
  }
};

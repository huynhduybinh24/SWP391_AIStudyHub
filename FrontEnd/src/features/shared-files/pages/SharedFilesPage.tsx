import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { reportService } from '../services/reportService'
import { sharedFileService } from '../services/sharedFileService'
import { formatStorageSize, calculateStorageUsage } from '@/utils/storageFormat'
import { getCurrentUserStorageSummary } from '@/services/storageService'
import { apiClient } from '@/lib/axios'
import { documentService } from '@/services/documentService'

// Workspace Components
import SharedWorkspaceHeader from '../components/SharedWorkspaceHeader'
import WorkspaceStatsCards from '../components/WorkspaceStatsCards'
import SharedFilesTabs from '../components/SharedFilesTabs'
import WorkspaceFilterBar from '../components/WorkspaceFilterBar'
import WorkspaceFileList from '../components/WorkspaceFileList'
import WorkspaceRightPanel, { CommentItem } from '../components/WorkspaceRightPanel'
import SharedFileViewer from '../components/SharedFileViewer'
import UploadFilesSection from '../components/UploadFilesSection'
import SharedFilesUploadModal from '../components/SharedFilesUploadModal'

// Modals & Overlays
import InviteModal from '../components/InviteModal'
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal'
import AIReportModal from '../components/AIReportModal'
import SummaryModal from '../components/SummaryModal'
import QuizModal from '../components/QuizModal'
import ShareAccessModal, { Collaborator } from '../components/ShareAccessModal'
import RenameFileModal from '../components/RenameFileModal'
import ChangePermissionModal from '../components/ChangePermissionModal'
import ConfirmRemoveAccessModal from '../components/ConfirmRemoveAccessModal'
import CollaboratorsModal, { Collaborator as ActiveCollaborator } from '../components/CollaboratorsModal'
import AIInsightsModal from '../components/AIInsightsModal'
import AddCollaboratorModal from '../components/AddCollaboratorModal'
import { SharedFile } from '../components/SharedFilesTable'
import { X, HardDrive } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { FileTypeIcon } from '../components/FileTypeIcon'

// Inline Quota details view modal
interface QuotaDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  usedMb: number
  totalMb: number
}

function QuotaDetailsModal({ isOpen, onClose, usedMb, totalMb }: QuotaDetailsModalProps) {
  const { t, language } = useTranslation()
  
  const usage = calculateStorageUsage(usedMb, totalMb)
  const percentage = usage.percentage
  
  // Compute breakdown proportionally from actual usedMb
  const pdfGb    = formatStorageSize(usedMb * 0.50)
  const officeGb = formatStorageSize(usedMb * 0.30)
  const foldersGb = formatStorageSize(usedMb * 0.20)


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? 'block' : 'hidden'}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.95, y: isOpen ? 0 : 15 }}
        className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quota-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>

        <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 shrink-0">
            <HardDrive className="size-5.5" />
          </div>
          <div className="text-left">
            <h3 id="quota-title" className="text-base font-bold text-slate-900 dark:text-white">
              {t.sharedFiles.quotaTitle}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
              {t.sharedFiles.quotaSub}
            </p>
          </div>
        </div>

        <div className="space-y-5 text-left">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{formatStorageSize(usedMb)}</span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-550 ml-1 font-sans">
                {t.sharedFiles.usedOf} {formatStorageSize(totalMb)} {t.sharedFiles.used.toLowerCase()}
              </span>
            </div>
            <span className="text-sm font-bold text-[#3155F6] dark:text-blue-450">
              {percentage}% {t.sharedFiles.used}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-[#3155F6] rounded-full"
            />
          </div>

          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'vi' ? 'Tài liệu PDF' : (language === 'ja' ? 'PDFドキュメント' : (language === 'ko' ? 'PDF 문서' : 'PDF Documents'))}
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{pdfGb}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'vi' ? 'Tệp văn phòng (.docx, .xlsx)' : (language === 'ja' ? 'Officeファイル（.docx, .xlsx）' : (language === 'ko' ? '오피스 파일 (.docx, .xlsx)' : 'Office Files (.docx, .xlsx)'))}
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{officeGb}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {language === 'vi' ? 'Thư mục & Tài sản nhóm' : (language === 'ja' ? 'フォルダとグループアセット' : (language === 'ko' ? '폴더 및 그룹 자산' : 'Folders & Group Assets'))}
                </span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{foldersGb}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
          >
            {t.sharedFiles.closeDetails}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const pageContainerVariants: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
}

const pageItemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 26,
      mass: 0.8
    }
  }
}

export function SharedFilesPage() {
  const toast = useToast()
  const { t, language } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const { fileId } = useParams<{ fileId: string }>()

  // State Management
  const [files, setFiles] = useState<SharedFile[]>([])
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | 'all'>('all')

  const fetchWorkspaces = async () => {
    if (!user?.id) return
    try {
      const response = await apiClient.get(`/workspaces?userId=${user.id}`)
      const list = response.data?.data || response.data || []
      setWorkspaces(list)
    } catch (err) {
      console.error("Failed to load user workspaces", err)
    }
  }

  const mapMimeOrExtensionToType = (fileType: string, fileName: string): 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'image' | 'txt' | 'folder' => {
    const nameLower = fileName.toLowerCase()
    if (nameLower.endsWith('.pdf')) return 'pdf'
    if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) return 'docx'
    if (nameLower.endsWith('.ppt') || nameLower.endsWith('.pptx')) return 'pptx'
    if (nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx')) return 'xlsx'
    if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) return 'image'
    if (nameLower.endsWith('.txt')) return 'txt'
    
    const typeLower = (fileType || '').toLowerCase()
    if (typeLower.includes('pdf')) return 'pdf'
    if (typeLower.includes('word') || typeLower.includes('msword') || typeLower.includes('officedocument.wordprocessingml')) return 'docx'
    if (typeLower.includes('powerpoint') || typeLower.includes('officedocument.presentationml')) return 'pptx'
    if (typeLower.includes('excel') || typeLower.includes('spreadsheet') || typeLower.includes('officedocument.spreadsheetml')) return 'xlsx'
    if (typeLower.includes('image') || typeLower.includes('png') || typeLower.includes('jpeg')) return 'image'
    return 'txt'
  }

  const fetchSharedFiles = async () => {
    try {
      const fetched = await sharedFileService.getSharedFiles()
      const mapped = fetched.map((f: any) => {
        const fileName = f.originalFileName || f.name || f.title || 'Untitled'
        const normalizedType = mapMimeOrExtensionToType(f.fileType || f.type, f.fileName || f.originalFileName || f.name || f.title || '')
        return {
          ...f,
          id: String(f.documentId || f.id),
          name: fileName,
          description: f.description || '',
          type: normalizedType,
          url: f.url || `/api/documents/${f.documentId || f.id}/preview`
        }
      })
      setFiles(mapped)
    } catch (err) {
      console.error("Failed to load shared files", err)
    }
  }

  const fetchCombinedCollaborators = async () => {
    if (!user?.id) return
    try {
      const wsResponse = await apiClient.get(`/workspaces?userId=${user.id}`)
      const list = wsResponse.data?.data || wsResponse.data || []
      
      const allMembersMap: Record<string, ActiveCollaborator> = {}
      for (const ws of list) {
        try {
          const detailRes = await apiClient.get(`/workspaces/${ws.id}?userId=${user.id}`)
          const detail = detailRes.data?.data || detailRes.data
          if (detail && detail.members) {
            detail.members.forEach((mem: any) => {
              const role = mem.role === 'OWNER' ? 'Owner' : (mem.role === 'COLLABORATOR' ? 'Editor' : 'View Only')
              allMembersMap[mem.userId] = {
                id: String(mem.userId),
                name: mem.fullName || mem.email || 'Member',
                email: mem.email || '',
                role: role
              }
            })
          }
        } catch (e) {
          // ignore error
        }
      }
      
      const collabsList = Object.values(allMembersMap)
      if (collabsList.length > 0) {
        setActiveCollaborators(collabsList)
      } else {
        setActiveCollaborators([
          {
            id: String(user.id),
            name: user.name || 'Me',
            email: user.email || '',
            role: 'Owner'
          }
        ])
      }
    } catch (err) {
      console.error("Failed to load combined collaborators", err)
    }
  }

  const fetchWorkspaceDetails = async (workspaceId: string) => {
    if (!user?.id) return
    try {
      const response = await apiClient.get(`/workspaces/${workspaceId}?userId=${user.id}`)
      const workspace = response.data?.data || response.data
      if (workspace) {
        const mappedFiles: SharedFile[] = (workspace.documents || []).map((doc: any) => {
          const fileName = doc.originalFileName || doc.title || 'Untitled'
          const fileType = mapMimeOrExtensionToType(doc.mimeType || doc.fileType, doc.fileName || doc.originalFileName || doc.title || '')
          return {
            id: String(doc.documentId),
            name: fileName,
            owner: doc.addedByName || 'System',
            permission: (doc.role === 'OWNER' ? 'Owner' : (doc.role === 'COLLABORATOR' ? 'Editor' : 'Viewer')) as any,
            dateShared: doc.createdAt ? doc.createdAt.substring(0, 10) : 'Just now',
            type: fileType,
            size: doc.fileSize ? formatStorageSize(doc.fileSize) : '0 Bytes',
            totalPages: 10,
            description: doc.description || 'No description available.',
            tags: [],
            previewContent: doc.description,
            url: `/api/documents/${doc.documentId}/preview`
          }
        })
        setFiles(mappedFiles)

        const mappedCollabs: ActiveCollaborator[] = (workspace.members || []).map((mem: any) => ({
          id: String(mem.userId),
          name: mem.fullName || mem.email || 'Member',
          email: mem.email || '',
          role: mem.role === 'OWNER' ? 'Owner' : (mem.role === 'COLLABORATOR' ? 'Editor' : 'View Only'),
          avatarUrl: undefined
        }))
        setActiveCollaborators(mappedCollabs)
      }
    } catch (err) {
      console.error("Failed to load workspace details", err)
      toast.error(language === 'vi' ? 'Không thể tải chi tiết nhóm' : 'Failed to load workspace details')
    }
  }

  useEffect(() => {
    fetchWorkspaces()
  }, [user])

  useEffect(() => {
    if (selectedWorkspaceId === 'all') {
      fetchSharedFiles()
      fetchCombinedCollaborators()
    } else {
      fetchWorkspaceDetails(selectedWorkspaceId)
    }
  }, [selectedWorkspaceId, user])

  useEffect(() => {
    let totalBytes = 0
    files.forEach(f => {
      let bytes = 0
      const matches = f.size.match(/^([\d.]+)\s*([A-Za-z]+)/)
      if (matches) {
        const value = parseFloat(matches[1])
        const unit = matches[2].toUpperCase()
        if (unit === 'GB') bytes = value * 1024 * 1024 * 1024
        else if (unit === 'MB') bytes = value * 1024 * 1024
        else if (unit === 'KB') bytes = value * 1024
        else bytes = value
      }
      totalBytes += bytes
    })
    const totalMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100
    localStorage.setItem('aiStudyHubStorageUsedMb', totalMb.toString())
    window.dispatchEvent(new Event('aiStudyHubUserChanged'))
  }, [files])

  // Modals Visibility
  const [modals, setModals] = useState({
    quota: false,
    collaborators: false,
    aiInsights: false,
    aiReport: false,
    invite: false,
    summary: false,
    quiz: false,
    rename: false,
    permission: false,
    share: false,
    confirmDelete: false,
    addCollaborator: false,
    createWorkspace: false,
  })

  // Workspace Configurations
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'with-me' | 'by-me'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('recent')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [favorites, setFavorites] = useState<string[]>(['file-1'])
  const [viewingFile, setViewingFile] = useState<SharedFile | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const handleUploadClick = () => {
    if (selectedWorkspaceId === 'all') {
      const msg = language === 'vi'
        ? 'Vui lòng chọn một nhóm học tập ở góc trên bên trái trước khi tải lên tài liệu!'
        : 'Please select a study group from the top-left dropdown before uploading documents!'
      toast.error(msg)
    } else {
      setUploadModalOpen(true)
    }
  }

  // Report Document States
  const [reportDoc, setReportDoc] = useState<SharedFile | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)

  const [activeCollaborators, setActiveCollaborators] = useState<ActiveCollaborator[]>([])

  const handleUpdateCollaboratorRole = (id: string, newRole: 'Owner' | 'Editor' | 'View Only') => {
    setActiveCollaborators(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, role: newRole }
          const msg = language === 'vi' 
            ? `Đã cập nhật vai trò của ${c.name} thành ${newRole}`
            : (language === 'ja'
              ? `${c.name}の役割を${newRole}に更新しました`
              : (language === 'ko'
                ? `${c.name}의 역할을 ${newRole}(으)로 업데이트했습니다`
                : `Updated ${c.name}'s role to ${newRole}`))
          toast.success(msg)
          return updated
        }
        return c
      })
    )
  }

  const handleAddNewCollaborator = async (name: string, email: string, role: 'Owner' | 'Editor' | 'View Only') => {
    try {
      if (selectedWorkspaceId && selectedWorkspaceId !== 'all') {
        const apiRole = role === 'Editor' ? 'COLLABORATOR' : (role === 'Owner' ? 'OWNER' : 'VIEWER')
        await apiClient.post(`/workspaces/${selectedWorkspaceId}/invite`, {
          email,
          role: apiRole,
          inviterId: user?.id
        })
        const msg = language === 'vi'
          ? `Đã gửi lời mời thành công đến ${email} với vai trò ${role}`
          : `Invitation sent successfully to ${email} as ${role}`
        toast.success(msg)
        fetchWorkspaceDetails(selectedWorkspaceId)
      } else {
        const newCollab: ActiveCollaborator = {
          id: `collab-${Date.now()}`,
          name,
          email,
          role
        }
        setActiveCollaborators(prev => [...prev, newCollab])
        const msg = language === 'vi'
          ? `Đã thêm ${name} làm ${role}`
          : (language === 'ja'
            ? `${name}を${role}として追加しました`
            : (language === 'ko'
              ? `${name}님을 ${role}(으)로 추가했습니다`
              : `Added ${name} as ${role}`))
        toast.success(msg)
      }
    } catch (err: any) {
      console.error('Failed to invite member:', err)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to invite member'
      toast.error(errorMsg)
    }
  }

  const [peopleFilter, setPeopleFilter] = useState('All')
  const [lastModifiedFilter, setLastModifiedFilter] = useState('All')
  const [sourceFilter, setSourceFilter] = useState('All')

  // Viewport tracking & select stability checks
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  useEffect(() => {
    if (location.state?.resetViewer) {
      setViewingFile(null)
      setSelectedFile(null)
      setIsUploading(false)
    }
  }, [location.state])

  const handleSelectFile = (file: SharedFile) => {
    if (selectedFile?.id === file.id) {
      setSelectedFile(null)
    } else {
      setSelectedFile(file)
    }
  }

  // Comments mapping by file ID
  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>({
    'file-1': [
      {
        id: 'c1',
        user: 'Sarah Jenkins',
        text: 'We should add the diagram for cell division...',
        time: '15 min ago',
        avatarBg: 'bg-emerald-500'
      }
    ],
    'file-2': [],
    'file-3': [],
    'file-4': [],
    'file-5': []
  })

  // Share Access State Management
  const [fileCollaborators, setFileCollaborators] = useState<Record<string, Collaborator[]>>({
    'file-1': [
      {
        id: 'owner',
        name: 'Sarah Jenkins',
        email: 'sarah@example.com',
        role: 'owner',
        avatarBg: 'bg-[#0fbf7c]'
      },
      {
        id: '1',
        name: 'Huynh Duy Binh',
        email: 'binh@example.com',
        role: 'editor',
        avatarBg: 'bg-[#5f6ffc]'
      },
      {
        id: '2',
        name: 'Ngoc Tan',
        email: 'tan@example.com',
        role: 'viewer',
        avatarBg: 'bg-[#fc9d1c]'
      }
    ],
    'file-2': [
      {
        id: 'owner',
        name: 'David Kim',
        email: 'david@example.com',
        role: 'owner',
        avatarBg: 'bg-[#0fbf7c]'
      },
      {
        id: '1',
        name: 'Huynh Duy Binh',
        email: 'binh@example.com',
        role: 'editor',
        avatarBg: 'bg-[#5f6ffc]'
      }
    ],
    'file-3': [
      {
        id: 'owner',
        name: 'Emily Chen',
        email: 'emily@example.com',
        role: 'owner',
        avatarBg: 'bg-[#0fbf7c]'
      },
      {
        id: '2',
        name: 'Ngoc Tan',
        email: 'tan@example.com',
        role: 'viewer',
        avatarBg: 'bg-[#fc9d1c]'
      }
    ],
    'file-4': [
      {
        id: 'owner',
        name: 'Tôi',
        email: 'binh@example.com',
        role: 'owner',
        avatarBg: 'bg-indigo-600'
      },
      {
        id: '1',
        name: 'Sarah Jenkins',
        email: 'sarah@example.com',
        role: 'viewer',
        avatarBg: 'bg-emerald-500'
      },
      {
        id: '2',
        name: 'David Kim',
        email: 'david@example.com',
        role: 'editor',
        avatarBg: 'bg-blue-500'
      }
    ],
    'file-5': [
      {
        id: 'owner',
        name: 'Tôi',
        email: 'binh@example.com',
        role: 'owner',
        avatarBg: 'bg-indigo-600'
      }
    ]
  })

  const [fileGeneralAccess, setFileGeneralAccess] = useState<Record<string, 'restricted' | 'public'>>({
    'file-1': 'restricted',
    'file-2': 'public',
    'file-3': 'restricted',
    'file-4': 'restricted',
    'file-5': 'restricted'
  })


  // Keep viewing file reference updated
  useEffect(() => {
    if (viewingFile) {
      const current = files.find(f => f.id === viewingFile.id)
      if (current) {
        setViewingFile(current)
      } else {
        setViewingFile(null)
      }
    }
  }, [files, viewingFile])

  // Sync route fileId with viewingFile state
  useEffect(() => {
    if (fileId) {
      const fileToView = files.find(f => f.id === fileId)
      if (fileToView) {
        setViewingFile(fileToView)
      } else {
        const folderFiles = [
          {
            id: 'lit-rev-pdf',
            name: 'Literature Review.pdf',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 24, 2023',
            type: 'pdf',
            size: '12.4 MB',
            description: 'Literature review notes for multivariable computational sweep analysis.',
            tags: ['Biology', 'Research'],
            previewContent: 'Literature Review mock details content.'
          },
          {
            id: 'dataset-xlsx',
            name: 'Data Set_V1.xlsx',
            owner: 'Marcus Knight',
            permission: 'Editor',
            dateShared: 'Oct 23, 2023',
            type: 'xlsx',
            size: '8.2 MB',
            description: 'Spreadsheet of computational modeling sweeps and volt sweeps.',
            tags: ['Spreadsheet', 'Data'],
            previewContent: 'Data Set sweeps table mock.'
          },
          {
            id: 'proj-outline-docx',
            name: 'Project_Outline.docx',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 22, 2023',
            type: 'docx',
            size: '1.5 MB',
            description: 'Conceptual outlines and study rules.',
            tags: ['Outline', 'Draft'],
            previewContent: 'Project Outline draft rules.'
          },
          {
            id: 'diagram-png',
            name: 'Brainstorming_Diagram.png',
            owner: 'Alex Chen',
            permission: 'Viewer',
            dateShared: 'Oct 21, 2023',
            type: 'png',
            size: '4.2 MB',
            description: 'Concept graphics of study design.',
            tags: ['Image', 'Brainstorming'],
            previewContent: 'Image mockup visualization.'
          },
          {
            id: 'notes-docx',
            name: 'Research Notes.docx',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 20, 2023',
            type: 'docx',
            size: '2.1 MB',
            description: 'Notes on biological sweeper models.',
            tags: ['Research', 'Notes'],
            previewContent: 'Research notes details.'
          },
          {
            id: 'results-xlsx',
            name: 'Lab Results.xlsx',
            owner: 'Marcus Knight',
            permission: 'Editor',
            dateShared: 'Oct 19, 2023',
            type: 'xlsx',
            size: '6.8 MB',
            description: 'Lab sweep result calculations.',
            tags: ['Data', 'Results'],
            previewContent: 'Lab results sweep calculations.'
          },
          {
            id: 'presentation-pptx',
            name: 'Presentation Draft.pptx',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 18, 2023',
            type: 'pptx',
            size: '15.7 MB',
            description: 'Slide drafts for midterm presentation.',
            tags: ['Presentation', 'Draft'],
            previewContent: 'PowerPoint draft slides.'
          },
          {
            id: 'meeting-mp3',
            name: 'Meeting Recording.mp3',
            owner: 'Alex Chen',
            permission: 'Viewer',
            dateShared: 'Oct 17, 2023',
            type: 'mp3',
            size: '18.4 MB',
            description: 'Meeting recording audio file.',
            tags: ['Audio', 'Meeting'],
            previewContent: 'Meeting transcription text.'
          },
          {
            id: 'video-mp4',
            name: 'Experiment Video.mp4',
            owner: 'Marcus Knight',
            permission: 'Editor',
            dateShared: 'Oct 16, 2023',
            type: 'mp4',
            size: '124 MB',
            description: 'Video recording of the sweep sweep experiment.',
            tags: ['Video', 'Experiment'],
            previewContent: 'Video player capture.'
          },
          {
            id: 'ref-pdf',
            name: 'References.pdf',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 15, 2023',
            type: 'pdf',
            size: '3.5 MB',
            description: 'Reference citations for the project outline.',
            tags: ['References', 'PDF'],
            previewContent: 'Reference citations details.'
          },
          {
            id: 'budget-xlsx',
            name: 'Budget Sheet.xlsx',
            owner: 'Sarah Jenkins',
            permission: 'Viewer',
            dateShared: 'Oct 14, 2023',
            type: 'xlsx',
            size: '2.9 MB',
            description: 'Budget estimates sheet.',
            tags: ['Budget', 'Excel'],
            previewContent: 'Budget columns table.'
          },
          {
            id: 'timeline-docx',
            name: 'Timeline.docx',
            owner: 'Marcus Knight',
            permission: 'Editor',
            dateShared: 'Oct 13, 2023',
            type: 'docx',
            size: '1.1 MB',
            description: 'Milestones and tasks deadline timeline document.',
            tags: ['Timeline', 'Tasks'],
            previewContent: 'Milestone timeline notes.'
          }
        ]

        const folderFile = folderFiles.find(f => f.id === fileId)
        if (folderFile) {
          setViewingFile(folderFile as any)
        }
      }
    } else {
      setViewingFile(null)
    }
  }, [fileId, files])

  // Action handlers
  const handleAIAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      toast.success(t.toasts.aiAnalysisComplete)
    }, 1000)
  }

  const handleOpenFile = (file: SharedFile) => {
    if (typeof window !== 'undefined') {
      window.history.scrollRestoration = 'manual'
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto, [class*="overflow-y-auto"], .overflow-auto, [class*="overflow-auto"]')
      scrollableContainers.forEach((container) => {
        container.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        })
      })
    }
    setViewingFile(file)
    const prefix = language === 'vi' ? 'Đang mở' : (language === 'ja' ? '開いています' : (language === 'ko' ? '열기 중' : 'Opening'))
    toast.success(`${prefix} ${file.name}`)
  }

  const handleDownload = (file: SharedFile) => {
    const prefix = language === 'vi' ? 'Đang tải xuống' : (language === 'ja' ? 'ダウンロード中' : (language === 'ko' ? '다운로드 중' : 'Downloading'))
    toast.success(`${prefix} ${file.name}`)
    try {
      if (file.url) {
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const content = file.previewContent || `Mock content for ${file.name}`
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
      setTimeout(() => {
        toast.success(t.toasts.downloadSuccess)
      }, 1000)
    } catch (err) {
      toast.error(t.toasts.downloadFailed)
    }
  }

  const handleRenameConfirm = (newName: string) => {
    if (!selectedFile) return
    const logItem = {
      id: `h-log-${Date.now()}`,
      user: selectedFile.owner === 'me' ? 'Tôi' : (user?.name || 'Alex Rivera'),
      action: language === 'vi' 
        ? `Đã đổi tên tài liệu từ "${selectedFile.name}" thành "${newName}"` 
        : `Renamed document from "${selectedFile.name}" to "${newName}"`,
      time: language === 'vi' ? 'Vừa xong' : 'Just now',
      avatarBg: selectedFile.owner === 'me' ? 'bg-indigo-600' : 'bg-blue-500'
    }
    setFiles(prev =>
      prev.map(f => (f.id === selectedFile.id ? { 
        ...f, 
        name: newName, 
        editHistory: [logItem, ...(f.editHistory || [])] 
      } : f))
    )
    setSelectedFile(prev => (prev ? { 
      ...prev, 
      name: newName,
      editHistory: [logItem, ...(prev.editHistory || [])]
    } : null))
    toast.success(t.toasts.renameSuccess)
    setModals(prev => ({ ...prev, rename: false }))
  }

  const handlePermissionConfirm = (newPermission: any) => {
    if (!selectedFile) return
    const logItem = {
      id: `h-log-${Date.now()}`,
      user: selectedFile.owner === 'me' ? 'Tôi' : (user?.name || 'Alex Rivera'),
      action: language === 'vi' 
        ? `Đã thay đổi quyền tài liệu thành ${newPermission}` 
        : `Changed document permission to ${newPermission}`,
      time: language === 'vi' ? 'Vừa xong' : 'Just now',
      avatarBg: selectedFile.owner === 'me' ? 'bg-indigo-600' : 'bg-blue-500'
    }
    setFiles(prev =>
      prev.map(f => (f.id === selectedFile.id ? { 
        ...f, 
        permission: newPermission,
        editHistory: [logItem, ...(f.editHistory || [])]
      } : f))
    )
    setSelectedFile(prev => (prev ? { 
      ...prev, 
      permission: newPermission,
      editHistory: [logItem, ...(prev.editHistory || [])]
    } : null))
    toast.success(t.toasts.permissionSuccess)
    setModals(prev => ({ ...prev, permission: false }))
  }

  const handleDeleteConfirm = async () => {
    if (!selectedFile) return
    if (selectedWorkspaceId !== 'all') {
      try {
        await apiClient.delete(
          `/workspaces/${selectedWorkspaceId}/documents/${selectedFile.id}?userId=${user?.id}`
        )
        toast.success(t.toasts.deleteSuccess || 'Document removed from workspace successfully')
        fetchWorkspaceDetails(selectedWorkspaceId)
      } catch (err: any) {
        console.error('Failed to remove document from workspace:', err)
        const errMsg = err.response?.data?.message || err.message || 'Failed to delete file'
        toast.error(errMsg)
      }
    } else {
      setFiles(prev => prev.filter(f => f.id !== selectedFile.id))
      toast.success(t.toasts.deleteSuccess)
    }
    setSelectedFile(null)
    setViewingFile(null)
    setModals(prev => ({ ...prev, confirmDelete: false }))
  }

  const handleStarToggle = (file: SharedFile) => {
    setFavorites(prev => {
      const isFav = prev.includes(file.id)
      if (isFav) {
        const msg = language === 'vi' ? `Đã xóa "${file.name}" khỏi mục yêu thích` : (language === 'ja' ? `お気に入りから「${file.name}」を削除しました` : (language === 'ko' ? `즐겨찾기에서 "${file.name}"을(를) 제거했습니다` : `Removed "${file.name}" from favorites`))
        toast.success(msg)
        return prev.filter(id => id !== file.id)
      } else {
        const msg = language === 'vi' ? `Đã thêm "${file.name}" vào mục yêu thích` : (language === 'ja' ? `お気に入りへ「${file.name}」を追加しました` : (language === 'ko' ? `즐겨찾기에 "${file.name}"을(를) 추가했습니다` : `Added "${file.name}" to favorites`))
        toast.success(msg)
        return [...prev, file.id]
      }
    })
  }

  const handleAddComment = (text: string) => {
    if (!selectedFile) return
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      user: 'Alex Rivera',
      text,
      time: 'Just now',
      avatarBg: 'bg-indigo-650'
    }
    setCommentsMap(prev => ({
      ...prev,
      [selectedFile.id]: [newComment, ...(prev[selectedFile.id] || [])]
    }))
    const msg = language === 'vi' ? 'Đã thêm bình luận' : (language === 'ja' ? 'コメントを追加しました' : (language === 'ko' ? '댓글이 추가되었습니다' : 'Comment added'))
    toast.success(msg)
  }

  const handleRegenerateSummary = () => {
    setIsRegenerating(true)
    setTimeout(() => {
      setIsRegenerating(false)
      if (selectedFile) {
        const updatedSummary = `Regenerated Version: This workspace document covers advanced key terms and context analysis. Key takeaways focus on active revision notes, formulas, and structural summaries verified by AI Guard.`
        setFiles(prev =>
          prev.map(f => (f.id === selectedFile.id ? { ...f, summary: updatedSummary } : f))
        )
        setSelectedFile(prev => (prev ? { ...prev, summary: updatedSummary } : null))
      }
      const msg = language === 'vi' ? 'Đã tạo lại bản tóm tắt' : (language === 'ja' ? '要約を再生成しました' : (language === 'ko' ? '요약이 재생성되었습니다' : 'Summary regenerated'))
      toast.success(msg)
    }, 1000)
  }

  // Parse Date helper for sorting
  const parseDate = (dStr: string) => {
    if (dStr.includes('ago') || dStr.includes('now') || dStr.includes('Just')) {
      return Date.now()
    }
    // Handle mock dates like "May 18" or "Mar 28" (assume current year 2026)
    if (dStr.includes('May') || dStr.includes('Mar') || dStr.includes('Oct')) {
      return new Date(`${dStr}, 2026`).getTime()
    }
    return new Date(dStr).getTime()
  }

  // Filtering files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (file.owner && file.owner.toLowerCase().includes(searchQuery.toLowerCase()))

    let matchesType = true
    if (fileTypeFilter !== 'All') {
      const filterLower = fileTypeFilter.toLowerCase()
      if (filterLower === 'folder') {
        matchesType = file.type === 'folder'
      } else if (filterLower === 'doc') {
        matchesType = file.type === 'docx' || file.type === 'pdf'
      } else if (filterLower === 'spreadsheet') {
        matchesType = file.type === 'xlsx'
      } else {
        matchesType = file.type === filterLower
      }
    }

    let matchesPeople = true
    if (peopleFilter !== 'All') {
      matchesPeople = file.owner?.toLowerCase().includes(peopleFilter.toLowerCase()) || false
    }

    let matchesLastModified = true
    if (lastModifiedFilter !== 'All') {
      const fileTime = parseDate(file.dateShared)
      const now = Date.now()
      const oneWeek = 7 * 24 * 60 * 60 * 1000
      const thirtyDays = 30 * 24 * 60 * 60 * 1000

      if (lastModifiedFilter === 'today') {
        matchesLastModified = (now - fileTime) < (24 * 60 * 60 * 1000)
      } else if (lastModifiedFilter === 'last7days') {
        matchesLastModified = (now - fileTime) < oneWeek
      } else if (lastModifiedFilter === 'last30days') {
        matchesLastModified = (now - fileTime) < thirtyDays
      }
    }

    let matchesSource = true
    if (sourceFilter !== 'All') {
      if (sourceFilter === 'sharedWithMe') {
        matchesSource = file.owner !== 'me'
      } else if (sourceFilter === 'ownedByMe') {
        matchesSource = file.owner === 'me'
      }
    }

    let matchesTab = true
    if (activeTab === 'with-me') {
      matchesTab = file.owner !== 'me'
    } else if (activeTab === 'by-me') {
      matchesTab = file.owner === 'me'
    }

    return matchesSearch && matchesType && matchesPeople && matchesLastModified && matchesSource && matchesTab
  }).sort((a, b) => {
    const timeA = parseDate(a.dateShared)
    const timeB = parseDate(b.dateShared)
    return sortOrder === 'recent' ? timeB - timeA : timeA - timeB
  })

  // Full Screen File Viewer Mode
  if (viewingFile) {
    const showToastWrapper = (msg: string) => {
      if (msg.startsWith('❌')) toast.error(msg)
      else if (msg.startsWith('⚠️')) toast.warning(msg)
      else toast.success(msg)
    }

    return (
      <SharedFileViewer
        file={viewingFile}
        onBack={() => {
          setViewingFile(null)
          setSelectedFile(null)
        }}
        showToast={showToastWrapper}
        onDownload={handleDownload}
      />
    )
  }

  // Upload Files Flow
  if (isUploading) {
    return (
      <UploadFilesSection
        onBack={() => setIsUploading(false)}
        onSave={(newFile) => {
          setFiles(prev => [newFile, ...prev])
          setSelectedFile(newFile)
          setIsUploading(false)
          toast.success('File saved successfully')
        }}
      />
    )
  }

  // activeCollaborators state is now used instead of the static collaboratorsCountList

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="show"
      className="text-slate-900 dark:text-slate-100"
    >
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full relative">
        
        <motion.div
          className="flex-1 w-full min-w-0 overflow-hidden space-y-6"
          transition={shouldReduceMotion ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 28, mass: 0.8 }}
        >
          <motion.div variants={pageItemVariants}>
            <SharedWorkspaceHeader
              onUploadClick={handleUploadClick}
              onInviteClick={() => setModals(prev => ({ ...prev, invite: true }))}
              onAIAnalyzeClick={handleAIAnalyze}
              onCreateWorkspaceClick={() => setModals(prev => ({ ...prev, createWorkspace: true }))}
              isAnalyzing={isAnalyzing}
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              onSelectWorkspace={setSelectedWorkspaceId}
            />
          </motion.div>

          <motion.div variants={pageItemVariants}>
            <WorkspaceStatsCards
              onViewAIReport={() => setModals(prev => ({ ...prev, aiReport: true }))}
              onStorageCardClick={() => setModals(prev => ({ ...prev, quota: true }))}
              onActiveCardClick={() => setModals(prev => ({ ...prev, collaborators: true }))}
              activeCollaboratorsCount={activeCollaborators.length}
            />
          </motion.div>

          <motion.div variants={pageItemVariants}>
            <SharedFilesTabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
            />
          </motion.div>

          <motion.div variants={pageItemVariants}>
            <WorkspaceFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              fileTypeFilter={fileTypeFilter}
              onFileTypeChange={setFileTypeFilter}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              peopleFilter={peopleFilter}
              onPeopleFilterChange={setPeopleFilter}
              lastModifiedFilter={lastModifiedFilter}
              onLastModifiedFilterChange={setLastModifiedFilter}
              sourceFilter={sourceFilter}
              onSourceFilterChange={setSourceFilter}
            />
          </motion.div>

          <motion.div variants={pageItemVariants}>
            <WorkspaceFileList
              files={filteredFiles}
              selectedFile={selectedFile}
              viewMode={viewMode}
              favorites={favorites}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              onSelectFile={handleSelectFile}
              onOpenFile={handleOpenFile}
              onStarToggle={handleStarToggle}
              isWorkspaceEmpty={files.length === 0}
              onUploadClick={handleUploadClick}
              onRename={(file) => {
                setSelectedFile(file)
                setModals(prev => ({ ...prev, rename: true }))
              }}
              onChangePermission={(file) => {
                setSelectedFile(file)
                setModals(prev => ({ ...prev, permission: true }))
              }}
              onRemoveAccess={(file) => {
                setSelectedFile(file)
                setModals(prev => ({ ...prev, confirmDelete: true }))
              }}
              onDownload={handleDownload}
              onShareAccess={(file) => {
                setSelectedFile(file)
                setModals(prev => ({ ...prev, share: true }))
                const prefix = language === 'vi' ? 'Đang chia sẻ' : (language === 'ja' ? '共有中' : (language === 'ko' ? '공유 중' : 'Sharing'))
                toast.success(`${prefix} ${file.name}`)
              }}
              onReport={(file) => {
                setReportDoc(file)
                setReportReason('')
              }}
            />
          </motion.div>
        </motion.div>

        {/* Right side panel */}
        <AnimatePresence>
          {selectedFile && (
            <motion.aside
              key="workspace-right-sidebar"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isLargeScreen ? 20 : 0, y: isLargeScreen ? 0 : 16 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: isLargeScreen ? 20 : 0, y: isLargeScreen ? 0 : 16 }}
              transition={shouldReduceMotion ? { duration: 0.25 } : { type: "spring", stiffness: 220, damping: 26, mass: 0.8 }}
              className="w-full lg:w-[240px] xl:w-[280px] 2xl:w-[320px] shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-none"
            >
              <WorkspaceRightPanel
                file={selectedFile}
                comments={commentsMap[selectedFile.id] || []}
                onAddComment={handleAddComment}
                onRegenerateSummary={handleRegenerateSummary}
                isRegenerating={isRegenerating}
                onOpenFullSummary={() => setModals(prev => ({ ...prev, summary: true }))}
                onGenerateQuiz={() => setModals(prev => ({ ...prev, quiz: true }))}
                onAskAI={() => {
                  const msg = language === 'vi' ? 'Trợ lý AI đã sẵn sàng' : (language === 'ja' ? 'AIアシスタントの準備ができました' : (language === 'ko' ? 'AI 어시스턴트가 준비되었습니다' : 'AI Assistant ready for query'))
                  toast.success(msg)
                  const commentInput = document.querySelector('input[placeholder="Add a comment..."]') as HTMLInputElement
                  if (commentInput) {
                    commentInput.focus()
                  }
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>

      </div>

      {/* Modals & Dialogs */}
      <QuotaDetailsModal
        isOpen={modals.quota}
        onClose={() => setModals(prev => ({ ...prev, quota: false }))}
        usedMb={getCurrentUserStorageSummary().usedMb}
        totalMb={getCurrentUserStorageSummary().totalMb}
      />

      <CollaboratorsModal
        isOpen={modals.collaborators}
        onClose={() => setModals(prev => ({ ...prev, collaborators: false }))}
        collaborators={activeCollaborators}
        onUpdateRole={handleUpdateCollaboratorRole}
        canManage={activeCollaborators.some(c => c.email.toLowerCase() === user?.email?.toLowerCase() && c.role === 'Owner') || user?.role?.toLowerCase() === 'admin'}
        onOpenAddCollaborator={() => setModals(prev => ({ ...prev, addCollaborator: true }))}
      />

      <AddCollaboratorModal
        isOpen={modals.addCollaborator}
        onClose={() => setModals(prev => ({ ...prev, addCollaborator: false }))}
        onAddCollaborator={handleAddNewCollaborator}
        collaborators={activeCollaborators}
      />

      <AIInsightsModal
        isOpen={modals.aiInsights}
        onClose={() => setModals(prev => ({ ...prev, aiInsights: false }))}
      />

      <InviteModal
        isOpen={modals.invite}
        onClose={() => setModals(prev => ({ ...prev, invite: false }))}
        defaultWorkspaceId={selectedWorkspaceId}
        onInviteSubmit={async (email, role, workspaceId) => {
          try {
            const apiRole = role === 'Editor' ? 'COLLABORATOR' : 'VIEWER'
            await apiClient.post(`/workspaces/${workspaceId}/invite`, {
              email,
              role: apiRole,
              inviterId: user?.id
            })
            const msg = language === 'vi' 
              ? `Đã gửi lời mời thành công đến ${email} với vai trò ${role}` 
              : `Invitation sent successfully to ${email} as ${role}`
            toast.success(msg)
          } catch (err: any) {
            console.error('Failed to invite member:', err)
            const errorMsg = err.response?.data?.message || err.message || 'Failed to invite member'
            toast.error(errorMsg)
          } finally {
            setModals(prev => ({ ...prev, invite: false }))
          }
        }}
      />

      <CreateWorkspaceModal
        isOpen={modals.createWorkspace}
        onClose={() => setModals(prev => ({ ...prev, createWorkspace: false }))}
        onSuccess={(newWs) => {
          if (newWs) {
            setWorkspaces(prev => [newWs, ...prev])
            setSelectedWorkspaceId(newWs.id.toString())
          }
        }}
      />

      <AIReportModal
        isOpen={modals.aiReport}
        onClose={() => setModals(prev => ({ ...prev, aiReport: false }))}
        onOptimized={() => {
          fetchSharedFiles()
          setModals(prev => ({ ...prev, aiReport: false }))
        }}
      />

      <SummaryModal
        isOpen={modals.summary}
        onClose={() => setModals(prev => ({ ...prev, summary: false }))}
        file={selectedFile}
      />

      <QuizModal
        isOpen={modals.quiz}
        onClose={() => setModals(prev => ({ ...prev, quiz: false }))}
        file={selectedFile}
      />

      <ShareAccessModal
        isOpen={modals.share}
        onClose={() => setModals(prev => ({ ...prev, share: false }))}
        fileId={selectedFile?.id}
        fileName={selectedFile?.name || ''}
        collaborators={selectedFile?.id ? (fileCollaborators[selectedFile.id] || [
          {
            id: 'owner',
            name: selectedFile.owner === 'me' ? 'Tôi' : (selectedFile.owner || 'Alex Rivera'),
            email: `${(selectedFile.owner || 'alex').toLowerCase().replace(' ', '')}@example.com`,
            role: 'owner',
            avatarBg: 'bg-[#0fbf7c]'
          }
        ]) : []}
        onCollaboratorsChange={(newCollabs) => {
          if (selectedFile?.id) {
            const oldCollabs = fileCollaborators[selectedFile.id] || []
            let logMsg = ''
            
            if (newCollabs.length > oldCollabs.length) {
              const added = newCollabs.find(nc => !oldCollabs.some(oc => oc.id === nc.id))
              if (added) {
                logMsg = language === 'vi' 
                  ? `Đã thêm thành viên ${added.name} (${added.role})`
                  : `Added collaborator ${added.name} (${added.role})`
              }
            } else if (newCollabs.length < oldCollabs.length) {
              const removed = oldCollabs.find(oc => !newCollabs.some(nc => nc.id === oc.id))
              if (removed) {
                logMsg = language === 'vi'
                  ? `Đã xóa quyền truy cập của ${removed.name}`
                  : `Removed access for ${removed.name}`
              }
            } else {
              const changed = newCollabs.find(nc => {
                const oc = oldCollabs.find(o => o.id === nc.id)
                return oc && oc.role !== nc.role
              })
              if (changed) {
                logMsg = language === 'vi'
                  ? `Đã cập nhật vai trò của ${changed.name} thành ${changed.role}`
                  : `Updated role of ${changed.name} to ${changed.role}`
              }
            }

            if (logMsg) {
              const logItem = {
                id: `h-log-${Date.now()}`,
                user: 'Tôi',
                action: logMsg,
                time: language === 'vi' ? 'Vừa xong' : 'Just now',
                avatarBg: 'bg-indigo-600'
              }
              setFiles(prev =>
                prev.map(f => (f.id === selectedFile.id ? { 
                  ...f, 
                  editHistory: [logItem, ...(f.editHistory || [])] 
                } : f))
              )
              setSelectedFile(prev => (prev ? { 
                ...prev, 
                editHistory: [logItem, ...(prev.editHistory || [])]
              } : null))
            }

            setFileCollaborators(prev => ({
              ...prev,
              [selectedFile.id]: newCollabs
            }))
          }
        }}
        generalAccess={selectedFile?.id ? (fileGeneralAccess[selectedFile.id] || 'restricted') : 'restricted'}
        onGeneralAccessChange={(type) => {
          if (selectedFile?.id) {
            const logItem = {
              id: `h-log-${Date.now()}`,
              user: 'Tôi',
              action: language === 'vi'
                ? `Đã thay đổi quyền truy cập chung thành ${type === 'public' ? 'Bất kỳ ai có liên kết' : 'Hạn chế'}`
                : `Changed general access to ${type === 'public' ? 'Anyone with link' : 'Restricted'}`,
              time: language === 'vi' ? 'Vừa xong' : 'Just now',
              avatarBg: 'bg-indigo-600'
            }
            setFiles(prev =>
              prev.map(f => (f.id === selectedFile.id ? { 
                ...f, 
                editHistory: [logItem, ...(f.editHistory || [])] 
              } : f))
            )
            setSelectedFile(prev => (prev ? { 
              ...prev, 
              editHistory: [logItem, ...(prev.editHistory || [])]
            } : null))
            
            setFileGeneralAccess(prev => ({
              ...prev,
              [selectedFile.id]: type
            }))
          }
        }}
      />

      <RenameFileModal
        isOpen={modals.rename}
        onClose={() => setModals(prev => ({ ...prev, rename: false }))}
        onRename={handleRenameConfirm}
        initialName={selectedFile?.name || ''}
        files={files}
      />

      <ChangePermissionModal
        isOpen={modals.permission}
        onClose={() => setModals(prev => ({ ...prev, permission: false }))}
        onUpdatePermission={handlePermissionConfirm}
        fileName={selectedFile?.name || ''}
        initialPermission={selectedFile?.permission || 'Viewer'}
      />

      <ConfirmRemoveAccessModal
        isOpen={modals.confirmDelete}
        onClose={() => setModals(prev => ({ ...prev, confirmDelete: false }))}
        onConfirm={handleDeleteConfirm}
        fileName={selectedFile?.name || ''}
      />

      <SharedFilesUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSave={async (newFile, rawFile, metadata) => {
          if (rawFile && selectedWorkspaceId !== 'all') {
            try {
              const title = newFile.name.substring(0, newFile.name.lastIndexOf('.')) || newFile.name
              const uploadedDoc = await documentService.uploadDocument(
                rawFile,
                title,
                metadata?.description || '',
                metadata?.subject || 'GENERAL',
                'SHARED', // visibility
                Number(user?.id || 1),
                metadata?.tags || []
              )
              
              await apiClient.post(
                `/workspaces/${selectedWorkspaceId}/documents/${uploadedDoc.id}?userId=${user?.id}`
              )
              
              toast.success(t.toasts?.uploadSuccess || 'File uploaded successfully')
              fetchWorkspaceDetails(selectedWorkspaceId)
            } catch (err: any) {
              console.error('Failed to upload file to backend:', err)
              const errMsg = err.response?.data?.message || err.message || 'Upload failed'
              toast.error(errMsg)
            }
          } else {
            setFiles(prev => [newFile, ...prev])
            setSelectedFile(newFile)
            toast.success(t.toasts?.uploadSuccess || 'File uploaded successfully')
          }
        }}
      />

      {/* Custom Report File Modal */}
      <Modal
        isOpen={!!reportDoc}
        onClose={() => setReportDoc(null)}
        title={language === 'vi' ? 'Báo cáo tài liệu vi phạm' : 'Report Document Violation'}
        className="max-w-md"
      >
        {reportDoc && (
          <div className="space-y-4 text-left">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-350 font-medium">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-extrabold text-amber-900 dark:text-amber-300 mb-1">
                  {language === 'vi' ? 'Lưu ý kiểm duyệt' : 'Moderation Warning'}
                </p>
                <p className="leading-relaxed font-semibold">
                  {language === 'vi' 
                    ? 'Báo cáo của bạn sẽ được gửi trực tiếp đến quản trị viên hệ thống để kiểm duyệt và đưa ra quyết định xử lý (cắm cờ, từ chối, hoặc xóa tài liệu).' 
                    : 'Your report will be forwarded to system administrators for moderation and action (flagging, rejection, or deletion).'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'vi' ? 'Tài liệu bị báo cáo' : 'Reported Document'}
              </label>
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-205 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                <FileTypeIcon type={reportDoc.type} className="shrink-0 size-9" />
                <div className="min-w-0">
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-white truncate">
                    {reportDoc.name}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                    {language === 'vi' ? `Tải lên bởi: ${reportDoc.owner}` : `Uploaded by: ${reportDoc.owner}`}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'vi' ? 'Lý do báo cáo vi phạm' : 'Reason for Report'}
              </label>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder={
                  language === 'vi'
                    ? 'Vui lòng cung cấp lý do chi tiết (tối thiểu 10 ký tự)... Ví dụ: chứa tài liệu rò rỉ đề thi, quảng cáo spam, vi phạm bản quyền...'
                    : 'Please provide details (minimum 10 characters)... E.g. contains exam leaks, spam, plagiarism...'
                }
                className="w-full h-32 px-4 py-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 dark:text-white text-sm font-semibold transition-all resize-none placeholder-slate-400"
              />
              <div className="flex justify-between items-center mt-1.5 px-1 font-semibold">
                <span className={cn(
                  "text-[10px]",
                  reportReason.trim().length >= 10 ? "text-emerald-500 font-bold" : "text-slate-400 dark:text-slate-500"
                )}>
                  {language === 'vi' 
                    ? `Độ dài: ${reportReason.trim().length}/10 ký tự` 
                    : `Length: ${reportReason.trim().length}/10 chars`}
                </span>
                {reportReason.trim().length > 0 && reportReason.trim().length < 10 && (
                  <span className="text-[10px] font-bold text-red-500">
                    {language === 'vi' ? 'Lý do quá ngắn' : 'Reason too short'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportDoc(null)}
                disabled={isSubmittingReport}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={reportReason.trim().length < 10 || isSubmittingReport}
                onClick={async () => {
                  setIsSubmittingReport(true)
                  try {
                    // Let's call the report submission logic via reportService
                    await reportService.reportDocument({
                      documentId: reportDoc.id,
                      reason: "Document violation report",
                      details: reportReason.trim(),
                      reportedFile: reportDoc.name,
                      reporterName: user?.name || 'Alex Rivera',
                      reporterEmail: user?.email || 'alex@example.com',
                    })

                    // 3. Show beautiful notification
                    const successMsg = language === 'vi'
                      ? `Đã gửi báo cáo vi phạm cho tài liệu "${reportDoc.name}" tới Quản trị viên thành công!`
                      : `Violation report for "${reportDoc.name}" successfully submitted to Administrator!`
                    toast.success(successMsg)
                    
                    setReportDoc(null)
                    setReportReason('')
                  } catch (err) {
                    toast.error(language === 'vi' ? 'Gửi báo cáo thất bại, vui lòng thử lại!' : 'Failed to submit report!')
                  } finally {
                    setIsSubmittingReport(false)
                  }
                }}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-md cursor-pointer",
                  reportReason.trim().length >= 10 && !isSubmittingReport
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10 hover:shadow-lg"
                    : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-655 cursor-not-allowed shadow-none"
                )}
              >
                {isSubmittingReport 
                  ? (language === 'vi' ? 'Đang gửi...' : 'Submitting...') 
                  : (language === 'vi' ? 'Xác nhận gửi' : 'Confirm & Submit')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  )
}

export default SharedFilesPage

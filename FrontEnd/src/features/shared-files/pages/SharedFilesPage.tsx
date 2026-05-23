import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'

// Workspace Components
import SharedWorkspaceHeader from '../components/SharedWorkspaceHeader'
import WorkspaceStatsCards from '../components/WorkspaceStatsCards'
import WorkspaceFilterBar from '../components/WorkspaceFilterBar'
import WorkspaceFileList from '../components/WorkspaceFileList'
import WorkspaceRightPanel, { CommentItem } from '../components/WorkspaceRightPanel'
import SharedFileViewer from '../components/SharedFileViewer'
import UploadFilesSection from '../components/UploadFilesSection'

// Modals & Overlays
import InviteModal from '../components/InviteModal'
import AIReportModal from '../components/AIReportModal'
import SummaryModal from '../components/SummaryModal'
import QuizModal from '../components/QuizModal'
import ShareAccessModal, { Collaborator } from '../components/ShareAccessModal'
import RenameFileModal from '../components/RenameFileModal'
import ChangePermissionModal from '../components/ChangePermissionModal'
import ConfirmRemoveAccessModal from '../components/ConfirmRemoveAccessModal'
import CollaboratorsModal from '../components/CollaboratorsModal'
import AIInsightsModal from '../components/AIInsightsModal'
import { SharedFile } from '../components/SharedFilesTable'
import { X, HardDrive } from 'lucide-react'

// Inline Quota details view modal
interface QuotaDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  usedGb: number
  totalGb: number
}

function QuotaDetailsModal({ isOpen, onClose, usedGb, totalGb }: QuotaDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const percentage = (usedGb / totalGb) * 100

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
              Shared Storage Quota
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
              Detailed analysis of shared cloud volume
            </p>
          </div>
        </div>

        <div className="space-y-5 text-left">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">{usedGb}GB</span>
              <span className="text-sm font-bold text-slate-400 dark:text-slate-550 ml-1 font-sans">of {totalGb}GB used</span>
            </div>
            <span className="text-sm font-bold text-[#3155F6] dark:text-blue-450">{percentage.toFixed(0)}% Used</span>
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
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">PDF Documents</span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">6.2 GB</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Office Files (.docx, .xlsx)</span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">3.8 GB</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-850">
              <div className="flex items-center gap-3">
                <div className="size-2.5 rounded-full bg-indigo-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Folders & Group Assets</span>
              </div>
              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">2.4 GB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export function SharedFilesPage() {
  const toast = useToast()

  // State Management
  const [files, setFiles] = useState<SharedFile[]>([
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
      previewContent: 'Biology 101 Midterm Notes preview content.'
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
      previewContent: 'Folder contents: assets, design specifications.'
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
      previewContent: 'Voltage, Current, Resistance sweep tables.'
    }
  ])

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
  })

  // Workspace Configurations
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('recent')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [favorites, setFavorites] = useState<string[]>(['file-1'])
  const [viewingFile, setViewingFile] = useState<SharedFile | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
    'file-3': []
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
    ]
  })

  const [fileGeneralAccess, setFileGeneralAccess] = useState<Record<string, 'restricted' | 'public'>>({
    'file-1': 'restricted',
    'file-2': 'public',
    'file-3': 'restricted'
  })

  // Select Default Biology Notes file on mount
  useEffect(() => {
    if (!selectedFile && files.length > 0) {
      const bioFile = files.find(f => f.id === 'file-1') || files[0]
      setSelectedFile(bioFile)
    }
  }, [files, selectedFile])

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

  // Action handlers
  const handleAIAnalyze = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      toast.success('AI analysis completed')
    }, 1000)
  }

  const handleOpenFile = (file: SharedFile) => {
    setViewingFile(file)
    toast.success(`Opening ${file.name}`)
  }

  const handleDownload = (file: SharedFile) => {
    toast.success(`Downloading ${file.name}`)
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
        toast.success('Download completed')
      }, 1000)
    } catch (err) {
      toast.error('Download failed')
    }
  }

  const handleRenameConfirm = (newName: string) => {
    if (!selectedFile) return
    setFiles(prev =>
      prev.map(f => (f.id === selectedFile.id ? { ...f, name: newName } : f))
    )
    setSelectedFile(prev => (prev ? { ...prev, name: newName } : null))
    toast.success('File renamed successfully')
    setModals(prev => ({ ...prev, rename: false }))
  }

  const handlePermissionConfirm = (newPermission: 'Editor' | 'Commenter' | 'Viewer') => {
    if (!selectedFile) return
    setFiles(prev =>
      prev.map(f => (f.id === selectedFile.id ? { ...f, permission: newPermission } : f))
    )
    setSelectedFile(prev => (prev ? { ...prev, permission: newPermission } : null))
    toast.success('Permission updated successfully')
    setModals(prev => ({ ...prev, permission: false }))
  }

  const handleDeleteConfirm = () => {
    if (!selectedFile) return
    setFiles(prev => prev.filter(f => f.id !== selectedFile.id))
    toast.success('Access removed successfully')
    setSelectedFile(null)
    setViewingFile(null)
    setModals(prev => ({ ...prev, confirmDelete: false }))
  }

  const handleStarToggle = (file: SharedFile) => {
    setFavorites(prev => {
      const isFav = prev.includes(file.id)
      if (isFav) {
        toast.success(`Removed "${file.name}" from favorites`)
        return prev.filter(id => id !== file.id)
      } else {
        toast.success(`Added "${file.name}" to favorites`)
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
    toast.success('Comment added')
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
      toast.success('Summary regenerated')
    }, 1000)
  }

  // Parse Date helper for sorting
  const parseDate = (dStr: string) => {
    if (dStr.includes('ago') || dStr.includes('now') || dStr.includes('Just')) {
      return Date.now()
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
      } else {
        matchesType = file.type === filterLower
      }
    }
    return matchesSearch && matchesType
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
        onBack={() => setViewingFile(null)}
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

  const collaboratorsCountList = [
    {
      id: '1',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      role: 'Owner',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
    },
    {
      id: '2',
      name: 'David Kim',
      email: 'david.kim@example.com',
      role: 'Editor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    },
    {
      id: '3',
      name: 'Emily Chen',
      email: 'emily.chen@example.com',
      role: 'View Only',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80'
    },
    {
      id: '4',
      name: 'Marcus Knight',
      email: 'marcus@example.com',
      role: 'Editor'
    },
    {
      id: '5',
      name: 'Emma Watson',
      email: 'emma.watson@example.com',
      role: 'Editor'
    },
    {
      id: '6',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'View Only'
    },
    {
      id: '7',
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      role: 'View Only'
    },
    {
      id: '8',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'Owner'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-slate-900 dark:text-slate-100"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Middle main content workspace area */}
        <div className="lg:col-span-8 space-y-6">
          <SharedWorkspaceHeader
            onUploadClick={() => setIsUploading(true)}
            onInviteClick={() => setModals(prev => ({ ...prev, invite: true }))}
            onAIAnalyzeClick={handleAIAnalyze}
            isAnalyzing={isAnalyzing}
          />

          <WorkspaceStatsCards
            onViewAIReport={() => setModals(prev => ({ ...prev, aiReport: true }))}
            onStorageCardClick={() => setModals(prev => ({ ...prev, quota: true }))}
            onActiveCardClick={() => setModals(prev => ({ ...prev, collaborators: true }))}
          />

          <WorkspaceFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            fileTypeFilter={fileTypeFilter}
            onFileTypeChange={setFileTypeFilter}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          <WorkspaceFileList
            files={filteredFiles}
            selectedFile={selectedFile}
            viewMode={viewMode}
            favorites={favorites}
            onSelectFile={setSelectedFile}
            onOpenFile={handleOpenFile}
            onStarToggle={handleStarToggle}
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
              toast.success(`Sharing ${file.name}`)
            }}
          />
        </div>

        {/* Right side panel */}
        <div className="lg:col-span-4 h-full">
          <WorkspaceRightPanel
            file={selectedFile}
            comments={selectedFile ? (commentsMap[selectedFile.id] || []) : []}
            onAddComment={handleAddComment}
            onRegenerateSummary={handleRegenerateSummary}
            isRegenerating={isRegenerating}
            onOpenFullSummary={() => setModals(prev => ({ ...prev, summary: true }))}
            onGenerateQuiz={() => setModals(prev => ({ ...prev, quiz: true }))}
            onAskAI={() => {
              toast.success('AI Assistant ready for query')
              const commentInput = document.querySelector('input[placeholder="Add a comment..."]') as HTMLInputElement
              if (commentInput) {
                commentInput.focus()
              }
            }}
          />
        </div>

      </div>

      {/* Modals & Dialogs */}
      <QuotaDetailsModal
        isOpen={modals.quota}
        onClose={() => setModals(prev => ({ ...prev, quota: false }))}
        usedGb={12.4}
        totalGb={50}
      />

      <CollaboratorsModal
        isOpen={modals.collaborators}
        onClose={() => setModals(prev => ({ ...prev, collaborators: false }))}
        collaborators={collaboratorsCountList}
      />

      <AIInsightsModal
        isOpen={modals.aiInsights}
        onClose={() => setModals(prev => ({ ...prev, aiInsights: false }))}
      />

      <InviteModal
        isOpen={modals.invite}
        onClose={() => setModals(prev => ({ ...prev, invite: false }))}
        onInviteSubmit={(email, role) => {
          toast.success(`Invitation sent successfully to ${email} as ${role}`)
          setModals(prev => ({ ...prev, invite: false }))
        }}
      />

      <AIReportModal
        isOpen={modals.aiReport}
        onClose={() => setModals(prev => ({ ...prev, aiReport: false }))}
        onOptimize={() => {
          toast.success('AI Workspace optimized successfully')
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
            name: selectedFile.owner || 'Alex Rivera',
            email: `${(selectedFile.owner || 'alex').toLowerCase().replace(' ', '')}@example.com`,
            role: 'owner',
            avatarBg: 'bg-[#0fbf7c]'
          }
        ]) : []}
        onCollaboratorsChange={(newCollabs) => {
          if (selectedFile?.id) {
            setFileCollaborators(prev => ({
              ...prev,
              [selectedFile.id]: newCollabs
            }))
          }
        }}
        generalAccess={selectedFile?.id ? (fileGeneralAccess[selectedFile.id] || 'restricted') : 'restricted'}
        onGeneralAccessChange={(type) => {
          if (selectedFile?.id) {
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
    </motion.div>
  )
}

export default SharedFilesPage

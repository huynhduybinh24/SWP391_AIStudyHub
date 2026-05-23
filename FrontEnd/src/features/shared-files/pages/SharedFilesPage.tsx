import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HardDrive, Users, Sparkles, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { SummaryCard } from '../components/SummaryCard'
import { CollaboratorsModal, Collaborator } from '../components/CollaboratorsModal'
import { AIInsightsModal } from '../components/AIInsightsModal'
import { SharedFilesTabs } from '../components/SharedFilesTabs'
import { SharedFilesTable, SharedFile } from '../components/SharedFilesTable'
import { RenameFileModal } from '../components/RenameFileModal'
import { PermissionModal } from '../components/PermissionModal'
import { ShareFileModal } from '../components/ShareFileModal'
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal'
import { SharedFileViewer } from '../components/SharedFileViewer'

// Quota Breakdown Modal
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quota-title"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-205 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <HardDrive className="size-5.5" />
              </div>
              <div>
                <h3 id="quota-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Shared Storage Quota
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-550 font-medium">
                  Detailed analysis of shared cloud volume
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{usedGb}GB</span>
                  <span className="text-sm font-bold text-slate-400 dark:text-slate-550 ml-1">of {totalGb}GB used</span>
                </div>
                <span className="text-sm font-bold text-[#3155F6] dark:text-blue-450">{percentage.toFixed(0)}% Used</span>
              </div>

              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-blue-555 to-[#3155F6] rounded-full"
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
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">2.0 GB</span>
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
      )}
    </AnimatePresence>
  )
}

export function SharedFilesPage() {
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'with-me' | 'by-me'>('with-me')

  // Modals visibility
  const [isQuotaOpen, setIsQuotaOpen] = useState(false)
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false)
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false)

  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isPermissionOpen, setIsPermissionOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  // Current action file context
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null)

  // Active full viewer state
  const [viewingFile, setViewingFile] = useState<SharedFile | null>(null)

  // State for files
  const [sharedWithMeFiles, setSharedWithMeFiles] = useState<SharedFile[]>([
    {
      id: 'with-me-1',
      name: 'Biology 101 Midterm Notes.pdf',
      owner: 'Sarah Jenkins',
      permission: 'View Only',
      dateShared: '2023-10-24',
      type: 'pdf',
      size: '2.4 MB',
      totalPages: 42,
      description: 'Comprehensive study guide and midterm summary for General Biology 101, containing cellular respiration diagrams, metabolic pathway notes, and mitosis stages.',
      tags: ['Biology', 'Notes', 'Midterm'],
      previewContent: 'Biology 101 Midterm Notes preview content.'
    },
    {
      id: 'with-me-2',
      name: 'Group Project Specifications.docx',
      owner: 'David Kim',
      permission: 'Editor',
      dateShared: '2023-10-22',
      type: 'docx',
      size: '15.8 MB',
      totalPages: 15,
      description: 'Draft guidelines and technical specifications for the term team software engineering projects, detailing coding standards and API endpoint requirements.',
      tags: ['Project', 'Specs', 'Group'],
      previewContent: 'Group Project Specifications draft. Outlines project requirements and timelines.'
    },
    {
      id: 'with-me-3',
      name: 'Physics Lab Data.xlsx',
      owner: 'Emily Chen',
      permission: 'View Only',
      dateShared: '2023-10-18',
      type: 'xlsx',
      size: '1.2 MB',
      totalPages: 10,
      description: 'Tabulated values of raw experimental logs, voltage sweeps, and resistance indexes from the electromagnetism laboratory session.',
      tags: ['Physics', 'Lab', 'Data'],
      previewContent: 'Physics Lab Data table values.'
    }
  ])

  const [sharedByMeFiles, setSharedByMeFiles] = useState<SharedFile[]>([
    {
      id: 'by-me-1',
      name: 'Software Design Patterns.pdf',
      owner: 'Alex Rivera',
      sharedWith: 'Alex Rivera, +2 others',
      permission: 'Editor',
      dateShared: 'Nov 02, 2023',
      type: 'pdf',
      size: '4.8 MB',
      totalPages: 28,
      description: 'Detailed study notes covering Creational, Structural, and Behavioral patterns with sample class diagrams.',
      tags: ['SoftwareEng', 'DesignPatterns', 'StudyNotes'],
      previewContent: 'Software Design Patterns study guide.'
    },
    {
      id: 'by-me-2',
      name: 'Calculus_Summary_Final.docx',
      owner: 'Alex Rivera',
      sharedWith: 'Study Group A',
      permission: 'Viewer',
      dateShared: 'Oct 30, 2023',
      type: 'docx',
      size: '2.5 MB',
      totalPages: 12,
      description: 'Brief overview of core multivariable calculus calculations: gradient descent, Jacobian matrices, and double integrals.',
      tags: ['Calculus', 'Math', 'Final'],
      previewContent: 'Calculus Summary Final draft.'
    },
    {
      id: 'by-me-3',
      name: 'Research_Project_Data.xlsx',
      owner: 'Alex Rivera',
      sharedWith: 'Dr. Sarah',
      permission: 'Editor',
      dateShared: 'Oct 25, 2023',
      type: 'xlsx',
      size: '1.8 MB',
      totalPages: 8,
      description: 'Experimental telemetry tables containing data and statistical runs for the final research project.',
      tags: ['Research', 'Data', 'Spreadsheet'],
      previewContent: 'Research Project Data table with all experimental results.'
    }
  ])

  // Update viewingFile reference when modifications are made to the list in memory
  useEffect(() => {
    if (viewingFile) {
      const activeList = activeTab === 'with-me' ? sharedWithMeFiles : sharedByMeFiles
      const current = activeList.find(f => f.id === viewingFile.id)
      if (current) {
        setViewingFile(current)
      } else {
        // If file was deleted, exit viewer
        setViewingFile(null)
      }
    }
  }, [sharedWithMeFiles, sharedByMeFiles, activeTab, viewingFile])

  // Collaborators list
  const collaborators: Collaborator[] = [
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

  // Action handlers
  const handleOpenFile = (file: SharedFile) => {
    setViewingFile(file)
  }

  const handleDownload = (file: SharedFile) => {
    toast.success(`Downloading ${file.name}`)
  }

  const handleShareClick = (file: SharedFile) => {
    setSelectedFile(file)
    setIsShareOpen(true)
  }

  const handleShareSubmit = (email: string, role: 'Editor' | 'View Only') => {
    toast.success('Invitation sent successfully')
  }

  const handleRenameClick = (file: SharedFile) => {
    setSelectedFile(file)
    setIsRenameOpen(true)
  }

  const handleRenameConfirm = (newName: string) => {
    if (!selectedFile) return
    const updateList = (list: SharedFile[]) =>
      list.map((f) => (f.id === selectedFile.id ? { ...f, name: newName } : f))

    if (activeTab === 'with-me') {
      setSharedWithMeFiles(updateList(sharedWithMeFiles))
    } else {
      setSharedByMeFiles(updateList(sharedByMeFiles))
    }
    
    // Update preview selected file name
    setSelectedFile((prev) => (prev ? { ...prev, name: newName } : null))
    toast.success('File renamed successfully')
  }

  const handlePermissionClick = (file: SharedFile) => {
    setSelectedFile(file)
    setIsPermissionOpen(true)
  }

  const handlePermissionConfirm = (newPermission: 'Editor' | 'View Only') => {
    if (!selectedFile) return
    const resolvedPermission = newPermission === 'View Only' && activeTab === 'by-me' ? 'Viewer' : newPermission
    const updateList = (list: SharedFile[]) =>
      list.map((f) => (f.id === selectedFile.id ? { ...f, permission: resolvedPermission } : f))

    if (activeTab === 'with-me') {
      setSharedWithMeFiles(updateList(sharedWithMeFiles))
    } else {
      setSharedByMeFiles(updateList(sharedByMeFiles))
    }

    setSelectedFile((prev) => (prev ? { ...prev, permission: resolvedPermission } : null))

    toast.success(`Permission updated to ${newPermission}`)
  }

  const handleDeleteClick = (file: SharedFile) => {
    setSelectedFile(file)
    setIsConfirmDeleteOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!selectedFile) return

    if (activeTab === 'with-me') {
      setSharedWithMeFiles(sharedWithMeFiles.filter((f) => f.id !== selectedFile.id))
    } else {
      setSharedByMeFiles(sharedByMeFiles.filter((f) => f.id !== selectedFile.id))
    }

    toast.success('File deleted successfully')
    setIsConfirmDeleteOpen(false)
    setViewingFile(null) // Exit viewer if open
  }

  const currentFiles = activeTab === 'with-me' ? sharedWithMeFiles : sharedByMeFiles

  // Switch to full layout file viewer if active
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 text-slate-900 dark:text-slate-100"
    >
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Shared Files
        </h1>
        <p className="text-sm font-semibold text-slate-550 dark:text-slate-450 mt-1.5">
          Manage files shared with you and by you.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Shared Quota Card */}
        <SummaryCard
          title="Shared Quota"
          icon={<HardDrive className="size-5" />}
          onClick={() => setIsQuotaOpen(true)}
        >
          <div className="space-y-3.5">
            <div>
              <span className="text-3xl font-black text-slate-900 dark:text-white">12</span>
              <span className="text-sm font-bold text-slate-550 dark:text-slate-400 ml-1">GB</span>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-bold mt-1">of 50GB Shared Limit</p>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[24%] bg-[#3155F6] dark:bg-blue-500 rounded-full" />
            </div>
          </div>
        </SummaryCard>

        {/* Collaborators Card */}
        <SummaryCard
          title="Collaborators"
          icon={<Users className="size-5" />}
          onClick={() => setIsCollaboratorsOpen(true)}
        >
          <div className="flex items-center justify-between">
            <span className="text-5xl font-black text-[#3155F6] dark:text-blue-400">8</span>
            <div className="flex -space-x-2.5 overflow-hidden">
              {collaborators.slice(0, 3).map((col) => (
                <div
                  key={col.id}
                  className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-xs"
                >
                  {col.avatarUrl ? (
                    <img src={col.avatarUrl} alt={col.name} className="h-full w-full object-cover" />
                  ) : (
                    col.name[0]
                  )}
                </div>
              ))}
              <div className="size-8.5 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-100 dark:bg-slate-800/80 text-slate-550 dark:text-slate-350 flex items-center justify-center font-bold text-[10px]">
                +5
              </div>
            </div>
          </div>
        </SummaryCard>

        {/* AI Insights Card */}
        <SummaryCard
          title="AI Insights"
          icon={<Sparkles className="size-5 text-indigo-500 dark:text-indigo-400" />}
          className="relative overflow-hidden group/insight"
        >
          <div className="flex flex-col h-full justify-between gap-3 text-xs leading-relaxed font-semibold text-slate-655 dark:text-slate-350">
            <p className="line-clamp-3">
              Most activity is on <strong className="text-slate-800 dark:text-slate-150">Biology 101 Notes</strong>. 'Alex M.' recently requested edit access to your <strong className="text-slate-800 dark:text-slate-150">Lab Report Draft</strong>.
            </p>
            <button
              type="button"
              onClick={() => setIsAIInsightsOpen(true)}
              className="text-[#3155F6] dark:text-blue-450 hover:text-blue-650 dark:hover:text-blue-300 font-extrabold flex items-center gap-1 transition-all cursor-pointer w-fit text-left focus:outline-none hover:underline bg-transparent border-none"
            >
              View Full Summary
            </button>
          </div>
        </SummaryCard>
      </div>

      {/* Main Files Table Area */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <SharedFilesTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        <div className="p-1">
          <SharedFilesTable
            files={currentFiles}
            onOpen={handleOpenFile}
            onRename={handleRenameClick}
            onChangePermission={handlePermissionClick}
            onRemoveAccess={handleDeleteClick}
            isSharedByMe={activeTab === 'by-me'}
          />
        </div>
      </div>

      {/* Modals & Dialogs */}
      <QuotaDetailsModal
        isOpen={isQuotaOpen}
        onClose={() => setIsQuotaOpen(false)}
        usedGb={12}
        totalGb={50}
      />

      <CollaboratorsModal
        isOpen={isCollaboratorsOpen}
        onClose={() => setIsCollaboratorsOpen(false)}
        collaborators={collaborators}
      />

      <AIInsightsModal
        isOpen={isAIInsightsOpen}
        onClose={() => setIsAIInsightsOpen(false)}
      />

      <ShareFileModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        onShare={handleShareSubmit}
        fileName={selectedFile?.name || ''}
      />

      <RenameFileModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        onRename={handleRenameConfirm}
        initialName={selectedFile?.name || ''}
      />

      <PermissionModal
        isOpen={isPermissionOpen}
        onClose={() => setIsPermissionOpen(false)}
        onUpdatePermission={handlePermissionConfirm}
        fileName={selectedFile?.name || ''}
        initialPermission={selectedFile?.permission || 'View Only'}
      />

      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        fileName={selectedFile?.name || ''}
      />
    </motion.div>
  )
}

export default SharedFilesPage

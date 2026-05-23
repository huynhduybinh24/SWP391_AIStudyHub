import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Share2,
  User,
  Calendar,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Eye,
  Download,
  Upload,
  LayoutGrid,
  List,
  ArrowUpDown,
  Sparkles,
  Search,
  Check,
  Loader2,
  X,
  FileCode,
  Music,
  Video,
  GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { ShareAccessModal } from '@/components/shared/share-access/ShareAccessModal'
import type { Collaborator as ShareAccessCollab } from '@/components/shared/share-access/ShareAccessModal'

export type SharedFolderFile = {
  id: string
  name: string
  type: 'pdf' | 'xlsx' | 'docx' | 'png' | 'mp4' | 'mp3' | 'pptx' | string
  size: string
  fileTypeLabel: string
  imported?: boolean
  owner?: string
}

export type Collaborator = {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Editor' | 'Viewer'
  avatar?: string
  lastActive?: string
}

const mockFiles: SharedFolderFile[] = [
  {
    id: "file-1",
    name: "Literature Review.pdf",
    type: "pdf",
    size: "12.4 MB",
    fileTypeLabel: "PDF Document",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-2",
    name: "Data Set_V1.xlsx",
    type: "xlsx",
    size: "8.2 MB",
    fileTypeLabel: "Spreadsheet",
    imported: false,
    owner: "Marcus Knight"
  },
  {
    id: "file-3",
    name: "Project_Outline.docx",
    type: "docx",
    size: "1.5 MB",
    fileTypeLabel: "Word Doc",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-4",
    name: "Brainstorming_Diagram.png",
    type: "png",
    size: "4.2 MB",
    fileTypeLabel: "Image",
    imported: false,
    owner: "Alex Chen"
  },
  {
    id: "file-5",
    name: "Research Notes.docx",
    type: "docx",
    size: "2.1 MB",
    fileTypeLabel: "Word Doc",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-6",
    name: "Lab Results.xlsx",
    type: "xlsx",
    size: "6.8 MB",
    fileTypeLabel: "Spreadsheet",
    imported: false,
    owner: "Marcus Knight"
  },
  {
    id: "file-7",
    name: "Presentation Draft.pptx",
    type: "pptx",
    size: "15.7 MB",
    fileTypeLabel: "Presentation",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-8",
    name: "Meeting Recording.mp3",
    type: "mp3",
    size: "18.4 MB",
    fileTypeLabel: "Audio",
    imported: false,
    owner: "Alex Chen"
  },
  {
    id: "file-9",
    name: "Experiment Video.mp4",
    type: "mp4",
    size: "124 MB",
    fileTypeLabel: "Video",
    imported: false,
    owner: "Marcus Knight"
  },
  {
    id: "file-10",
    name: "References.pdf",
    type: "pdf",
    size: "3.5 MB",
    fileTypeLabel: "PDF Document",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-11",
    name: "Budget Sheet.xlsx",
    type: "xlsx",
    size: "2.9 MB",
    fileTypeLabel: "Spreadsheet",
    imported: false,
    owner: "Sarah Jenkins"
  },
  {
    id: "file-12",
    name: "Timeline.docx",
    type: "docx",
    size: "1.1 MB",
    fileTypeLabel: "Word Doc",
    imported: false,
    owner: "Marcus Knight"
  }
]

const mockCollaborators: Collaborator[] = [
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    lastActive: 'Active 2m ago'
  },
  {
    id: 'marcus',
    name: 'Marcus Knight',
    email: 'marcus.knight@example.com',
    role: 'Editor',
    lastActive: 'Active 15m ago'
  },
  {
    id: 'alex-chen',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    lastActive: 'Active 1h ago'
  }
]

// Size parsing utility to sort strings like "12.4 MB" or "124 MB" numerically
function parseSizeToBytes(sizeStr: string): number {
  const num = parseFloat(sizeStr)
  if (isNaN(num)) return 0
  const lower = sizeStr.toLowerCase()
  if (lower.includes('gb')) return num * 1024 * 1024 * 1024
  if (lower.includes('mb')) return num * 1024 * 1024
  if (lower.includes('kb')) return num * 1024
  return num
}

export function SharedFolderPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()

  // Standard State Management matching requested names
  const [files, setFiles] = useState<SharedFolderFile[]>(mockFiles)
  const [selectedFile, setSelectedFile] = useState<SharedFolderFile | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [shareAccessOpen, setShareAccessOpen] = useState(false)
  const [aiSynthesisOpen, setAiSynthesisOpen] = useState(false)
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false)
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('name')

  // Additional state hooks
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators)
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)

  // Sync with localStorage documents list on mount
  useEffect(() => {
    const saved = localStorage.getItem('ai_study_hub_documents')
    if (saved) {
      try {
        const docs = JSON.parse(saved) as any[]
        setFiles((prev) =>
          prev.map((file) => {
            const alreadyImported = docs.some((d) => d.fileName === file.name)
            return alreadyImported ? { ...file, imported: true } : file
          })
        )
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  // Action handlers
  const handleBackToNotifications = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
    navigate('/dashboard/notifications?tab=shared-files')
  }

  const handleManageAccess = () => {
    toast.success(t.sharedFolder.accessSettingsOpened || 'Access settings opened')
    setShareAccessOpen(true)
  }

  const handleInviteMembersClick = () => {
    toast.success(t.sharedFolder.inviteMembersOpened || 'Invite members opened')
    setShareAccessOpen(true)
  }

  // Generate Synthesis handler
  const handleGenerateSynthesis = () => {
    setIsGeneratingSynthesis(true)
    setTimeout(() => {
      setIsGeneratingSynthesis(false)
      setAiSynthesisOpen(true)
      toast.success(t.sharedFolder.aiSynthesisGenerated || 'AI synthesis generated')
    }, 1000)
  }

  // Synthesis detail helper values
  const synthesisReportContent = `=== AI STUDY HUB - RESEARCH SYNTHESIS REPORT ===
Folder Name: Group Project: Research Materials
Total Workspace Files: 12 files • 218 MB

=== FOLDER OVERVIEW ===
Group Project: Research Materials contains 12 active research files across PDF, Spreadsheet, Document, Image, Audio, and Video formats.

=== KEY FINDINGS ===
1. Qualitative data from literature reviews (PDFs) integrates semantically with qualitative notes (DOCX).
2. Quantitative tracking sheets (Excel) contain laboratory data that can be combined for unified charts.

=== DUPLICATE FILES DETECTED ===
- Redundancy found between Literature Review.pdf & References.pdf (84% semantic overlap).
- Redundant rows between Budget Sheet.xlsx and Data Set_V1.xlsx.

=== SUGGESTED RESEARCH SUMMARY ===
The combined research indicates a strong correlation between multivariable biological traits and computational models. Recommended steps involve consolidating quantitative cells and creating flashcard modules for terminologies.

=== RECOMMENDED NEXT ACTIONS ===
1. Consolidate the quantitative sheets.
2. Set up automated quizzes across terms.
3. Transcribe audio recording to text summary.`

  const handleDownloadSynthesisReport = () => {
    try {
      const blob = new Blob([synthesisReportContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Research_Materials_AI_Synthesis_Report.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t.sharedFolder.aiReportDownloaded || 'AI report downloaded')
    } catch {
      toast.error('Failed to download report')
    }
  }

  const handleCopySynthesisSummary = () => {
    navigator.clipboard.writeText(synthesisReportContent)
    toast.success(t.sharedFolder.summaryCopied || 'Summary copied')
  }

  const handleImportClick = (file: SharedFolderFile, e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.imported) {
      toast.warning(t.sharedFolder.alreadyImported || 'File already imported')
      return
    }
    setSelectedFile(file)
    setImportConfirmOpen(true)
  }

  const handleConfirmImport = () => {
    if (!selectedFile) return

    const saved = localStorage.getItem('ai_study_hub_documents')
    let currentDocs: any[] = []
    if (saved) {
      try {
        currentDocs = JSON.parse(saved)
      } catch (e) {
        currentDocs = []
      }
    }

    const mapFileTypeToDocType = (type: string): 'pdf' | 'word' | 'image' | 'text' | 'slides' => {
      const ext = type.toLowerCase()
      if (ext === 'pdf') return 'pdf'
      if (ext === 'docx') return 'word'
      if (ext === 'png' || ext === 'jpg') return 'image'
      if (ext === 'pptx') return 'slides'
      return 'text'
    }

    const newDoc = {
      id: `doc-imported-${Date.now()}`,
      title: selectedFile.name.replace(/\.[^/.]+$/, ''),
      fileName: selectedFile.name,
      uploadedAt: 'Imported Just Now',
      uploadedDateObj: new Date().toISOString(),
      size: selectedFile.size,
      sizeKb: parseSizeToBytes(selectedFile.size) / 1024,
      subject: 'GENERAL',
      status: 'ANALYZED',
      type: mapFileTypeToDocType(selectedFile.type)
    }

    localStorage.setItem('ai_study_hub_documents', JSON.stringify([newDoc, ...currentDocs]))

    setFiles((prev) =>
      prev.map((f) => (f.id === selectedFile.id ? { ...f, imported: true } : f))
    )

    toast.success(t.sharedFolder.fileImported || 'File imported to My Documents')
    setImportConfirmOpen(false)
  }

  const handlePreviewOpen = (file: SharedFolderFile, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(file)
    setPreviewOpen(true)
    toast.success(t.sharedFolder.previewOpened || 'Preview opened')
  }

  const handleOpenPageFull = (file: SharedFolderFile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    toast.success(t.sharedFolder.openingFile || 'Opening file')
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
    navigate(`/dashboard/shared/file/${file.id}`)
  }

  // Filtered files list matching query (by name, type, and collaborator/owner)
  const filteredFiles = files.filter((f) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    const matchesName = f.name.toLowerCase().includes(query)
    const matchesType = f.type.toLowerCase().includes(query) || f.fileTypeLabel.toLowerCase().includes(query)
    const matchesOwner = f.owner ? f.owner.toLowerCase().includes(query) : false

    return matchesName || matchesType || matchesOwner
  })

  // Sorted files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'size') {
      return parseSizeToBytes(a.size) - parseSizeToBytes(b.size)
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type)
    }
    if (sortBy === 'date') {
      return new Date(a.modifiedAt || '').getTime() - new Date(b.modifiedAt || '').getTime()
    }
    return 0
  })

  // Slice files based on showAllFiles state
  const filesToDisplay = showAllFiles ? sortedFiles : sortedFiles.slice(0, 4)

  // Bridge custom collaborators state into ShareAccessModal structure
  const mappedShareCollabs: ShareAccessCollab[] = collaborators.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    role: c.role.toLowerCase() as 'owner' | 'editor' | 'commenter' | 'viewer',
    avatarBg:
      c.role === 'Owner'
        ? 'bg-[#0fbf7c]'
        : c.role === 'Editor'
        ? 'bg-[#8B5CF6]'
        : 'bg-[#fc9d1c]'
  }))

  const handleCollaboratorsChange = (newCollabs: ShareAccessCollab[]) => {
    const updated: Collaborator[] = newCollabs.map((nc) => {
      const roleMap: Record<string, 'Owner' | 'Editor' | 'Viewer'> = {
        owner: 'Owner',
        editor: 'Editor',
        viewer: 'Viewer',
        commenter: 'Viewer'
      }
      return {
        id: nc.id,
        name: nc.name,
        email: nc.email,
        role: roleMap[nc.role] || 'Viewer'
      }
    })
    setCollaborators(updated)
  }

  // Popover / Detail handlers for collaborator
  const handleUpdateCollaboratorRole = (collabId: string, role: 'Owner' | 'Editor' | 'Viewer') => {
    const updated = collaborators.map((c) => (c.id === collabId ? { ...c, role } : c))
    setCollaborators(updated)
    if (selectedCollaborator && selectedCollaborator.id === collabId) {
      setSelectedCollaborator({ ...selectedCollaborator, role })
    }
    toast.success('Permission role updated')
  }

  const handleRemoveCollaboratorAccess = (collabId: string) => {
    const updated = collaborators.filter((c) => c.id !== collabId)
    setCollaborators(updated)
    setSelectedCollaborator(null)
    toast.success('Access removed')
  }

  return (
    <div className="w-full space-y-6 select-none pb-12 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* 1. Header Back Button */}
      <div className="flex items-center justify-between text-left">
        <button
          type="button"
          onClick={handleBackToNotifications}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus:outline-none"
          aria-label={t.sharedFolder.backToNotifications}
        >
          <ArrowLeft size={18} strokeWidth={2} />
          <span>{t.sharedFolder.backToNotifications}</span>
        </button>
      </div>

      {/* 2. Page Title & Action Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0b1c30] dark:text-white leading-tight">
            Group Project: Research Materials
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-[#737686] dark:text-slate-400 font-semibold">
            <span className="inline-flex items-center gap-2">
              <User className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span>
                {t.sharedFolder.collaborators}:{' '}
                <strong className="font-extrabold text-[#0b1c30] dark:text-slate-200">
                  Sarah Jenkins
                </strong>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span>
                Shared:{' '}
                <strong className="font-extrabold text-[#0b1c30] dark:text-slate-200">
                  Oct 24, 2023
                </strong>
              </span>
            </span>
            <span className="inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span>
                <strong className="font-extrabold text-[#0b1c30] dark:text-slate-200">
                  12 files &bull; 45 MB
                </strong>
              </span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManageAccess}
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#434655] dark:text-slate-300 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 px-5 py-2.5 rounded-xl text-sm font-extrabold transition-all shadow-xs shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          <span>{t.sharedFolder.manageAccess}</span>
        </button>
      </div>

      {/* 3. Main layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6">
          <CollaboratorsCard
            collaborators={collaborators}
            onInvite={handleInviteMembersClick}
            onSelectCollaborator={(c) => setSelectedCollaborator(c)}
          />
          <AIInsightCard
            summary={synthesisReportContent}
            isGenerating={isGeneratingSynthesis}
            onGenerate={handleGenerateSynthesis}
          />
        </div>

        {/* Right Files Catalog */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl shadow-sm overflow-visible">
          {/* Controls Header */}
          <div className="flex items-center justify-between bg-[#F4F7FE]/60 dark:bg-slate-800/60 border-b border-[#C3C6D7]/20 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-base font-bold text-[#0b1c30] dark:text-slate-200">
                12 {t.sharedFolder.filesTotal || 'Files Total'}
              </span>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-lg p-0.5 shadow-xs select-none">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid')
                    toast.success(t.sharedFolder.gridViewEnabled || 'Grid view enabled')
                  }}
                  className={cn(
                    'p-1.5 rounded transition-all cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-[#E8EEFF] dark:bg-blue-950 text-[#3155F6] dark:text-blue-400'
                      : 'text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list')
                    toast.success(t.sharedFolder.listViewEnabled || 'List view enabled')
                  }}
                  className={cn(
                    'p-1.5 rounded transition-all cursor-pointer',
                    viewMode === 'list'
                      ? 'bg-[#E8EEFF] dark:bg-blue-950 text-[#3155F6] dark:text-blue-400'
                      : 'text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                  title="List View"
                  aria-label="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sorting */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#434655] dark:text-slate-300 hover:text-[#3155F6] dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-4 h-4 text-[#737686] dark:text-slate-400" />
                <span>
                  {t.sharedFolder.sortBy}:{' '}
                  {sortBy === 'name'
                    ? t.sharedFolder.sortName
                    : sortBy === 'size'
                    ? t.sharedFolder.sortSize
                    : sortBy === 'type'
                    ? t.sharedFolder.sortType
                    : t.sharedFolder.sortDate}
                </span>
              </button>

              {isSortDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsSortDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl animate-fade-in">
                    {[
                      { key: 'name', label: t.sharedFolder.sortName },
                      { key: 'size', label: t.sharedFolder.sortSize },
                      { key: 'type', label: t.sharedFolder.sortType },
                      { key: 'date', label: t.sharedFolder.sortDate }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key)
                          setIsSortDropdownOpen(false)
                          toast.success(`${t.sharedFolder.sortBy || 'Sorted by'} ${opt.label}`)
                        }}
                        className={cn(
                          'flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-semibold transition-colors cursor-pointer',
                          sortBy === opt.key
                            ? 'bg-blue-50 text-[#3155F6] dark:bg-blue-955/30 dark:text-blue-400'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800'
                        )}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.key && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Search workspace */}
          <div className="p-6 pb-2">
            <div className="relative w-full max-w-md text-left">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'vi'
                    ? 'Tìm kiếm workspace...'
                    : language === 'ja'
                    ? 'ワークスペースを検索...'
                    : language === 'ko'
                    ? '워크스페이스 검색...'
                    : 'Search workspace...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700 pl-10 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:text-white"
              />
            </div>
          </div>

          {/* Files display */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filesToDisplay.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={(e) => handlePreviewOpen(file, e)}
                    onOpen={(e) => handleOpenPageFull(file, e)}
                    onImport={(e) => handleImportClick(file, e)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filesToDisplay.map((file) => (
                  <FileRowCard
                    key={file.id}
                    file={file}
                    onPreview={(e) => handlePreviewOpen(file, e)}
                    onOpen={(e) => handleOpenPageFull(file, e)}
                    onImport={(e) => handleImportClick(file, e)}
                  />
                ))}
              </div>
            )}

            {/* Empty results visual banner */}
            {sortedFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="size-12 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No files found
                </p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
              </div>
            )}

            {/* Expand / Collapse Button: View All Files */}
            {sortedFiles.length > 4 && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !showAllFiles
                    setShowAllFiles(nextState)
                    toast.success(
                      nextState
                        ? t.sharedFolder.showingAllFiles || 'Showing all files'
                        : t.sharedFolder.showingFewerFiles || 'Showing fewer files'
                    )
                  }}
                  className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#3155F6] hover:text-[#3155F6] rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer focus:outline-none"
                >
                  {showAllFiles ? 'Show Less' : 'View All Files'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shared Access Modal */}
      <ShareAccessModal
        isOpen={shareAccessOpen}
        onClose={() => setShareAccessOpen(false)}
        folderId="research-materials"
        folderName="Group Project: Research Materials"
        owner="Sarah Jenkins"
        type="folder"
        collaborators={mappedShareCollabs}
        onCollaboratorsChange={handleCollaboratorsChange}
      />

      {/* Confirm Import dialog */}
      <ConfirmImportModal
        isOpen={importConfirmOpen}
        onClose={() => setImportConfirmOpen(false)}
        onConfirm={handleConfirmImport}
        fileName={selectedFile?.name || ''}
      />

      {/* File preview modal */}
      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={selectedFile}
        onDownload={() => {
          toast.success('Downloading file...')
          setPreviewOpen(false)
        }}
        onOpenFull={() => {
          if (selectedFile) handleOpenPageFull(selectedFile)
          setPreviewOpen(false)
        }}
      />

      {/* AI Synthesis Modal */}
      <AISynthesisModal
        isOpen={aiSynthesisOpen}
        onClose={() => setAiSynthesisOpen(false)}
        onDownloadReport={handleDownloadSynthesisReport}
        onCopySummary={handleCopySynthesisSummary}
        reportContent={synthesisReportContent}
      />

      {/* Collaborator details popup popover modal */}
      <CollaboratorDetailModal
        isOpen={selectedCollaborator !== null}
        onClose={() => setSelectedCollaborator(null)}
        collaborator={selectedCollaborator}
        onUpdateRole={handleUpdateCollaboratorRole}
        onRemoveAccess={handleRemoveCollaboratorAccess}
      />
    </div>
  )
}

/* Local Sub-Components */

function CollaboratorsCard({
  collaborators,
  onInvite,
  onSelectCollaborator
}: {
  collaborators: Collaborator[]
  onInvite: () => void
  onSelectCollaborator: (c: Collaborator) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left">
      <h3 className="text-base font-black text-[#0b1c30] dark:text-white mb-4">
        {t.sharedFolder.collaborators}
      </h3>
      <div className="space-y-4">
        {collaborators.map((c) => {
          const ownerChar = c.name.charAt(0).toUpperCase()
          return (
            <div
              key={c.id}
              onClick={() => onSelectCollaborator(c)}
              className="flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {c.avatar ? (
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                      {ownerChar}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white dark:border-slate-900 rounded-full" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 leading-tight">
                    {c.name}
                  </p>
                  <p className="text-xs text-[#737686] dark:text-slate-400 font-semibold mt-0.5">
                    {c.role === 'Owner'
                      ? t.sharedFolder.owner
                      : c.role === 'Editor'
                      ? t.sharedFolder.canEdit
                      : t.sharedFolder.canView}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onInvite}
        className="w-full mt-5 py-2.5 border border-[#3155F6]/20 hover:border-[#3155F6] hover:bg-[#E8EEFF]/30 dark:border-blue-900/30 dark:hover:bg-blue-950/30 dark:text-blue-400 font-bold rounded-xl text-sm transition-colors cursor-pointer focus:outline-none"
      >
        {t.sharedFolder.inviteMembers}
      </button>
    </div>
  )
}

function AIInsightCard({
  summary,
  isGenerating,
  onGenerate
}: {
  summary: string
  isGenerating: boolean
  onGenerate: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-[#F8FAFC] dark:bg-slate-900/40 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-left space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#3155F6]" />
        <h3 className="text-base font-black text-[#0b1c30] dark:text-white">
          {t.sharedFolder.aiInsight || 'AI Insight'}
        </h3>
      </div>
      <p className="text-sm font-medium text-[#434655] dark:text-slate-300 leading-relaxed min-h-[60px]">
        {isGenerating ? (
          <span className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-[#3155F6]" />
            Generating combined insight...
          </span>
        ) : (
          "Click the button below to generate a synthesized research summary of this workspace."
        )}
      </p>

      <div className="pt-2">
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerate}
          className="w-full py-2.5 bg-[#3155F6] hover:bg-[#1A3ECF] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none flex items-center justify-center gap-2"
          aria-busy={isGenerating}
        >
          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t.sharedFolder.generateSynthesis || 'Generate Synthesis'}
        </button>
      </div>
    </div>
  )
}

function getFileBg(type: string) {
  switch (type) {
    case 'pdf':
      return 'bg-[#FEE2E2] dark:bg-red-950/20'
    case 'xlsx':
      return 'bg-[#D1FAE5] dark:bg-emerald-950/20'
    case 'docx':
      return 'bg-[#DBEAFE] dark:bg-blue-950/20'
    case 'png':
      return 'bg-[#F3E8FF] dark:bg-purple-950/20'
    case 'mp4':
      return 'bg-indigo-50 dark:bg-indigo-950/20'
    case 'mp3':
      return 'bg-pink-50 dark:bg-pink-950/20'
    case 'pptx':
      return 'bg-amber-50 dark:bg-amber-950/20'
    default:
      return 'bg-slate-50 dark:bg-slate-800/20'
  }
}

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 md:w-7 md:h-7 text-[#EF4444]" />
    case 'xlsx':
      return <FileSpreadsheet className="w-5 h-5 md:w-7 md:h-7 text-[#10B981]" />
    case 'docx':
      return <FileText className="w-5 h-5 md:w-7 md:h-7 text-[#3B82F6]" />
    case 'png':
      return <ImageIcon className="w-5 h-5 md:w-7 md:h-7 text-[#8B5CF6]" />
    case 'mp4':
      return <Video className="w-5 h-5 md:w-7 md:h-7 text-[#6366F1]" />
    case 'mp3':
      return <Music className="w-5 h-5 md:w-7 md:h-7 text-[#EC4899]" />
    case 'pptx':
      return <FileCode className="w-5 h-5 md:w-7 md:h-7 text-[#F59E0B]" />
    default:
      return <FileText className="w-5 h-5 md:w-7 md:h-7 text-[#6B7280]" />
  }
}

function FileCard({
  file,
  onPreview,
  onOpen,
  onImport
}: {
  file: SharedFolderFile
  onPreview: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onImport: (e: React.MouseEvent) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow text-left">
      <div className="p-5">
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
            getFileBg(file.type)
          )}
        >
          {getFileIcon(file.type)}
        </div>
        <h4
          className="text-[15px] font-extrabold text-[#0b1c30] dark:text-slate-100 line-clamp-2 leading-snug mb-1"
          title={file.name}
        >
          {file.name}
        </h4>
        <p className="text-xs font-semibold text-[#737686] dark:text-slate-400">
          {file.size} &bull; {file.fileTypeLabel}
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
        <button
          type="button"
          onClick={onPreview}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group rounded-bl-2xl focus:outline-none"
        >
          <Eye className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold">
            {t.sharedFolder.preview}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group focus:outline-none"
        >
          <GraduationCap className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold">
            {t.sharedFolder.open || 'Open'}
          </span>
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group rounded-br-2xl focus:outline-none"
        >
          <Upload className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold max-w-full truncate px-1 text-center font-bold">
            {file.imported ? (t.sharedFolder.viewInMyDocuments || 'View in My Documents') : t.sharedFolder.import}
          </span>
        </button>
      </div>
    </div>
  )
}

function FileRowCard({
  file,
  onPreview,
  onOpen,
  onImport
}: {
  file: SharedFolderFile
  onPreview: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onImport: (e: React.MouseEvent) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-xs hover:shadow-sm transition-shadow text-left">
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            getFileBg(file.type)
          )}
        >
          {getFileIcon(file.type)}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-[#0b1c30] dark:text-slate-100 truncate" title={file.name}>
            {file.name}
          </h4>
          <p className="text-xs font-semibold text-[#737686] dark:text-slate-400 mt-0.5">
            {file.size} &bull; {file.fileTypeLabel}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer focus:outline-none"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t.sharedFolder.preview}</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer focus:outline-none"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>{t.sharedFolder.open || 'Open'}</span>
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer focus:outline-none font-bold text-center"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{file.imported ? (t.sharedFolder.viewInMyDocuments || 'View in My Documents') : t.sharedFolder.import}</span>
        </button>
      </div>
    </div>
  )
}

/* Modals */

function ConfirmImportModal({
  isOpen,
  onClose,
  onConfirm,
  fileName
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
}) {
  const { t } = useTranslation()
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.sharedFolder.importConfirmTitle}
      className="max-w-md"
    >
      <div className="space-y-6 text-left">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-350">
          {t.sharedFolder.importConfirmDescription} <br />
          <strong className="text-slate-900 dark:text-white font-extrabold leading-relaxed">
            {fileName}
          </strong>
        </p>
        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {t.sharedFolder.import}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AISynthesisModal({
  isOpen,
  onClose,
  onDownloadReport,
  onCopySummary,
  reportContent
}: {
  isOpen: boolean
  onClose: () => void
  onDownloadReport: () => void
  onCopySummary: () => void
  reportContent: string
}) {
  const { t } = useTranslation()
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Research Synthesis"
      className="max-w-2xl"
    >
      <div className="space-y-6 text-left max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            FOLDER OVERVIEW
          </span>
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed text-justify">
            Group Project: Research Materials contains 12 active research files across PDF, Spreadsheet, Document, Image, Audio, and Video formats.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            KEY FINDINGS
          </span>
          <ul className="text-sm font-medium text-slate-655 dark:text-slate-350 list-disc pl-5 space-y-1">
            <li>Qualitative data from literature reviews (PDFs) integrates semantically with qualitative notes (DOCX).</li>
            <li>Quantitative tracking sheets (Excel) contain laboratory data that can be combined for unified charts.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            DUPLICATE FILES DETECTED
          </span>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/10 dark:border-rose-950/20 dark:bg-rose-950/5 p-4.5 space-y-2">
            <ul className="text-xs font-semibold text-rose-650 dark:text-rose-450 list-disc pl-5 space-y-1">
              <li>\`Literature Review.pdf\` shares 84% semantic similarity with \`References.pdf\`</li>
              <li>\`Budget Sheet.xlsx\` contains redundant rows matching \`Data Set_V1.xlsx\`</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            SUGGESTED RESEARCH SUMMARY
          </span>
          <p className="text-sm text-slate-550 dark:text-slate-350 leading-relaxed text-justify">
            The combined research indicates a strong correlation between multivariable biological traits and computational models. Recommended steps involve consolidating quantitative cells and creating flashcard modules for terminologies.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            RECOMMENDED NEXT ACTIONS
          </span>
          <ul className="text-sm font-medium text-slate-655 dark:text-slate-350 list-decimal pl-5 space-y-2">
            <li>Consolidate the quantitative sheets.</li>
            <li>Set up automated quizzes across terms.</li>
            <li>Transcribe audio recording to text summary.</li>
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-6 flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              onClick={onDownloadReport}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 flex items-center gap-2 border-none cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {t.sharedFolder.downloadReport}
            </Button>
            <Button
              variant="secondary"
              onClick={onCopySummary}
              className="rounded-xl font-bold text-xs px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Copy Summary
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function FilePreviewModal({
  isOpen,
  onClose,
  file,
  onDownload,
  onOpenFull
}: {
  isOpen: boolean
  onClose: () => void
  file: SharedFolderFile | null
  onDownload: () => void
  onOpenFull: () => void
}) {
  const { t } = useTranslation()
  if (!file) return null

  const renderPreviewArea = () => {
    switch (file.type) {
      case 'pdf':
        return (
          <div className="w-full h-[260px] rounded-xl bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-6 space-y-2 border border-slate-800 font-sans select-none">
            <GraduationCap className="h-10 w-10 text-rose-500" />
            <span className="text-sm font-extrabold text-slate-100">{file.name} Reader Mock</span>
            <span className="text-[10px] text-slate-500">
              Visualizing Pages 1 - 4 of PDF Stream
            </span>
          </div>
        )
      case 'xlsx':
        return (
          <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-955/20 max-h-[260px]">
            <table className="w-full text-[10px] font-medium border-collapse text-left select-none">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-850 text-slate-505 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-855 text-center w-6"></th>
                  {['A', 'B', 'C', 'D', 'E'].map((col) => (
                    <th
                      key={col}
                      className="py-1 px-2 border-r border-slate-200 dark:border-slate-855 text-center uppercase font-bold"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                {[
                  ['1', 'Experiment Sweep', 'Val A', 'Val B', 'Delta', 'Status'],
                  ['2', 'Trial 1', '10.2', '12.4', '2.2', 'Approved'],
                  ['3', 'Trial 2', '10.5', '11.9', '1.4', 'Pending'],
                  ['4', 'Trial 3', '9.8', '12.8', '3.0', 'Approved']
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'hover:bg-slate-50/50 dark:hover:bg-slate-850/30',
                      idx === 0 && 'font-bold bg-slate-100/50 dark:bg-slate-900/30'
                    )}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-855 font-mono text-slate-700 dark:text-slate-300"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'docx':
        return (
          <div className="w-full h-[260px] rounded-xl bg-white dark:bg-slate-850 border border-slate-250 dark:border-slate-800 p-6 space-y-4 overflow-y-auto text-left leading-relaxed text-slate-655 dark:text-slate-350 font-sans text-xs scrollbar-thin">
            <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-sm">
              {file.name.replace(/\.[^/.]+$/, '')}
            </h4>
            <p>
              This outlines the primary conceptual structures and derivations for the research task.
              Students should review these guidelines before collaborating.
            </p>
          </div>
        )
      case 'png':
        return (
          <div className="w-full aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 space-y-2 select-none border border-slate-850">
            <ImageIcon className="h-10 w-10 text-purple-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#2563eb]">
              Brainstorming Diagram Graphic Note
            </span>
          </div>
        )
      case 'mp4':
        return (
          <div className="w-full aspect-video rounded-xl bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 space-y-3 select-none border border-slate-850 relative overflow-hidden">
            <Video className="h-12 w-12 text-[#6366F1] animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              Experiment Video Capture player stream
            </span>
          </div>
        )
      case 'mp3':
      case 'wav':
        return (
          <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-955/20 border border-slate-250 dark:border-slate-800 p-6 flex flex-col items-center justify-center space-y-4">
            <Music className="h-10 w-10 text-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Audio Recording Player Mock
            </span>
            <audio controls className="w-64" src="" onClick={(e) => e.stopPropagation()} />
          </div>
        )
      default:
        return (
          <div className="w-full h-[260px] rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-450 p-6 space-y-2 font-sans select-none">
            <FileText className="h-10 w-10 text-slate-400" />
            <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {file.name}
            </span>
          </div>
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.sharedFolder.preview}
      className="max-w-2xl animate-fade-in"
    >
      <div className="space-y-6 text-left">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div
            className={cn(
              'size-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs',
              getFileBg(file.type)
            )}
          >
            {getFileIcon(file.type)}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {file.name}
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 font-semibold mt-0.5">
              {file.size} &bull; {file.fileTypeLabel}
            </p>
          </div>
        </div>

        <div className="py-2">{renderPreviewArea()}</div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-6">
          <div className="flex gap-2">
            <Button
              onClick={onOpenFull}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 border-none cursor-pointer"
            >
              {t.sharedFolder.open || 'Open'}
            </Button>
            <Button
              variant="secondary"
              onClick={onDownload}
              className="rounded-xl font-bold text-xs px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
            >
              Download
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CollaboratorDetailModal({
  isOpen,
  onClose,
  collaborator,
  onUpdateRole,
  onRemoveAccess
}: {
  isOpen: boolean
  onClose: () => void
  collaborator: Collaborator | null
  onUpdateRole: (collabId: string, role: 'Owner' | 'Editor' | 'Viewer') => void
  onRemoveAccess: (collabId: string) => void
}) {
  const { t } = useTranslation()
  if (!collaborator) return null
  const initials = collaborator.name ? collaborator.name.charAt(0).toUpperCase() : 'A'
  const isOwner = collaborator.role === 'Owner'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={collaborator.name}
      className="max-w-md"
    >
      <div className="space-y-6 text-left py-2">
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-inner shrink-0 select-none text-white",
            collaborator.avatar ? "" : "bg-[#8B5CF6]"
          )}>
            {collaborator.avatar ? (
              <img
                src={collaborator.avatar}
                alt={collaborator.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : initials}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
              {collaborator.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {collaborator.email}
            </p>
            <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 rounded-full select-none">
              {collaborator.role === 'Owner'
                ? t.sharedFolder.owner
                : collaborator.role === 'Editor'
                ? t.sharedFolder.canEdit
                : t.sharedFolder.canView}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Last Active:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">{collaborator.lastActive || 'Active recently'}</span>
          </div>

          {!isOwner && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Manage Role Access
              </label>
              <select
                value={collaborator.role}
                onChange={(e) => onUpdateRole(collaborator.id, e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white cursor-pointer font-semibold"
              >
                <option value="Viewer">{t.sharedFolder.canView}</option>
                <option value="Editor">{t.sharedFolder.canEdit}</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-6">
          {!isOwner ? (
            <Button
              variant="destructive"
              onClick={() => onRemoveAccess(collaborator.id)}
              className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer border-none"
            >
              Remove Access
            </Button>
          ) : (
            <div />
          )}
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

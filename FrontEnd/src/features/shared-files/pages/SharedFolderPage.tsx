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
  size: number
  sizeLabel: string
  fileTypeLabel: string
  modifiedAt: string
  imported?: boolean
}

export type Collaborator = {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Editor' | 'Viewer'
  avatar?: string
}

const mockFiles: SharedFolderFile[] = [
  {
    id: 'lit-rev-pdf',
    name: 'Literature Review.pdf',
    type: 'pdf',
    size: 12400000,
    sizeLabel: '12.4 MB',
    fileTypeLabel: 'PDF Document',
    modifiedAt: '2023-10-24 14:30',
    imported: false
  },
  {
    id: 'dataset-xlsx',
    name: 'Data Set_V1.xlsx',
    type: 'xlsx',
    size: 8200000,
    sizeLabel: '8.2 MB',
    fileTypeLabel: 'Spreadsheet',
    modifiedAt: '2023-10-23 10:15',
    imported: false
  },
  {
    id: 'proj-outline-docx',
    name: 'Project_Outline.docx',
    type: 'docx',
    size: 1500000,
    sizeLabel: '1.5 MB',
    fileTypeLabel: 'Word Document',
    modifiedAt: '2023-10-22 09:00',
    imported: false
  },
  {
    id: 'diagram-png',
    name: 'Brainstorming_Diagram.png',
    type: 'png',
    size: 4200000,
    sizeLabel: '4.2 MB',
    fileTypeLabel: 'Image File',
    modifiedAt: '2023-10-21 16:45',
    imported: false
  },
  {
    id: 'notes-docx',
    name: 'Research Notes.docx',
    type: 'docx',
    size: 2800000,
    sizeLabel: '2.8 MB',
    fileTypeLabel: 'Word Document',
    modifiedAt: '2023-10-20 11:20',
    imported: false
  },
  {
    id: 'results-xlsx',
    name: 'Lab Results.xlsx',
    type: 'xlsx',
    size: 1900000,
    sizeLabel: '1.9 MB',
    fileTypeLabel: 'Spreadsheet',
    modifiedAt: '2023-10-19 15:30',
    imported: false
  },
  {
    id: 'presentation-pptx',
    name: 'Presentation Draft.pptx',
    type: 'pptx',
    size: 5100000,
    sizeLabel: '5.1 MB',
    fileTypeLabel: 'PowerPoint Slide',
    modifiedAt: '2023-10-18 13:10',
    imported: false
  },
  {
    id: 'meeting-mp3',
    name: 'Meeting Recording.mp3',
    type: 'mp3',
    size: 8500000,
    sizeLabel: '8.5 MB',
    fileTypeLabel: 'Audio Recording',
    modifiedAt: '2023-10-17 10:00',
    imported: false
  },
  {
    id: 'video-mp4',
    name: 'Experiment Video.mp4',
    type: 'mp4',
    size: 24200000,
    sizeLabel: '24.2 MB',
    fileTypeLabel: 'Video File',
    modifiedAt: '2023-10-16 16:00',
    imported: false
  },
  {
    id: 'ref-pdf',
    name: 'References.pdf',
    type: 'pdf',
    size: 3100000,
    sizeLabel: '3.1 MB',
    fileTypeLabel: 'PDF Document',
    modifiedAt: '2023-10-15 14:15',
    imported: false
  },
  {
    id: 'budget-xlsx',
    name: 'Budget Sheet.xlsx',
    type: 'xlsx',
    size: 1100000,
    sizeLabel: '1.1 MB',
    fileTypeLabel: 'Spreadsheet',
    modifiedAt: '2023-10-14 11:00',
    imported: false
  },
  {
    id: 'timeline-docx',
    name: 'Timeline.docx',
    type: 'docx',
    size: 900000,
    sizeLabel: '0.9 MB',
    fileTypeLabel: 'Word Document',
    modifiedAt: '2023-10-13 09:45',
    imported: false
  }
]

const mockCollaborators: Collaborator[] = [
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    role: 'Owner',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  },
  {
    id: 'marcus',
    name: 'Marcus Knight',
    email: 'marcus.knight@example.com',
    role: 'Editor'
  },
  {
    id: 'alex-chen',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    role: 'Viewer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  }
]

export function SharedFolderPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { t, language } = useTranslation()

  // State Management
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [aiReportOpen, setAiReportOpen] = useState(false)
  const [confirmImportOpen, setConfirmImportOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SharedFolderFile | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'type' | 'date'>('name')
  const [files, setFiles] = useState<SharedFolderFile[]>(mockFiles)
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators)
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false)

  // Extra UX states
  const [searchQuery, setSearchQuery] = useState('')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null)

  // Simulated live updates for folder summary
  const [aiSummaryText, setAiSummaryText] = useState(
    language === 'vi'
      ? 'Tôi đã phân tích 12 tệp chính trong thư mục này. Bạn có muốn xem tóm tắt kết hợp hay tổng hợp nghiên cứu không?'
      : language === 'ja'
      ? 'このフォルダ内の12個の主要ファイルを分析しました。結合要約または研究総合を生成しますか？'
      : language === 'ko'
      ? '이 폴더의 12개 주요 파일을 분석했습니다. 통합 요약 또는 연구 종합을 생성하시겠습니까?'
      : "I've analyzed the 12 primary files in this folder. Would you like a combined summary or a research synthesis?"
  )

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
    setShareModalOpen(true)
  }

  const handleInviteMembersClick = () => {
    toast.success(t.sharedFolder.inviteMembersOpened || 'Invite members opened')
    setShareModalOpen(true)
  }

  const handleGenerateSummary = () => {
    setIsGeneratingInsight(true)
    setTimeout(() => {
      setIsGeneratingInsight(false)
      const VietnameseSummary =
        'Tóm tắt AI: Thư mục này tập trung vào sự kết hợp giữa tài liệu sinh học nghiên cứu định tính và mô phỏng phân tích tính toán định lượng (Excel). Điểm tối ưu tiếp theo là chạy trắc nghiệm ôn tập để tăng khả năng gợi nhớ thông tin.'
      const EnglishSummary =
        'AI Summary: This workspace revolves around the synthesis of qualitative biological literature with quantitative mathematical modeling. The optimal next step is to trigger an automated quiz across worksheets to test active recall of terms.'
      const JapaneseSummary =
        'AI要約：このワークスペースは、定性的な生物学文献と定量的な数学的モデリングの統合を中心に構成されています。最適な次のステップは、統合ワークシートで自動小テストを実行することです。'
      const KoreanSummary =
        'AI 요약: 이 워크스페이스는 정성적 생물학 문헌과 정량적 수학적 모델링의 통합을 중심으로 합니다. 다음 최적의 단계는 통합 워크시트에서 자동 퀴즈를 생성하여 용어의 능동적 회상을 테스트하는 것입니다.'

      setAiSummaryText(
        language === 'vi'
          ? VietnameseSummary
          : language === 'ja'
          ? JapaneseSummary
          : language === 'ko'
          ? KoreanSummary
          : EnglishSummary
      )
      toast.success(t.sharedFolder.aiSummaryGenerated || 'AI summary generated')
    }, 1000)
  }

  const handleDownloadReport = () => {
    try {
      const textContent = `=== AI STUDY HUB - WORKSPACE AUDIT REPORT ===\nFolder Name: Group Project: Research Materials\nOwner: Sarah Jenkins\nTotal Files: 12 files • 45 MB\n\n=== DUPLICATE ANALYSIS ===\n- Potential Redundancy Found between Literature Review.pdf & References.pdf\n- Shared cells found inside Budget Sheet.xlsx and Data Set_V1.xlsx\n\n=== RECOMMENDATIONS ===\n1. Consolidate columns inside worksheets.\n2. Trigger quizzes across files.\n`
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Research_Materials_AI_Audit_Report.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t.sharedFolder.aiReportDownloaded || 'AI report downloaded')
    } catch {
      toast.error('Failed to download report')
    }
  }

  const handleImportClick = (file: SharedFolderFile, e: React.MouseEvent) => {
    e.stopPropagation()
    if (file.imported) {
      navigate('/dashboard/documents')
      return
    }
    setSelectedFile(file)
    setConfirmImportOpen(true)
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
      size: selectedFile.sizeLabel,
      sizeKb: selectedFile.size / 1024,
      subject: 'GENERAL',
      status: 'ANALYZED',
      type: mapFileTypeToDocType(selectedFile.type)
    }

    localStorage.setItem('ai_study_hub_documents', JSON.stringify([newDoc, ...currentDocs]))

    setFiles((prev) =>
      prev.map((f) => (f.id === selectedFile.id ? { ...f, imported: true } : f))
    )

    toast.success(t.sharedFolder.fileImported || 'File imported to My Documents')
    setConfirmImportOpen(false)
  }

  const handlePreviewOpen = (file: SharedFolderFile, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(file)
    setPreviewModalOpen(true)
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

  // Filtered files list
  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sorted files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    if (sortBy === 'size') {
      return a.size - b.size
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type)
    }
    if (sortBy === 'date') {
      return new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()
    }
    return 0
  })

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

      {/* 3. Main Grid layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Side elements */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6">
          <CollaboratorsCard
            collaborators={collaborators}
            onInvite={handleInviteMembersClick}
            onSelectCollaborator={(c) => setSelectedCollaborator(c)}
          />
          <AIInsightCard
            summary={aiSummaryText}
            isGenerating={isGeneratingInsight}
            onGenerate={handleGenerateSummary}
            onOpenReport={() => setAiReportOpen(true)}
          />
        </div>

        {/* Right Side files catalog */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl shadow-sm overflow-visible">
          {/* List Headers / Toggles */}
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

            {/* Sorting Choice */}
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
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key as any)
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

          {/* Search bar */}
          <div className="p-6 pb-2">
            <div className="relative w-full max-w-md text-left">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  language === 'vi'
                    ? 'Tìm kiếm theo tên...'
                    : language === 'ja'
                    ? '名前で検索...'
                    : language === 'ko'
                    ? '이름으로 검색...'
                    : 'Search by file name...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800 dark:border-slate-700 pl-10 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:text-white"
              />
            </div>
          </div>

          {/* Grid / List render content */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedFiles.map((file) => (
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
                {sortedFiles.map((file) => (
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
          </div>
        </div>
      </div>

      {/* Collaborators Manage Access Shared Modal */}
      <ShareAccessModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        folderId="research-materials"
        folderName="Group Project: Research Materials"
        owner="Sarah Jenkins"
        type="folder"
        collaborators={mappedShareCollabs}
        onCollaboratorsChange={handleCollaboratorsChange}
      />

      {/* AI Folder Report Modal */}
      <AIReportModal
        isOpen={aiReportOpen}
        onClose={() => setAiReportOpen(false)}
        onDownloadReport={handleDownloadReport}
        folderName="Group Project: Research Materials"
      />

      {/* Confirm Import dialog */}
      <ConfirmImportModal
        isOpen={confirmImportOpen}
        onClose={() => setConfirmImportOpen(false)}
        onConfirm={handleConfirmImport}
        fileName={selectedFile?.name || ''}
      />

      {/* File preview player modal */}
      <FilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={selectedFile}
        onDownload={() => {
          toast.success('Downloading file...')
          setPreviewModalOpen(false)
        }}
        onOpenFull={() => {
          if (selectedFile) handleOpenPageFull(selectedFile)
          setPreviewModalOpen(false)
        }}
      />

      {/* Collaborator details mock popup modal */}
      <CollaboratorDetailModal
        isOpen={selectedCollaborator !== null}
        onClose={() => setSelectedCollaborator(null)}
        collaborator={selectedCollaborator}
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
  onGenerate,
  onOpenReport
}: {
  summary: string
  isGenerating: boolean
  onGenerate: () => void
  onOpenReport: () => void
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
          summary
        )}
      </p>

      <div className="space-y-2 pt-2">
        <button
          type="button"
          disabled={isGenerating}
          onClick={onGenerate}
          className="w-full py-2.5 bg-[#3155F6] hover:bg-[#1A3ECF] disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none flex items-center justify-center gap-2"
          aria-busy={isGenerating}
        >
          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t.sharedFolder.generateSummary}
        </button>
        <button
          type="button"
          onClick={onOpenReport}
          className="w-full py-2.5 border border-[#C3C6D7]/40 hover:border-slate-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer focus:outline-none"
        >
          {t.sharedFolder.viewAIReport}
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
          {file.sizeLabel} &bull; {file.fileTypeLabel}
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
          <span className="text-[10px] tracking-wider uppercase font-extrabold max-w-full truncate px-1 text-center">
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
            {file.sizeLabel} &bull; {file.fileTypeLabel}
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
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer focus:outline-none"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{file.imported ? (t.sharedFolder.viewInMyDocuments || 'View in My Documents') : t.sharedFolder.import}</span>
        </button>
      </div>
    </div>
  )
}

/* Nested Modals Components */

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

function AIReportModal({
  isOpen,
  onClose,
  onDownloadReport,
  folderName
}: {
  isOpen: boolean
  onClose: () => void
  onDownloadReport: () => void
  folderName: string
}) {
  const { t } = useTranslation()
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Workspace Audit Report"
      className="max-w-2xl"
    >
      <div className="space-y-6 text-left max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            FOLDER OVERVIEW
          </span>
          <h3 className="text-base font-extrabold text-slate-850 dark:text-slate-100">
            {folderName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-450 leading-relaxed text-justify">
            This folder contains 12 active research documents, sheets, and media files. The primary
            research scope relates to multivariable analysis, biology literature reviews, and
            interactive design outlining.
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            DUPLICATE FILES DETECTED
          </span>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/10 dark:border-rose-950/20 dark:bg-rose-950/5 p-4.5 space-y-2.5">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-450 font-bold text-xs">
              <Sparkles className="h-4 w-4 shrink-0 text-rose-500" />
              <span>Potential redundancy found:</span>
            </div>
            <ul className="text-xs font-semibold text-rose-650 dark:text-rose-450 list-disc pl-5 space-y-1">
              <li>`Literature Review.pdf` shares 84% semantic similarity with `References.pdf`</li>
              <li>`Data Set_V1.xlsx` contains redundant rows matching `Budget Sheet.xlsx`</li>
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            RECOMMENDED ACTIONS & KEY INSIGHTS
          </span>
          <ul className="text-sm font-medium text-slate-655 dark:text-slate-350 list-decimal pl-5 space-y-2">
            <li>Consolidate the duplicated columns inside `Data Set_V1.xlsx` and `Budget Sheet.xlsx`.</li>
            <li>Import `References.pdf` and build a unified bibliography outline to avoid redundant reading cycles.</li>
            <li>Convert `Meeting Recording.mp3` to an AI-generated text summary for active search indexing.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
            RELATED FILES
          </span>
          <ul className="text-xs font-semibold text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
            <li>Literature Review.pdf</li>
            <li>References.pdf</li>
            <li>Data Set_V1.xlsx</li>
            <li>Budget Sheet.xlsx</li>
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-6">
          <Button
            onClick={onDownloadReport}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 flex items-center gap-2 shadow-sm border-none cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {t.sharedFolder.downloadReport}
          </Button>
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
              Visualizing Pages 1 - {file.name.includes('Lit') ? '12' : '4'} of PDF Stream
            </span>
          </div>
        )
      case 'xlsx':
        return (
          <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 max-h-[260px]">
            <table className="w-full text-[10px] font-medium border-collapse text-left select-none">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-850 text-slate-505 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-1 px-2 border-r border-slate-200 dark:border-slate-850 text-center w-6"></th>
                  {['A', 'B', 'C', 'D', 'E'].map((col) => (
                    <th
                      key={col}
                      className="py-1 px-2 border-r border-slate-200 dark:border-slate-850 text-center uppercase font-bold"
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
                        className="py-1.5 px-2 border-r border-slate-200 dark:border-slate-850 font-mono text-slate-700 dark:text-slate-300"
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
            <p>
              Key topics include study planning, outline setups, draft review rules, and concept
              matches.
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
            <span className="text-xs font-bold text-slate-450">
              glowing_blue_brain.png preview stream
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
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/80 p-2 rounded-lg flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>00:15 / 02:40</span>
              <div className="w-32 h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-[10%] h-full bg-[#6366F1]" />
              </div>
              <span>1080p</span>
            </div>
          </div>
        )
      case 'mp3':
      case 'wav':
        return (
          <div className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-250 dark:border-slate-800 p-6 flex flex-col items-center justify-center space-y-4">
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
            <span className="text-[10px] text-slate-500">File preview stream</span>
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
              {file.sizeLabel} &bull; {file.fileTypeLabel}
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
  collaborator
}: {
  isOpen: boolean
  onClose: () => void
  collaborator: Collaborator | null
}) {
  const { t } = useTranslation()
  if (!collaborator) return null
  const initials = collaborator.name ? collaborator.name.charAt(0).toUpperCase() : 'A'

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
            <span className="inline-block mt-2 text-xs font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full">
              {collaborator.role === 'Owner'
                ? t.sharedFolder.owner
                : collaborator.role === 'Editor'
                ? t.sharedFolder.canEdit
                : t.sharedFolder.canView}
            </span>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Status:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block" /> Active Now
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Joined Workspace:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">Oct 12, 2023</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400 font-semibold">Recent Activity:</span>
            <span className="text-slate-850 dark:text-slate-300 font-medium text-right">
              Viewed "Literature Review.pdf"
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6">
          <Button onClick={onClose} className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white border-none">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

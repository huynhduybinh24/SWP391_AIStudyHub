import { useState } from 'react'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ShareModal, ShareModalUser } from '@/components/common/ShareModal'

interface FileItem {
  name: string
  size: string
  type: string
  iconColor: string
  iconBg: string
  iconType: 'pdf' | 'xlsx' | 'docx' | 'image'
}

export function SharedFolderPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const defaultUsers: ShareModalUser[] = [
    { id: 'sarah', name: 'Sarah Jenkins', email: 'sarah@example.com', permission: 'Chủ sở hữu' },
    { id: 'marcus', name: 'Marcus Knight', email: 'marcus@example.com', permission: 'Người chỉnh sửa' },
    { id: 'alex-chen', name: 'Alex Chen', email: 'alex.chen@example.com', permission: 'Người xem' }
  ]

  const files: FileItem[] = [
    {
      name: 'Literature Review.pdf',
      size: '12.4 MB',
      type: 'PDF Document',
      iconColor: 'text-[#EF4444]',
      iconBg: 'bg-[#FEE2E2]',
      iconType: 'pdf',
    },
    {
      name: 'Data Set_V1.xlsx',
      size: '8.2 MB',
      type: 'Spreadsheet',
      iconColor: 'text-[#10B981]',
      iconBg: 'bg-[#D1FAE5]',
      iconType: 'xlsx',
    },
    {
      name: 'Project_Outline.docx',
      size: '1.5 MB',
      type: 'Word Doc',
      iconColor: 'text-[#3B82F6]',
      iconBg: 'bg-[#DBEAFE]',
      iconType: 'docx',
    },
    {
      name: 'Brainstorming_Diagram.png',
      size: '4.2 MB',
      type: 'Image',
      iconColor: 'text-[#8B5CF6]',
      iconBg: 'bg-[#F3E8FF]',
      iconType: 'image',
    },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/dashboard/notifications')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 transition-colors cursor-pointer focus-visible:outline-none"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Notifications</span>
      </button>

      {/* Page Title & Manage Access */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#0b1c30] dark:text-white">
            Group Project: Research Materials
          </h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-sm text-[#737686] dark:text-slate-400 font-medium">
            <span className="inline-flex items-center gap-2">
              <User className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span>Owner: <strong className="font-bold text-[#0b1c30] dark:text-slate-200">Sarah Jenkins</strong></span>
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span>Shared: <strong className="font-bold text-[#0b1c30] dark:text-slate-200">Oct 24, 2023</strong></span>
            </span>
            <span className="inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3155F6] dark:text-blue-400" />
              <span><strong className="font-bold text-[#0b1c30] dark:text-slate-200">12 files • 45 MB</strong></span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[#434655] dark:text-slate-300 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <Share2 className="w-4 h-4" />
          <span>Manage Access</span>
        </button>
      </div>

      {/* Main Grid: Left sidebar-like section and Right files panel */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Collaborators & AI Insight */}
        <div className="w-full lg:w-[300px] shrink-0 space-y-6">
          <CollaboratorsCard onInvite={() => setIsShareModalOpen(true)} />
          <AIInsightCard />
        </div>

        {/* Right Column: Files Panel */}
        <div className="flex-1 w-full bg-white dark:bg-slate-900 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Panel */}
          <div className="flex items-center justify-between bg-[#F4F7FE]/60 dark:bg-slate-800/60 border-b border-[#C3C6D7]/20 dark:border-slate-800 px-6 py-4">
            <div className="flex items-center gap-4">
              <span className="text-base font-bold text-[#0b1c30] dark:text-slate-200">12 Files Total</span>
              <div className="flex items-center bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded transition-all cursor-pointer",
                    viewMode === 'grid'
                      ? "bg-[#E8EEFF] dark:bg-blue-950 text-[#3155F6] dark:text-blue-400"
                      : "text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded transition-all cursor-pointer",
                    viewMode === 'list'
                      ? "bg-[#E8EEFF] dark:bg-blue-950 text-[#3155F6] dark:text-blue-400"
                      : "text-[#737686] dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#434655] dark:text-slate-300 hover:text-[#3155F6] dark:hover:text-blue-400 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4 text-[#737686] dark:text-slate-400" />
              <span>Sort by: Name</span>
            </button>
          </div>

          {/* Files Content Area */}
          <div className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {files.map((file) => (
                  <FileCard key={file.name} file={file} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <FileRowCard key={file.name} file={file} />
                ))}
              </div>
            )}

            {/* More Files Indicator */}
            <div className="flex flex-col items-center justify-center pt-10 pb-4">
              <p className="text-sm font-semibold text-[#737686] dark:text-slate-400 mb-2">+ 8 more files available</p>
              <button
                type="button"
                className="text-[#3155F6] dark:text-blue-400 hover:text-[#2563eb] dark:hover:text-blue-300 text-base font-extrabold transition-all cursor-pointer hover:underline"
              >
                View All Files
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName="Group Project: Research Materials"
        shareUrl="http://localhost:5173/dashboard/shared-files/research-materials"
        initialUsers={defaultUsers}
      />
    </div>
  )
}

/* Sub-Components */

function CollaboratorsCard({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/30 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-base font-black text-[#0b1c30] dark:text-white mb-4">Collaborators</h3>
      <div className="space-y-4">
        {/* Sarah Jenkins */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                alt="Sarah Jenkins"
                className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 leading-tight">Sarah Jenkins</p>
              <p className="text-xs text-[#737686] dark:text-slate-400 font-semibold mt-0.5">Owner</p>
            </div>
          </div>
        </div>

        {/* Marcus Knight */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-sm font-bold">
                MK
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10B981] border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 leading-tight">Marcus Knight</p>
              <p className="text-xs text-[#737686] dark:text-slate-400 font-semibold mt-0.5">Can Edit</p>
            </div>
          </div>
        </div>

        {/* Alex Chen */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Alex Chen"
                className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#9CA3AF] border-2 border-white dark:border-slate-900 rounded-full" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 leading-tight">Alex Chen</p>
              <p className="text-xs text-[#737686] dark:text-slate-400 font-semibold mt-0.5">Can View</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onInvite}
        className="w-full mt-5 py-2.5 border border-[#3155F6]/20 hover:border-[#3155F6] hover:bg-[#E8EEFF]/30 dark:border-blue-900/30 dark:hover:bg-blue-950/30 dark:text-blue-400 font-bold rounded-xl text-sm transition-colors cursor-pointer"
      >
        Invite Members
      </button>
    </div>
  )
}

function AIInsightCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3155F6] to-[#7C3AED] p-6 text-white shadow-md">
      {/* Sparkles Overlay */}
      <div className="absolute top-2 right-2 opacity-25">
        <Sparkles className="w-14 h-14 text-white" />
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-100">
              AI INSIGHT
            </h4>
          </div>
          <p className="text-sm font-bold leading-relaxed mb-5 text-blue-50/90">
            I've analyzed the 4 primary files in this folder. Would you like a combined summary or a research synthesis?
          </p>
        </div>
        <button
          type="button"
          className="w-full bg-white hover:bg-slate-50 text-[#3155F6] font-black py-2.5 px-4 rounded-xl text-sm transition-all shadow-[0_4px_12px_rgba(49,85,246,0.15)] cursor-pointer active:scale-[0.98]"
        >
          Generate Synthesis
        </button>
      </div>
    </div>
  )
}

function getFileIcon(type: 'pdf' | 'xlsx' | 'docx' | 'image') {
  switch (type) {
    case 'pdf':
      return <FileText className="w-7 h-7 text-[#EF4444]" />
    case 'xlsx':
      return <FileSpreadsheet className="w-7 h-7 text-[#10B981]" />
    case 'docx':
      return <FileText className="w-7 h-7 text-[#3B82F6]" />
    case 'image':
      return <ImageIcon className="w-7 h-7 text-[#8B5CF6]" />
  }
}

function FileCard({ file }: { file: FileItem }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        {/* Document Type Rounded Badge */}
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", file.iconBg, file.iconType === 'pdf' && "dark:bg-red-950/20", file.iconType === 'xlsx' && "dark:bg-emerald-950/20", file.iconType === 'docx' && "dark:bg-blue-950/20", file.iconType === 'image' && "dark:bg-purple-950/20")}>
          {getFileIcon(file.iconType)}
        </div>
        <h4 className="text-[15px] font-extrabold text-[#0b1c30] dark:text-slate-100 line-clamp-2 leading-snug mb-1" title={file.name}>
          {file.name}
        </h4>
        <p className="text-xs font-semibold text-[#737686] dark:text-slate-400">
          {file.size} • {file.type}
        </p>
      </div>

      {/* Grid Bottom Action Panel */}
      <div className="grid grid-cols-3 border-t border-slate-100 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800">
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group rounded-bl-2xl"
        >
          <Eye className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400">Preview</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group"
        >
          <Download className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400">Page</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 py-3 text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 hover:bg-[#F4F7FE]/40 dark:hover:bg-slate-800/40 transition-all cursor-pointer group rounded-br-2xl"
        >
          <Upload className="w-4 h-4 text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400" />
          <span className="text-[10px] tracking-wider uppercase font-extrabold text-[#737686] dark:text-slate-400 group-hover:text-[#3155F6] dark:group-hover:text-blue-400">Import</span>
        </button>
      </div>
    </div>
  )
}

function FileRowCard({ file }: { file: FileItem }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-[#C3C6D7]/40 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 min-w-0">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", file.iconBg, file.iconType === 'pdf' && "dark:bg-red-950/20", file.iconType === 'xlsx' && "dark:bg-emerald-950/20", file.iconType === 'docx' && "dark:bg-blue-950/20", file.iconType === 'image' && "dark:bg-purple-950/20")}>
          {getFileIcon(file.iconType)}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-[#0b1c30] dark:text-slate-100 truncate" title={file.name}>
            {file.name}
          </h4>
          <p className="text-xs font-semibold text-[#737686] dark:text-slate-400 mt-0.5">
            {file.size} • {file.type}
          </p>
        </div>
      </div>

      {/* Row Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Page</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#737686] dark:text-slate-400 hover:text-[#3155F6] dark:hover:text-blue-400 border border-[#C3C6D7]/40 dark:border-slate-800 hover:border-[#3155F6]/40 rounded-lg hover:bg-[#E8EEFF]/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import</span>
        </button>
      </div>
    </div>
  )
}

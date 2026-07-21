import { useState } from 'react'
import { Upload, UserPlus, Sparkles, FolderPlus, ChevronDown, FolderClosed, Layers } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

interface SharedWorkspaceHeaderProps {
  onUploadClick: () => void
  onInviteClick: () => void
  onAIAnalyzeClick: () => void
  onCreateWorkspaceClick: () => void
  isAnalyzing: boolean
  workspaces: any[]
  selectedWorkspaceId: string | 'all'
  onSelectWorkspace: (id: string | 'all') => void
}

export function SharedWorkspaceHeader({
  onUploadClick,
  onInviteClick,
  onAIAnalyzeClick,
  onCreateWorkspaceClick,
  isAnalyzing,
  workspaces,
  selectedWorkspaceId,
  onSelectWorkspace
}: SharedWorkspaceHeaderProps) {
  const { t, language } = useTranslation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedWorkspace = workspaces.find(w => w.id.toString() === selectedWorkspaceId)

  return (
    <div className="pt-2 text-left select-none">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left Side: Title & Subtitle */}
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-3.5 flex-wrap">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {t.sharedFiles.title}
            </h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold px-4 h-9 text-xs border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                {selectedWorkspaceId === 'all' ? (
                  <>
                    <Layers className="size-3.5 text-blue-500" />
                    <span>{language === 'vi' ? 'Tất cả các nhóm' : 'All Groups'}</span>
                  </>
                ) : (
                  <>
                    <FolderClosed className="size-3.5 text-emerald-500" />
                    <span className="truncate max-w-[150px]">{selectedWorkspace?.name}</span>
                  </>
                )}
                <ChevronDown className={cn("size-3.5 text-slate-400 transition-transform duration-200", dropdownOpen && "rotate-180")} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 z-45 w-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectWorkspace('all')
                        setDropdownOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer",
                        selectedWorkspaceId === 'all'
                          ? "bg-blue-50 dark:bg-blue-955/20 text-[#3155F6] dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      <Layers className="size-3.5" />
                      <span>{language === 'vi' ? 'Tất cả các nhóm' : 'All Groups'}</span>
                    </button>

                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1.5" />

                    <div className="max-h-[200px] overflow-y-auto space-y-0.5">
                      {workspaces.length === 0 ? (
                        <p className="text-[10px] text-slate-400 text-center py-3 font-semibold">
                          {language === 'vi' ? 'Chưa có nhóm học tập' : 'No workspaces yet'}
                        </p>
                      ) : (
                        workspaces.map((ws) => (
                          <button
                            key={ws.id}
                            type="button"
                            onClick={() => {
                              onSelectWorkspace(ws.id.toString())
                              setDropdownOpen(false)
                            }}
                            className={cn(
                              "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer",
                              selectedWorkspaceId === ws.id.toString()
                                ? "bg-emerald-50 dark:bg-emerald-955/20 text-emerald-600 dark:text-emerald-450"
                                : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                            )}
                          >
                            <FolderClosed className="size-3.5" />
                            <span className="truncate">{ws.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-455">
            {selectedWorkspaceId === 'all' 
              ? t.sharedFiles.subtitle
              : (selectedWorkspace?.description || (language === 'vi' ? 'Không gian làm việc chung của nhóm.' : 'Workspace files and collaboration.'))}
          </p>
        </div>

        {/* Right Side: Action buttons container */}
        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap shrink-0">
          {/* 0. Create Workspace Button */}
          <button
            type="button"
            onClick={onCreateWorkspaceClick}
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 h-11 text-xs shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <FolderPlus className="size-4" />
            <span>{language === 'vi' ? 'Tạo Nhóm Học Tập' : 'Create Workspace'}</span>
          </button>

          {/* 1. Upload File Button */}
          <button
            type="button"
            onClick={onUploadClick}
            className="flex items-center justify-center gap-2 rounded-full bg-[#3155F6] hover:bg-blue-700 text-white font-black px-6 h-11 text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <Upload className="size-4 transition-transform group-hover:-translate-y-0.5" />
            <span>{t.sharedFiles.uploadFiles}</span>
          </button>

          {/* 2. Invite Button */}
          <button
            type="button"
            onClick={onInviteClick}
            className="flex items-center justify-center gap-2 rounded-full bg-slate-900 hover:bg-slate-805 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black px-6 h-11 text-xs shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <UserPlus className="size-4" />
            <span>{t.sharedFiles.invite}</span>
          </button>

        </div>
      </div>
    </div>
  )
}

export default SharedWorkspaceHeader

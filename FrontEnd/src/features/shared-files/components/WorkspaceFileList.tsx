import { useState } from 'react'
import { Folder, Plus } from 'lucide-react'
import { WorkspaceFileCard } from './WorkspaceFileCard'
import { WorkspaceFileTable } from './WorkspaceFileTable'
import { SharedFile } from './SharedFilesTable'

import { useTranslation } from '@/context/LanguageContext'

interface WorkspaceFileListProps {
  files: SharedFile[]
  selectedFile: SharedFile | null
  viewMode: 'list' | 'grid'
  favorites: string[]
  sortOrder: string
  onSortOrderChange: (order: string) => void
  onSelectFile: (file: SharedFile) => void
  onOpenFile: (file: SharedFile) => void
  onStarToggle: (file: SharedFile) => void
  onRename: (file: SharedFile) => void
  onChangePermission: (file: SharedFile) => void
  onRemoveAccess: (file: SharedFile) => void
  onDownload: (file: SharedFile) => void
  onShareAccess: (file: SharedFile) => void
  onReport?: (file: SharedFile) => void
  isWorkspaceEmpty?: boolean
  onUploadClick?: () => void
}

export function WorkspaceFileList({
  files,
  selectedFile,
  viewMode,
  favorites,
  sortOrder,
  onSortOrderChange,
  onSelectFile,
  onOpenFile,
  onStarToggle,
  onRename,
  onChangePermission,
  onRemoveAccess,
  onDownload,
  onShareAccess,
  onReport,
  isWorkspaceEmpty = false,
  onUploadClick
}: WorkspaceFileListProps) {
  const { t } = useTranslation()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  if (isWorkspaceEmpty) {
    return (
      <div className="relative flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-8 shadow-xs select-none overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative flex items-center justify-center size-20 rounded-[24px] bg-blue-50 dark:bg-blue-950/40 border border-blue-100/30 dark:border-blue-900/20 mb-6 group transition-all duration-300 hover:scale-105">
          <Folder className="size-10 text-blue-500 dark:text-blue-400 stroke-[1.25] group-hover:rotate-6 transition-transform duration-300" />
        </div>

        <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200 tracking-tight max-w-md">
          {t.sharedFiles.emptyWorkspace}
        </h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 max-w-sm leading-relaxed font-semibold">
          {t.sharedFiles.emptyWorkspaceSub}
        </p>

        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs py-3 px-5 shadow-lg shadow-blue-500/15 hover:shadow-xl transition-all duration-205 cursor-pointer"
          >
            <Plus className="size-4" />
            {t.sharedFiles.uploadFiles}
          </button>
        )}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] p-6 shadow-xs select-none">
        <Folder className="size-12 text-slate-305 dark:text-slate-700 mb-3.5 stroke-[1.5]" />
        <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-355">{t.sharedFiles.noMatches}</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.sharedFiles.noMatchesSub}</p>
      </div>
    )
  }

  return (
    <div className="relative overflow-visible">
      {viewMode === 'list' ? (
        <WorkspaceFileTable
          files={files}
          selectedFile={selectedFile}
          favorites={favorites}
          sortOrder={sortOrder}
          onSortOrderChange={onSortOrderChange}
          onSelectFile={onSelectFile}
          onOpenFile={onOpenFile}
          onStarToggle={onStarToggle}
          onRename={onRename}
          onChangePermission={onChangePermission}
          onRemoveAccess={onRemoveAccess}
          onDownload={onDownload}
          onShareAccess={onShareAccess}
          onReport={onReport}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-all duration-300 overflow-visible">
          {files.map((file) => (
            <WorkspaceFileCard
              key={file.id}
              file={file}
              viewMode="grid"
              isSelected={selectedFile?.id === file.id}
              isFavorite={favorites.includes(file.id)}
              onSelect={() => onSelectFile(file)}
              onDoubleClick={() => onOpenFile(file)}
              onStarToggle={(e) => {
                e.stopPropagation()
                onStarToggle(file)
              }}
              isMenuOpen={activeMenuId === file.id}
              onMenuToggle={(e) => {
                e.stopPropagation()
                setActiveMenuId(activeMenuId === file.id ? null : file.id)
              }}
              onMenuClose={() => setActiveMenuId(null)}
              onOpenFile={() => onOpenFile(file)}
              onDownload={() => onDownload(file)}
              onShareAccess={() => onShareAccess(file)}
              onRename={() => onRename(file)}
              onChangePermission={() => onChangePermission(file)}
              onRemoveAccess={() => onRemoveAccess(file)}
              onReport={() => onReport?.(file)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkspaceFileList

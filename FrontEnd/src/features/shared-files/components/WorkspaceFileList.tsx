import { useState } from 'react'
import { Folder } from 'lucide-react'
import { WorkspaceFileCard } from './WorkspaceFileCard'
import { WorkspaceFileTable } from './WorkspaceFileTable'
import { SharedFile } from './SharedFilesTable'
import { cn } from '@/lib/utils'
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
  onShareAccess
}: WorkspaceFileListProps) {
  const { t } = useTranslation()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

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
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkspaceFileList

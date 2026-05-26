import { useRef } from 'react'
import { MoreVertical, Eye, Edit2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SharedFile } from './SharedFilesTable'
import { FileActionsDropdown } from './FileActionsDropdown'
import { FileTypeIcon } from './FileTypeIcon'
import { useTranslation } from '@/context/LanguageContext'

interface WorkspaceFileCardProps {
  file: SharedFile
  isSelected: boolean
  isFavorite: boolean
  viewMode: 'list' | 'grid'
  onSelect: () => void
  onDoubleClick: () => void
  onStarToggle: (e: React.MouseEvent) => void
  isMenuOpen: boolean
  onMenuToggle: (e: React.MouseEvent) => void
  onMenuClose: () => void
  onOpenFile: () => void
  onDownload: () => void
  onShareAccess: () => void
  onRename: () => void
  onChangePermission: (file: SharedFile) => void
  onRemoveAccess: (file: SharedFile) => void
  onReport: () => void
}

export function WorkspaceFileCard({
  file,
  isSelected,
  isFavorite,
  viewMode,
  onSelect,
  onDoubleClick,
  onStarToggle,
  isMenuOpen,
  onMenuToggle,
  onMenuClose,
  onOpenFile,
  onDownload,
  onShareAccess,
  onRename,
  onChangePermission,
  onRemoveAccess,
  onReport
}: WorkspaceFileCardProps) {
  const { t, language } = useTranslation()
  const buttonRef = useRef<HTMLButtonElement>(null)
  
  const getFileIcon = (type: SharedFile['type']) => {
    return <FileTypeIcon type={type} className="size-5 shrink-0 bg-transparent dark:bg-transparent shadow-none" />
  }

  const getFileBg = (type: SharedFile['type']) => {
    const normType = type.toLowerCase()
    switch (normType) {
      case 'pdf':
        return 'bg-red-55/10 dark:bg-red-955/20'
      case 'xlsx':
      case 'xls':
      case 'spreadsheet':
        return 'bg-emerald-55/10 dark:bg-emerald-955/20'
      case 'docx':
      case 'doc':
        return 'bg-blue-55/10 dark:bg-blue-955/20'
      case 'txt':
      case 'text':
        return 'bg-slate-100 dark:bg-slate-800/40'
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return 'bg-amber-55/10 dark:bg-amber-955/20'
      case 'mp4':
      case 'mov':
      case 'webm':
      case 'video':
        return 'bg-rose-55/10 dark:bg-rose-955/20'
      case 'mp3':
      case 'wav':
      case 'm4a':
      case 'audio':
        return 'bg-emerald-55/10 dark:bg-emerald-955/20'
      case 'recording':
        return 'bg-violet-55/10 dark:bg-violet-955/20'
      case 'folder':
        return 'bg-indigo-50/10 dark:bg-indigo-955/20'
      default:
        return 'bg-slate-50 dark:bg-slate-800/20'
    }
  }

  const getPermissionBadge = (perm: SharedFile['permission']) => {
    const ownerText = language === 'vi' ? 'Chủ sở hữu' : (language === 'ja' ? '所有者' : (language === 'ko' ? '소유자' : 'Owner'))
    const editorText = t.sharedFiles.editorLabel || 'Editor'
    const viewerText = t.sharedFiles.viewerLabel || 'Viewer'

    switch (perm) {
      case 'Owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {ownerText}
          </span>
        )
      case 'Editor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/20">
            <Edit2 className="size-2.5" />
            {editorText}
          </span>
        )
      case 'View Only':
      case 'Viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#3155F6] dark:bg-blue-955/30 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20">
            <Eye className="size-2.5" />
            {viewerText}
          </span>
        )
      default:
        return null
    }
  }

  const formatSharedDate = (dateStr: string) => {
    if (dateStr === '2h ago') {
      return language === 'vi' ? '2 giờ trước' : (language === 'ja' ? '2時間前' : (language === 'ko' ? '2시간 전' : '2h ago'))
    }
    if (dateStr.includes('Oct')) {
      return language === 'vi' ? `Được chia sẻ ${dateStr}` : (language === 'ja' ? `共有日時 ${dateStr}` : (language === 'ko' ? `공유됨 ${dateStr}` : `Shared ${dateStr}`))
    }
    return dateStr
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onDoubleClick()
  }

  // 1. LIST MODE DISPLAY
  if (viewMode === 'list') {
    return (
      <div
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        className={cn(
          "group relative flex items-center justify-between rounded-3xl border p-4 transition-all duration-300 ease-out cursor-pointer shadow-xs select-none hover:shadow-md hover:border-blue-500/30 overflow-visible",
          isSelected 
            ? "bg-blue-50/20 dark:bg-blue-955/10 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500" 
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        )}
      >
        <div className="flex items-center gap-4.5 min-w-0 flex-1 overflow-visible">
          {/* File icon */}
          <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getFileBg(file.type))}>
            {getFileIcon(file.type)}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-extrabold text-slate-855 dark:text-slate-100">
                {file.name}
              </h3>
              
              <button
                type="button"
                onClick={onStarToggle}
                className="p-1 rounded-lg text-slate-350 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                title="Toggle favorite"
                aria-label="Toggle favorite"
              >
                <Star className={cn("size-4", isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-600")} />
              </button>
            </div>

            {/* Sub description details */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mt-1 text-[11px] font-semibold text-slate-450 dark:text-slate-400 leading-none">
              <span className="flex items-center gap-1.5">
                <span className="size-4.5 rounded-full bg-slate-100 dark:bg-slate-855 flex items-center justify-center font-bold text-[9px] text-slate-600 dark:text-slate-300">
                  {file.owner ? file.owner.charAt(0) : 'A'}
                </span>
                <span>{file.owner || 'Alex Chen'}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-755 font-black">&bull;</span>
              <span>{formatSharedDate(file.dateShared)}</span>
              <span className="text-slate-300 dark:text-slate-755 font-black">&bull;</span>
              <div>{getPermissionBadge(file.permission)}</div>
            </div>
          </div>
        </div>

        {/* Right action details */}
        <div className="flex items-center gap-4 ml-4 shrink-0 overflow-visible" onClick={(e) => e.stopPropagation()}>
          {file.name.includes('Notes') ? (
            <div className="flex -space-x-1.5 shrink-0 hidden sm:flex">
              <div className="size-6 rounded-full bg-[#0fbf7c] text-white flex items-center justify-center font-bold text-[9px]">S</div>
              <div className="size-6 rounded-full bg-[#5f6ffc] text-white flex items-center justify-center font-bold text-[9px]">D</div>
            </div>
          ) : file.name.includes('Assets') ? (
            <span className="rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2 py-0.5 text-[9px] font-black text-slate-550 dark:text-slate-300 tracking-wider">
              +3
            </span>
          ) : null}

          {file.name.includes('Notes') && (
            <span className="rounded-md bg-blue-50/70 dark:bg-blue-955 border border-blue-100/50 dark:border-blue-900/50 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-[#3155F6] dark:text-blue-400">
              {t.fileViewer.summary.toUpperCase()}
            </span>
          )}

          {/* 3-dots actions trigger */}
          <div className="relative">
            <button
              type="button"
              ref={buttonRef}
              onClick={onMenuToggle}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-55 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Actions"
              aria-haspopup="menu"
            >
              <MoreVertical className="size-4.5" />
            </button>
            <FileActionsDropdown
              file={file}
              isOpen={isMenuOpen}
              onClose={onMenuClose}
              onOpen={onOpenFile}
              onDownload={onDownload}
              onShareAccess={onShareAccess}
              onRename={onRename}
              onChangePermission={() => onChangePermission(file)}
              onRemoveAccess={() => onRemoveAccess(file)}
              onReport={onReport}
              buttonRef={buttonRef}
            />
          </div>
        </div>
      </div>
    )
  }

  // 2. GRID MODE DISPLAY
  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 ease-out cursor-pointer shadow-xs select-none hover:shadow-md hover:border-blue-500/30 min-h-[160px] overflow-visible",
        isSelected 
          ? "bg-blue-50/20 dark:bg-blue-955/10 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between overflow-visible">
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getFileBg(file.type))}>
          {getFileIcon(file.type)}
        </div>
        
        <div className="flex items-center gap-1.5 overflow-visible" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onStarToggle}
            className="p-1 rounded-lg text-slate-350 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Star className={cn("size-4", isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700")} />
          </button>
          
          <div className="relative">
            <button
              type="button"
              ref={buttonRef}
              onClick={onMenuToggle}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Actions"
              aria-haspopup="menu"
            >
              <MoreVertical className="size-4" />
            </button>
            <FileActionsDropdown
              file={file}
              isOpen={isMenuOpen}
              onClose={onMenuClose}
              onOpen={onOpenFile}
              onDownload={onDownload}
              onShareAccess={onShareAccess}
              onRename={onRename}
              onChangePermission={() => onChangePermission(file)}
              onRemoveAccess={() => onRemoveAccess(file)}
              onReport={onReport}
              buttonRef={buttonRef}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="line-clamp-1 text-sm font-extrabold text-slate-855 dark:text-slate-100" title={file.name}>
          {file.name}
        </h3>
        
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold truncate max-w-[120px]">
            {file.owner || 'Alex Rivera'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold shrink-0">
            {formatSharedDate(file.dateShared)}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-2">
        <div>{getPermissionBadge(file.permission)}</div>
        {file.name.includes('Notes') && (
          <span className="rounded-md bg-blue-50/70 dark:bg-blue-955 border border-blue-100/50 dark:border-blue-900/50 px-2 py-0.5 text-[8px] font-black tracking-wider text-[#3155F6] dark:text-blue-400">
            {t.fileViewer.summary.toUpperCase()}
          </span>
        )}
      </div>
    </div>
  )
}

export default WorkspaceFileCard

import { FileText, FileSpreadsheet, Folder, MoreVertical, Eye, Edit2, Star, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SharedFile } from './SharedFilesTable'

interface WorkspaceFileCardProps {
  file: SharedFile
  isSelected: boolean
  isFavorite: boolean
  viewMode: 'list' | 'grid'
  onSelect: () => void
  onDoubleClick: () => void
  onStarToggle: (e: React.MouseEvent) => void
  onMenuToggle: (e: React.MouseEvent) => void
  buttonRef: (el: HTMLButtonElement | null) => void
}

export function WorkspaceFileCard({
  file,
  isSelected,
  isFavorite,
  viewMode,
  onSelect,
  onDoubleClick,
  onStarToggle,
  onMenuToggle,
  buttonRef
}: WorkspaceFileCardProps) {
  
  const getFileIcon = (type: SharedFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="size-5 text-red-550" />
      case 'xlsx':
        return <FileSpreadsheet className="size-5 text-emerald-500" />
      case 'docx':
        return <FileText className="size-5 text-blue-500" />
      case 'txt':
        return <FileText className="size-5 text-slate-500" />
      case 'image':
        return <ImageIcon className="size-5 text-amber-500" />
      case 'folder':
        return <Folder className="size-5 text-indigo-500" />
      default:
        return <FileText className="size-5 text-slate-400" />
    }
  }

  const getFileBg = (type: SharedFile['type']) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-55/10 dark:bg-red-955/20'
      case 'xlsx':
        return 'bg-emerald-55/10 dark:bg-emerald-955/20'
      case 'docx':
        return 'bg-blue-55/10 dark:bg-blue-955/20'
      case 'txt':
        return 'bg-slate-100 dark:bg-slate-800/40'
      case 'image':
        return 'bg-amber-55/10 dark:bg-amber-955/20'
      case 'folder':
        return 'bg-indigo-50/10 dark:bg-indigo-955/20'
      default:
        return 'bg-slate-50 dark:bg-slate-800/20'
    }
  }

  const getPermissionBadge = (perm: SharedFile['permission']) => {
    switch (perm) {
      case 'Owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Owner
          </span>
        )
      case 'Editor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/20">
            <Edit2 className="size-2.5" />
            Editor
          </span>
        )
      case 'View Only':
      case 'Viewer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#3155F6] dark:bg-blue-955/30 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20">
            <Eye className="size-2.5" />
            Viewer
          </span>
        )
    }
  }

  // Double click handler
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
          "group relative flex items-center justify-between rounded-3xl border p-4 transition-all duration-200 cursor-pointer shadow-xs select-none hover:shadow-md hover:border-blue-500/30",
          isSelected 
            ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500" 
            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        )}
      >
        <div className="flex items-center gap-4.5 min-w-0 flex-1">
          {/* File icon */}
          <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getFileBg(file.type))}>
            {getFileIcon(file.type)}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-extrabold text-slate-850 dark:text-slate-100">
                {file.name}
              </h3>
              
              {/* Star toggle button */}
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
                <span className="size-4.5 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center font-bold text-[9px] text-slate-600 dark:text-slate-300">
                  {file.owner ? file.owner.charAt(0) : 'A'}
                </span>
                <span>{file.owner || 'Alex Chen'}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-750 font-black">&bull;</span>
              <span>{file.dateShared.includes('ago') ? file.dateShared : `Shared ${file.dateShared}`}</span>
              <span className="text-slate-300 dark:text-slate-750 font-black">&bull;</span>
              <div>{getPermissionBadge(file.permission)}</div>
            </div>
          </div>
        </div>

        {/* Right action details */}
        <div className="flex items-center gap-4 ml-4 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Collaborator stack or badge */}
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

          {/* Special summary badge */}
          {file.name.includes('Notes') && (
            <span className="rounded-md bg-blue-50/70 dark:bg-blue-955 border border-blue-100/50 dark:border-blue-900/50 px-2.5 py-0.5 text-[9px] font-black tracking-wider text-[#3155F6] dark:text-blue-400">
              SUMMARY
            </span>
          )}

          {/* 3-dots actions trigger */}
          <button
            type="button"
            ref={buttonRef}
            onClick={onMenuToggle}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Actions"
            aria-haspopup="menu"
          >
            <MoreVertical className="size-4.5" />
          </button>
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
        "group relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-200 cursor-pointer shadow-xs select-none hover:shadow-md hover:border-blue-500/30 min-h-[160px]",
        isSelected 
          ? "bg-blue-50/20 dark:bg-blue-950/10 border-blue-600 dark:border-blue-500 ring-1 ring-blue-500" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getFileBg(file.type))}>
          {getFileIcon(file.type)}
        </div>
        
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onStarToggle}
            className="p-1 rounded-lg text-slate-350 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Star className={cn("size-4", isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-700")} />
          </button>
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
        </div>
      </div>

      <div className="mt-4 flex-1">
        <h3 className="line-clamp-1 text-sm font-extrabold text-slate-850 dark:text-slate-100" title={file.name}>
          {file.name}
        </h3>
        
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate max-w-[120px]">
            {file.owner || 'Alex Rivera'}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold shrink-0">
            {file.dateShared.includes('ago') ? file.dateShared : file.dateShared}
          </span>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between gap-2">
        <div>{getPermissionBadge(file.permission)}</div>
        {file.name.includes('Notes') && (
          <span className="rounded-md bg-blue-50/70 dark:bg-blue-955 border border-blue-100/50 dark:border-blue-900/50 px-2 py-0.5 text-[8px] font-black tracking-wider text-[#3155F6] dark:text-blue-400">
            SUMMARY
          </span>
        )}
      </div>
    </div>
  )
}

export default WorkspaceFileCard

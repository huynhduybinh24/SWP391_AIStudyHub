import { useState, useRef } from 'react'
import { MoreVertical, Users, ArrowDown, ArrowUp, Star } from 'lucide-react'
import { SharedFile } from './SharedFilesTable'
import { FileActionsDropdown } from './FileActionsDropdown'
import { FileTypeIcon } from './FileTypeIcon'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface WorkspaceFileTableProps {
  files: SharedFile[]
  selectedFile: SharedFile | null
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

export function WorkspaceFileTable({
  files,
  selectedFile,
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
}: WorkspaceFileTableProps) {
  const { t, language } = useTranslation()
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  // Date format helper to match Google Drive format for locales
  const formatDate = (dateStr: string) => {
    if (dateStr.toLowerCase().includes('ago') || dateStr.toLowerCase().includes('now')) {
      return dateStr
    }
    
    // Simple mapper for mock data dates: "May 18", "May 13", "Mar 28", "Mar 27", "Mar 26"
    const isVi = language === 'vi'
    const isJa = language === 'ja'
    const isKo = language === 'ko'

    if (dateStr.includes('May 18')) {
      return isVi ? '18 thg 5' : (isJa ? '5月18日' : (isKo ? '5월 18일' : 'May 18'))
    }
    if (dateStr.includes('May 13')) {
      return isVi ? '13 thg 5' : (isJa ? '5月13日' : (isKo ? '5월 13일' : 'May 13'))
    }
    if (dateStr.includes('Mar 28')) {
      return isVi ? '28 thg 3' : (isJa ? '3月28日' : (isKo ? '3월 28일' : 'Mar 28'))
    }
    if (dateStr.includes('Mar 27')) {
      return isVi ? '27 thg 3' : (isJa ? '3月27日' : (isKo ? '3월 27일' : 'Mar 27'))
    }
    if (dateStr.includes('Mar 26')) {
      return isVi ? '26 thg 3' : (isJa ? '3月26日' : (isKo ? '3월 26일' : 'Mar 26'))
    }
    return dateStr
  }

  // Get file time group
  const getFileGroup = (file: SharedFile) => {
    if (file.timeGroup) return file.timeGroup
    const dateStr = file.dateShared.toLowerCase()
    if (dateStr.includes('now') || dateStr.includes('ago') || dateStr.includes('today') || dateStr.includes('yesterday') || dateStr.includes('may 18')) {
      return 'thisWeek'
    }
    if (dateStr.includes('may 13')) {
      return 'lastWeek'
    }
    return 'earlierThisYear'
  }

  // Define Groups to render in sequence
  const groups: { key: 'thisWeek' | 'lastWeek' | 'earlierThisYear'; label: string }[] = [
    { key: 'thisWeek', label: t.sharedFiles.thisWeek || 'This week' },
    { key: 'lastWeek', label: t.sharedFiles.lastWeek || 'Last week' },
    { key: 'earlierThisYear', label: t.sharedFiles.earlierThisYear || 'Earlier this year' }
  ]

  // Get Avatar background based on owner name
  const getAvatarBg = (owner: string) => {
    const hash = owner.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = [
      'bg-red-500',
      'bg-emerald-500',
      'bg-blue-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-cyan-500'
    ]
    return colors[hash % colors.length]
  }

  return (
    <div className="w-full overflow-visible bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[28px] p-2 shadow-xs select-none">
      <div className="w-full overflow-x-auto overflow-y-visible">
        <table className="w-full border-collapse text-left min-w-0">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/60">
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-[45%]">
                {t.sharedFiles.name || 'Name'}
              </th>
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-[25%] hidden md:table-cell">
                {t.sharedFiles.sharedBy || 'Shared by'}
              </th>
              <th
                className="py-3 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-[20%] cursor-pointer hover:text-slate-850 dark:hover:text-slate-200 select-none group hidden xl:table-cell"
                onClick={() => onSortOrderChange(sortOrder === 'recent' ? 'oldest' : 'recent')}
              >
                <div className="flex items-center gap-1.5">
                  <span>{t.sharedFiles.dateShared || 'Date shared'}</span>
                  <div className="size-4.5 rounded-full bg-blue-50 dark:bg-blue-955 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                    {sortOrder === 'recent' ? (
                      <ArrowDown className="size-3 stroke-[2.5]" />
                    ) : (
                      <ArrowUp className="size-3 stroke-[2.5]" />
                    )}
                  </div>
                </div>
              </th>
              <th className="py-3 px-5 text-xs font-semibold text-slate-500 dark:text-slate-400 w-[10%] text-right">
                {/* Actions Header */}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
            {groups.map((group) => {
              const groupFiles = files.filter(f => getFileGroup(f) === group.key)
              if (groupFiles.length === 0) return null

              return (
                <tr key={group.key} className="contents">
                  {/* Time Group Header Row */}
                  <tr>
                    <td colSpan={4} className="py-4 px-5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/10">
                      {group.label}
                    </td>
                  </tr>

                  {/* File Rows in this Group */}
                  {groupFiles.map((file) => {
                    const isSelected = selectedFile?.id === file.id
                    const isFav = favorites.includes(file.id)
                    const ownerChar = file.owner ? file.owner.charAt(0).toUpperCase() : 'A'
                    const ownerName = file.owner ? file.owner.split('@')[0] : 'Unknown'

                    return (
                      <tr
                        key={file.id}
                        onClick={() => onSelectFile(file)}
                        onDoubleClick={() => onOpenFile(file)}
                        className={cn(
                          "h-[56px] transition-all group border-b border-slate-100 dark:border-slate-800/40 cursor-pointer relative",
                          isSelected
                            ? "bg-blue-50/20 dark:bg-blue-955/15 border-l-[3px] border-l-blue-600 dark:border-l-blue-500"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-l-[3px] border-l-transparent"
                        )}
                      >
                        {/* Name Column */}
                        <td className="py-2.5 px-5 font-medium text-slate-850 dark:text-slate-150">
                          <div className="flex items-center gap-3">
                            <FileTypeIcon type={file.type} className="shrink-0" />
                            <div className="flex items-center gap-2 truncate max-w-[280px] md:max-w-[340px]">
                              <span className="truncate text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-200">
                                {file.name}
                              </span>
                              
                              {file.collaborators && (
                                <span title="Collaborators" className="shrink-0 inline-flex">
                                  <Users className="size-3.5 text-slate-400" />
                                </span>
                              )}
                            </div>

                            {/* Star Icon for Favorite toggle on hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                onStarToggle(file)
                              }}
                              className={cn(
                                "p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer",
                                isFav && "opacity-100 text-amber-500"
                              )}
                              title="Toggle favorite"
                            >
                              <Star className={cn("size-3.5", isFav ? "fill-amber-500 text-amber-500" : "text-slate-400 dark:text-slate-500")} />
                            </button>
                          </div>
                        </td>

                        {/* Shared By Column */}
                        <td className="py-2.5 px-5 text-xs text-slate-600 dark:text-slate-350 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className={cn("size-6 rounded-full text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm", getAvatarBg(file.owner || ''))}>
                              {ownerChar}
                            </div>
                            <span className="truncate font-medium text-slate-700 dark:text-slate-300" title={file.owner}>
                              {ownerName}
                            </span>
                          </div>
                        </td>

                        {/* Date Shared Column */}
                        <td className="py-2.5 px-5 text-xs font-medium text-slate-500 dark:text-slate-400 hidden xl:table-cell">
                          {formatDate(file.dateShared)}
                        </td>

                        {/* Actions Column */}
                        <td className="py-2.5 px-5 text-right relative overflow-visible" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            ref={(el) => { buttonRefs.current[file.id] = el }}
                            onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex cursor-pointer focus:outline-none"
                            aria-label="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </button>

                          <FileActionsDropdown
                            file={file}
                            isOpen={activeMenuId === file.id}
                            onClose={() => setActiveMenuId(null)}
                            onOpen={() => onOpenFile(file)}
                            onDownload={() => onDownload(file)}
                            onShareAccess={() => onShareAccess(file)}
                            onRename={() => onRename(file)}
                            onChangePermission={() => onChangePermission(file)}
                            onRemoveAccess={() => onRemoveAccess(file)}
                            buttonRef={{ current: buttonRefs.current[file.id] } as any}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default WorkspaceFileTable

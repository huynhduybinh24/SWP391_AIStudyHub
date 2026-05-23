import { useState, useRef } from 'react'
import { FileText, FileSpreadsheet, Folder, MoreVertical, Eye, Edit2, Image as ImageIcon } from 'lucide-react'
import { FileActionsDropdown } from './FileActionsDropdown'
import { cn } from '@/lib/utils'

export interface SharedFile {
  id: string
  name: string
  type: 'pdf' | 'docx' | 'xlsx' | 'txt' | 'image' | 'folder'
  owner?: string
  sharedWith?: string
  permission: 'View Only' | 'Viewer' | 'Editor' | 'Owner'
  dateShared: string
  size: string
  totalPages?: number
  description: string
  tags: string[]
  previewContent?: string
  summary?: string
}

interface SharedFilesTableProps {
  files: SharedFile[]
  onOpen: (file: SharedFile) => void
  onRename: (file: SharedFile) => void
  onChangePermission: (file: SharedFile) => void
  onRemoveAccess: (file: SharedFile) => void
  isSharedByMe?: boolean
}

export function SharedFilesTable({
  files,
  onOpen,
  onRename,
  onChangePermission,
  onRemoveAccess,
  isSharedByMe = false
}: SharedFilesTableProps) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

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
        return <FileText className="size-5 text-slate-450" />
    }
  }

  const getFileBg = (type: SharedFile['type']) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-55/10 dark:bg-red-950/20'
      case 'xlsx':
        return 'bg-emerald-55/10 dark:bg-emerald-950/20'
      case 'docx':
        return 'bg-blue-55/10 dark:bg-blue-950/20'
      case 'txt':
        return 'bg-slate-100 dark:bg-slate-800/40'
      case 'image':
        return 'bg-amber-55/10 dark:bg-amber-950/20'
      case 'folder':
        return 'bg-indigo-50/10 dark:bg-indigo-950/20'
      default:
        return 'bg-slate-50 dark:bg-slate-800/20'
    }
  }

  const getPermissionBadge = (perm: SharedFile['permission']) => {
    switch (perm) {
      case 'Owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Owner
          </span>
        )
      case 'Editor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/20">
            <Edit2 className="size-3" />
            Editor
          </span>
        )
      case 'View Only':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#3155F6] dark:bg-blue-955/30 dark:text-blue-400 border border-blue-100/30 dark:border-blue-900/20">
            <Eye className="size-3" />
            View Only
          </span>
        )
      case 'Viewer':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-105 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800">
            <Eye className="size-3" />
            Viewer
          </span>
        )
    }
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="size-12 text-slate-305 dark:text-slate-700 mb-3" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No shared files found</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Files shared in this category will appear here.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900">
      <table className="w-full border-collapse text-left min-w-[640px]">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-[#F8FAFC]/80 dark:bg-slate-800/40">
            <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Name</th>
            <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">
              {isSharedByMe ? 'Shared With' : 'Owner'}
            </th>
            <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Permissions</th>
            <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Date Shared</th>
            <th className="py-4 px-6 text-xs font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
          {files.map((file) => (
            <tr
              key={file.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
            >
              <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                <div className="flex items-center gap-3.5 max-w-[320px]">
                  <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getFileBg(file.type))}>
                    {getFileIcon(file.type)}
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(file)}
                    className="truncate text-sm font-extrabold text-slate-850 hover:text-[#3155F6] dark:text-slate-200 dark:hover:text-blue-400 hover:underline cursor-pointer text-left focus:outline-none"
                    title={file.name}
                  >
                    {file.name}
                  </button>
                </div>
              </td>
              <td className="py-4 px-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
                {isSharedByMe ? file.sharedWith : file.owner}
              </td>

              <td className="py-4 px-6 font-semibold">
                {getPermissionBadge(file.permission)}
              </td>
              <td className="py-4 px-6 text-sm font-semibold text-slate-450 dark:text-slate-400">
                {file.dateShared}
              </td>
              <td className="py-4 px-6 text-right relative">
                <button
                  type="button"
                  ref={(el) => { buttonRefs.current[file.id] = el }}
                  onClick={() => setActiveDropdownId(activeDropdownId === file.id ? null : file.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex cursor-pointer"
                  aria-label="File action menu"
                  aria-expanded={activeDropdownId === file.id}
                >
                  <MoreVertical className="size-4.5" />
                </button>

                <FileActionsDropdown
                  isOpen={activeDropdownId === file.id}
                  onClose={() => setActiveDropdownId(null)}
                  onOpen={() => onOpen(file)}
                  onRename={() => onRename(file)}
                  onChangePermission={() => onChangePermission(file)}
                  onRemoveAccess={() => onRemoveAccess(file)}
                  buttonRef={{ current: buttonRefs.current[file.id] } as any}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SharedFilesTable

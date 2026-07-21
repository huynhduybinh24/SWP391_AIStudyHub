import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserPlus, ArrowLeft, Settings, Link } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { PermissionDropdown, type ShareRole } from './PermissionDropdown'
import { GeneralAccessSelector } from './GeneralAccessSelector'
import { useTranslation } from '@/context/LanguageContext'
import { useAuthStore } from '@/stores/authStore'
import { documentService } from '@/services/documentService'

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'owner' | 'editor' | 'commenter' | 'viewer'
  avatarBg?: string
}

export interface ShareAccessModalProps {
  isOpen: boolean
  onClose: () => void
  fileId?: string
  fileName?: string
  collaborators?: Collaborator[]
  workspaceCollaborators?: any[]
  onCollaboratorsChange?: (collaborators: Collaborator[]) => void
  generalAccess?: 'restricted' | 'public'
  onGeneralAccessChange?: (type: 'restricted' | 'public') => void
  showToast?: (msg: string) => void // optional callback
  initialCollaborators?: Collaborator[] // backward compatibility
  onShareSubmit?: (email: string, permission: 'Viewer' | 'Editor') => void // backward compatibility
  folderId?: string
  folderName?: string
  owner?: string
  type?: 'file' | 'folder'
  permission?: string
  onUpdateCollaboratorRole?: (id: string, role: 'Editor' | 'Viewer') => void
  onRemoveCollaborator?: (id: string) => void
}

export function ShareAccessModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  collaborators,
  workspaceCollaborators = [],
  onCollaboratorsChange,
  generalAccess,
  onGeneralAccessChange,
  showToast: customShowToast,
  initialCollaborators,
  onShareSubmit,
  folderId,
  folderName,
  owner: _owner,
  type: _type = 'file',
  permission: _permission,
  onUpdateCollaboratorRole,
  onRemoveCollaborator
}: ShareAccessModalProps) {
  const toast = useToast()
  const { t, language } = useTranslation()
  const { user } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const activeFileId = fileId || folderId || 'default-file'
  const activeFileName = fileName || folderName || ''

  // Advanced settings and inner modal navigation states
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState(false)
  const [editorsCanShare, setEditorsCanShare] = useState(true)
  const [viewersCanDownload, setViewersCanDownload] = useState(true)

  // Local fallback states for uncontrolled usage
  const [localCollaborators, setLocalCollaborators] = useState<Collaborator[]>([])
  const [localGeneralAccess, setLocalGeneralAccess] = useState<'restricted' | 'public'>('restricted')
  const [publicRole, setPublicRole] = useState<ShareRole>('viewer')

  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<ShareRole>('viewer')

  const modalRef = useRef<HTMLDivElement>(null)

  // Helper to trigger toast notifications
  const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
    if (customShowToast) {
      customShowToast(msg)
    } else {
      if (type === 'success') toast.success(msg)
      else if (type === 'error') toast.error(msg)
      else toast.warning(msg)
    }
  }

  // Color palette for collaborator avatars
  const avatarColors = [
    'bg-[#5f6ffc]',
    'bg-[#fc9d1c]',
    'bg-[#ec4899]',
    'bg-[#8b5cf6]',
    'bg-[#0fbf7c]',
    'bg-rose-500'
  ]

  // Centralized helper to build clean, real collaborator list (deduplicated by email)
  const buildMergedCollaborators = (
    docOwnerName?: string,
    docOwnerEmail?: string,
    directShares: Collaborator[] = []
  ): Collaborator[] => {
    const list: Collaborator[] = []
    const seenEmails = new Set<string>()

    // Determine Owner Email (never use dummy me@example.com)
    let realOwnerEmail = user?.email || 'student@lumiedu.com'
    if (docOwnerEmail && !docOwnerEmail.includes('example.com') && !docOwnerEmail.includes('me@')) {
      realOwnerEmail = docOwnerEmail
    }

    // Determine Owner Name
    let realOwnerName = user?.name || 'Huỳnh Duy Bình'
    if (docOwnerName && docOwnerName !== 'me' && docOwnerName !== 'Tôi' && docOwnerName !== 'Alex Rivera') {
      realOwnerName = docOwnerName
    }

    // 1. Add Owner
    if (realOwnerEmail) {
      seenEmails.add(realOwnerEmail.trim().toLowerCase())
    }
    list.push({
      id: 'owner',
      name: realOwnerName,
      email: realOwnerEmail,
      role: 'owner',
      avatarBg: 'bg-[#0fbf7c]'
    })

    // 2. Add Active Workspace Collaborators
    if (workspaceCollaborators && workspaceCollaborators.length > 0) {
      workspaceCollaborators.forEach((wm: any, idx: number) => {
        const emailLower = (wm.email || '').trim().toLowerCase()
        if (emailLower && !seenEmails.has(emailLower)) {
          seenEmails.add(emailLower)
          const rawRole = String(wm.role || 'Viewer').toLowerCase()
          let mappedRole: 'owner' | 'editor' | 'viewer' = 'viewer'
          if (rawRole.includes('owner')) mappedRole = 'owner'
          else if (rawRole.includes('editor') || rawRole.includes('collaborator')) mappedRole = 'editor'

          list.push({
            id: String(wm.id || `wm-${idx}`),
            name: wm.name || emailLower.split('@')[0],
            email: wm.email,
            role: mappedRole,
            avatarBg: avatarColors[(idx + 1) % avatarColors.length]
          })
        }
      })
    }

    // 3. Add Direct Document Shares & Local Props Collaborators
    directShares.forEach((sc, idx) => {
      const emailLower = (sc.email || '').trim().toLowerCase()
      if (emailLower && !seenEmails.has(emailLower)) {
        seenEmails.add(emailLower)
        list.push({
          ...sc,
          avatarBg: sc.avatarBg || avatarColors[(idx + 2) % avatarColors.length]
        })
      }
    })

    return list
  }

  // Synchronize incoming props and workspace members on open
  useEffect(() => {
    if (isOpen) {
      setIsSettingsViewOpen(false)
      setNewEmail('')
      setNewRole('viewer')
      setIsLoading(false)
      setHasError(false)

      if (generalAccess) {
        setLocalGeneralAccess(generalAccess)
      } else {
        setLocalGeneralAccess('restricted')
      }

      // Initial instant merge of workspace members and collaborators
      const mergedInitial = buildMergedCollaborators(
        _owner,
        user?.email,
        collaborators || initialCollaborators || []
      )
      setLocalCollaborators(mergedInitial)
    }
  }, [isOpen, generalAccess, _owner, user, collaborators, initialCollaborators, workspaceCollaborators])

  // Load API document shares silently in background when fileId is numeric
  useEffect(() => {
    if (!isOpen) return
    const isNumeric = fileId && /^\d+$/.test(fileId)
    if (!isNumeric) return

    let isMounted = true
    const loadData = async () => {
      try {
        const [docRes, sharesRes] = await Promise.allSettled([
          documentService.getDocumentById(fileId),
          documentService.getDocumentShares(fileId)
        ])

        if (!isMounted) return

        let ownerName = user?.name || 'Huỳnh Duy Bình'
        let ownerEmail = user?.email || 'student@lumiedu.com'

        if (docRes.status === 'fulfilled' && docRes.value) {
          ownerName = docRes.value.ownerName || ownerName
          ownerEmail = docRes.value.ownerEmail || ownerEmail
        }

        let shareCollabs: Collaborator[] = []
        if (sharesRes.status === 'fulfilled' && Array.isArray(sharesRes.value)) {
          shareCollabs = sharesRes.value.map((share, idx) => {
            const email = share.shareeEmail
            const namePart = email.split('@')[0]
            const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)
            return {
              id: String(share.id),
              name: capitalizedName,
              email: email,
              role: share.role as any,
              avatarBg: avatarColors[idx % avatarColors.length]
            }
          })
        }

        const combinedShares = [...shareCollabs, ...(collaborators || []), ...(initialCollaborators || [])]
        const finalMerged = buildMergedCollaborators(ownerName, ownerEmail, combinedShares)
        setLocalCollaborators(finalMerged)
      } catch (err) {
        console.error('Failed to load extra sharing info from API:', err)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [isOpen, fileId, collaborators, initialCollaborators])

  const handleCopyLink = async () => {
    try {
      const linkToCopy = window.location.origin + `/share/${activeFileId}`
      await navigator.clipboard.writeText(linkToCopy)
      const msg = language === 'vi' ? 'Đã sao chép liên kết vào bộ nhớ tạm!' : (t.shareAccess?.linkCopiedToast || 'Link copied to clipboard')
      triggerToast(msg)
    } catch {
      triggerToast(language === 'vi' ? 'Không thể sao chép liên kết' : (t.shareAccess?.copyLinkError || 'Failed to copy link'), 'error')
    }
  }

  const handleAddCollaborator = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      const msg = language === 'vi' ? 'Vui lòng nhập địa chỉ email hợp lệ!' : (t.shareAccess?.invalidEmailError || 'Please enter a valid email address')
      triggerToast(msg, 'error')
      return
    }

    const emailTrimmed = newEmail.trim().toLowerCase()
    const isAlreadyAdded = localCollaborators.some(
      c => c.email.toLowerCase() === emailTrimmed
    )
    if (isAlreadyAdded) {
      const msg = language === 'vi' ? 'Email này đã có trong danh sách truy cập!' : (t.shareAccess?.userAlreadyAddedError || 'User is already added')
      triggerToast(msg, 'warning')
      return
    }

    const namePart = emailTrimmed.split('@')[0]
    const capitalizedName = namePart.charAt(0).toUpperCase() + namePart.slice(1)

    const colors = [
      'bg-[#5f6ffc]',
      'bg-[#fc9d1c]',
      'bg-[#ec4899]',
      'bg-[#8b5cf6]',
      'bg-[#0fbf7c]',
      'bg-rose-500'
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newCollab: Collaborator = {
      id: String(Date.now()),
      name: capitalizedName,
      email: emailTrimmed,
      role: newRole,
      avatarBg: randomColor
    }

    const isNumeric = fileId && /^\d+$/.test(fileId)
    if (isNumeric) {
      try {
        await documentService.addOrUpdateDocumentShare(fileId, emailTrimmed, newRole)
      } catch (err: any) {
        console.error('Failed to add share via API:', err)
        const apiErrMsg = err.response?.data?.message || err.message || 'Failed to share document'
        triggerToast(apiErrMsg, 'error')
        return
      }
    }

    const updated = [...localCollaborators, newCollab]
    setLocalCollaborators(updated)

    if (onCollaboratorsChange) {
      onCollaboratorsChange(updated)
    }

    if (onShareSubmit) {
      const permString = newRole === 'editor' ? 'Editor' : 'Viewer'
      onShareSubmit(emailTrimmed, permString)
    }

    setNewEmail('')
    setNewRole('viewer')
    const successMsg = language === 'vi' 
      ? `Đã chia sẻ tài liệu thành công tới ${emailTrimmed}`
      : (t.shareAccess?.collaboratorAddedToast || 'Collaborator added successfully')
    triggerToast(successMsg)
  }

  const handleRoleChange = async (collabId: string, role: ShareRole) => {
    if (role === 'remove') {
      await handleRemoveCollaborator(collabId)
      return
    }

    const targetCollab = localCollaborators.find(c => c.id === collabId)
    const isNumeric = fileId && /^\d+$/.test(fileId)

    if (isNumeric && targetCollab && targetCollab.role !== 'owner') {
      try {
        await documentService.addOrUpdateDocumentShare(fileId, targetCollab.email, role)
      } catch (err: any) {
        console.error('Failed to update share role via API:', err)
        const apiErrMsg = err.response?.data?.message || err.message || 'Failed to update role'
        triggerToast(apiErrMsg, 'error')
        return
      }
    }

    const updated = localCollaborators.map(c => {
      if (c.id === collabId) {
        return { ...c, role }
      }
      return c
    })

    setLocalCollaborators(updated)

    if (onCollaboratorsChange) {
      onCollaboratorsChange(updated)
    }

    if (onUpdateCollaboratorRole && targetCollab) {
      const permString = role === 'editor' ? 'Editor' : 'Viewer'
      onUpdateCollaboratorRole(collabId, permString)
    }

    const msg = language === 'vi' ? 'Đã cập nhật quyền thành công' : (t.shareAccess?.roleUpdatedToast || 'Role updated successfully')
    triggerToast(msg)
  }

  const handleRemoveCollaborator = async (collabId: string) => {
    const targetCollab = localCollaborators.find(c => c.id === collabId)
    const isNumeric = fileId && /^\d+$/.test(fileId)

    if (isNumeric && targetCollab && targetCollab.role !== 'owner') {
      try {
        await documentService.deleteDocumentShare(fileId, targetCollab.email)
      } catch (err: any) {
        console.error('Failed to remove share via API:', err)
        const apiErrMsg = err.response?.data?.message || err.message || 'Failed to remove share'
        triggerToast(apiErrMsg, 'error')
        return
      }
    }

    const updated = localCollaborators.filter(c => c.id !== collabId)
    setLocalCollaborators(updated)

    if (onCollaboratorsChange) {
      onCollaboratorsChange(updated)
    }

    if (onRemoveCollaborator) {
      onRemoveCollaborator(collabId)
    }

    const msg = language === 'vi' ? 'Đã xóa quyền truy cập' : (t.shareAccess?.collaboratorRemovedToast || 'Collaborator removed')
    triggerToast(msg)
  }

  const handleGeneralAccessTypeChange = (type: 'restricted' | 'public') => {
    setLocalGeneralAccess(type)
    if (onGeneralAccessChange) {
      onGeneralAccessChange(type)
    }
    const msg = type === 'public' 
      ? (language === 'vi' ? 'Bất kỳ ai có liên kết đều có thể truy cập' : (t.shareAccess?.anyoneWithLinkToast || 'Anyone with link can access'))
      : (language === 'vi' ? 'Đã chuyển sang chế độ Hạn chế' : (t.shareAccess?.restrictedAccessToast || 'Access restricted'))
    triggerToast(msg)
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-x-hidden overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#060c18]/50 dark:bg-black/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Window Container */}
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-[500px] overflow-hidden rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xl text-left backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 max-w-[80%]">
              {isSettingsViewOpen && (
                <button
                  type="button"
                  onClick={() => setIsSettingsViewOpen(false)}
                  className="p-1 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeft className="size-5" />
                </button>
              )}
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {isSettingsViewOpen 
                  ? (language === 'vi' ? 'Cài đặt chia sẻ' : (t.shareAccess?.settingsTitle || 'Share settings'))
                  : (language === 'vi' ? `Chia sẻ truy cập "${activeFileName}"` : `${t.shareAccess?.modalTitle || 'Share Access'} "${activeFileName}"`)}
              </h3>
            </div>

            <div className="flex items-center gap-1">
              {!isSettingsViewOpen && (
                <button
                  type="button"
                  onClick={() => setIsSettingsViewOpen(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={language === 'vi' ? 'Cài đặt nâng cao' : (t.shareAccess?.settingsTooltip || 'Share settings')}
                >
                  <Settings className="size-4.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>
          </div>

          {/* Sub-view: Advanced Settings */}
          {isSettingsViewOpen ? (
            <div className="space-y-4 py-2 text-left">
              <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editorsCanShare}
                  onChange={e => setEditorsCanShare(e.target.checked)}
                  className="mt-1 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {language === 'vi' ? 'Người chỉnh sửa có thể thay đổi quyền và chia sẻ' : (t.shareAccess?.editorsCanShare || 'Editors can change permissions and share')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'vi' ? 'Cho phép người có quyền chỉnh sửa thêm thành viên mới' : (t.shareAccess?.editorsCanShareSub || 'Allow users with edit access to add new collaborators')}
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={viewersCanDownload}
                  onChange={e => setViewersCanDownload(e.target.checked)}
                  className="mt-1 size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {language === 'vi' ? 'Người xem có thể tải xuống, in và sao chép' : (t.shareAccess?.viewersCanDownload || 'Viewers can download, print, and copy')}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {language === 'vi' ? 'Hiển thị tùy chọn tải xuống và sao chép cho người xem' : (t.shareAccess?.viewersCanDownloadSub || 'Show download and copy options for viewers and commenters')}
                  </p>
                </div>
              </label>
            </div>
          ) : (
            /* Main Share Access Content */
            <div className="space-y-5 text-left">
              {/* Add Collaborator Input Row */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="size-4" />
                  </div>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCollaborator()
                      }
                    }}
                    placeholder={language === 'vi' ? 'Thêm người bằng email...' : (t.shareAccess?.emailInputPlaceholder || 'Add people by email...')}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="w-28">
                  <PermissionDropdown
                    value={newRole}
                    onChange={role => setNewRole(role as ShareRole)}
                    type="invite"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCollaborator}
                  disabled={!newEmail}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 transition-all cursor-pointer flex items-center justify-center shrink-0"
                  title={language === 'vi' ? 'Thêm người dùng' : (t.shareAccess?.addPeopleTooltip || 'Add person')}
                >
                  <UserPlus className="size-4" />
                </button>
              </div>

              {/* People with Access Section */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {language === 'vi' ? 'DANH SÁCH CÓ QUYỀN TRUY CẬP' : (t.shareAccess?.peopleWithAccessHeader || 'PEOPLE WITH ACCESS')}
                </h4>

                {isLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2].map(n => (
                      <div key={n} className="flex items-center gap-3 animate-pulse">
                        <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="h-2.5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasError ? (
                  <p className="text-xs text-rose-500 py-2">
                    {language === 'vi' ? 'Không thể tải thông tin người dùng từ máy chủ' : (t.shareAccess?.loadError || 'Failed to load user access information')}
                  </p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {localCollaborators.map(person => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0',
                              person.avatarBg || 'bg-indigo-600'
                            )}
                          >
                            {getInitials(person.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {person.name}
                              </p>
                              {person.role === 'owner' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                                  {language === 'vi' ? 'CHỦ SỞ HỮU' : (t.shareAccess?.ownerBadge || 'OWNER')}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {person.email}
                            </p>
                          </div>
                        </div>

                        <div className="w-28 shrink-0 flex justify-end">
                          {person.role === 'owner' ? (
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2 py-1">
                              {language === 'vi' ? 'Chủ sở hữu' : (t.shareAccess?.ownerRoleText || 'Owner')}
                            </span>
                          ) : (
                            <PermissionDropdown
                              value={person.role}
                              onChange={role => handleRoleChange(person.id, role as ShareRole)}
                              type="user"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* General Access Section */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  {language === 'vi' ? 'QUYỀN TRUY CẬP CHUNG' : (t.shareAccess?.generalAccessHeader || 'GENERAL ACCESS')}
                </h4>

                <GeneralAccessSelector
                  type={localGeneralAccess}
                  onChange={handleGeneralAccessTypeChange}
                  role={publicRole}
                  onRoleChange={setPublicRole}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 text-xs font-semibold rounded-xl text-indigo-600 border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer"
            >
              <Link className="size-3.5" />
              <span>{language === 'vi' ? 'Sao chép liên kết' : (t.shareAccess?.copyLinkButton || 'Copy Link')}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="px-5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-md shadow-indigo-500/20"
            >
              {language === 'vi' ? 'Xong' : (t.shareAccess?.doneButton || 'Done')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ShareAccessModal

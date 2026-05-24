import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserPlus, ArrowLeft, Settings, Link } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { PermissionDropdown, type ShareRole } from './PermissionDropdown'
import { GeneralAccessSelector } from './GeneralAccessSelector'
import { useTranslation } from '@/context/LanguageContext'

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'owner' | 'editor' | 'commenter' | 'viewer'
  avatarBg?: string
}

interface ShareAccessModalProps {
  isOpen: boolean
  onClose: () => void
  fileId?: string
  fileName?: string
  collaborators?: Collaborator[]
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
}

const defaultCollaborators: Collaborator[] = [
  {
    id: 'owner',
    name: 'Alex Rivera',
    email: 'alex@example.com',
    role: 'owner',
    avatarBg: 'bg-[#0fbf7c]'
  },
  {
    id: '1',
    name: 'Huynh Duy Binh',
    email: 'binh@example.com',
    role: 'editor',
    avatarBg: 'bg-[#5f6ffc]'
  },
  {
    id: '2',
    name: 'Ngoc Tan',
    email: 'tan@example.com',
    role: 'viewer',
    avatarBg: 'bg-[#fc9d1c]'
  }
]

export function ShareAccessModal({
  isOpen,
  onClose,
  fileId,
  fileName,
  collaborators,
  onCollaboratorsChange,
  generalAccess,
  onGeneralAccessChange,
  showToast: customShowToast,
  initialCollaborators,
  onShareSubmit,
  folderId,
  folderName,
  owner,
  type = 'file',
  permission
}: ShareAccessModalProps) {
  const toast = useToast()
  const { t } = useTranslation()

  const activeFileId = fileId || folderId || 'default-file'
  const activeFileName = fileName || folderName || ''

  // Advanced settings and inner modal navigation states
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState(false)
  const [editorsCanShare, setEditorsCanShare] = useState(true)
  const [viewersCanDownload, setViewersCanDownload] = useState(true)

  // Local fallback states for uncontrolled usage (e.g. My Documents FileViewer)
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

  // Synchronize incoming props to internal state on open
  useEffect(() => {
    if (isOpen) {
      setIsSettingsViewOpen(false)
      setNewEmail('')
      setNewRole('viewer')

      if (collaborators) {
        setLocalCollaborators(collaborators)
      } else if (initialCollaborators) {
        setLocalCollaborators(initialCollaborators)
      } else {
        setLocalCollaborators(defaultCollaborators)
      }

      if (generalAccess) {
        setLocalGeneralAccess(generalAccess)
      } else {
        setLocalGeneralAccess('restricted')
      }
    }
  }, [isOpen, collaborators, generalAccess, initialCollaborators])

  // Map controlled vs local values
  const activeCollaborators = collaborators !== undefined ? collaborators : localCollaborators
  const activeGeneralAccess = generalAccess !== undefined ? generalAccess : localGeneralAccess

  const updateCollaborators = (newCollabs: Collaborator[]) => {
    if (onCollaboratorsChange) {
      onCollaboratorsChange(newCollabs)
    } else {
      setLocalCollaborators(newCollabs)
    }
  }

  const updateGeneralAccess = (type: 'restricted' | 'public') => {
    if (onGeneralAccessChange) {
      onGeneralAccessChange(type)
    } else {
      setLocalGeneralAccess(type)
    }
  }

  // Keyboard trap and escape handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Simple focus trap
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      )
      if (focusable && focusable.length > 0) {
        const first = focusable[0] as HTMLElement
        const last = focusable[focusable.length - 1] as HTMLElement

        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === last) {
              first.focus()
              e.preventDefault()
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    // Focus email input on open
    setTimeout(() => {
      const emailInput = modalRef.current?.querySelector('input[type="text"]') as HTMLInputElement
      emailInput?.focus()
    }, 100)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleAddCollaborator = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      triggerToast(t.shareModal.invalidEmail, 'error')
      return
    }

    if (activeCollaborators.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      triggerToast(t.shareModal.alreadyHasAccess, 'warning')
      return
    }

    const newCollabName = newEmail.split('@')[0]
    const formattedName = newCollabName.charAt(0).toUpperCase() + newCollabName.slice(1)

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
      id: `collab-${Date.now()}`,
      name: formattedName,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatarBg: randomColor
    }

    const updated = [...activeCollaborators, newCollab]
    updateCollaborators(updated)
    setNewEmail('')

    if (onShareSubmit) {
      onShareSubmit(newCollab.email, newRole === 'editor' ? 'Editor' : 'Viewer')
    } else {
      triggerToast(t.shareModal.accessSharedSuccess)
    }
  }

  const handleRemoveCollaborator = (id: string, name: string) => {
    const updated = activeCollaborators.filter(c => c.id !== id)
    updateCollaborators(updated)
    triggerToast(t.shareModal.accessRemoved)
  }

  const handleChangeRole = (id: string, name: string, role: ShareRole) => {
    const updated = activeCollaborators.map(c => c.id === id ? { ...c, role } : c)
    updateCollaborators(updated)
    triggerToast(t.shareModal.permissionUpdated)
  }

  const handleCopyLink = () => {
    const link = `https://aistudyhub.app/shared/${activeFileId}`
    navigator.clipboard.writeText(link)
    triggerToast(t.shareModal.copiedLink)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden p-4 select-none">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className={cn(
              "w-[calc(100vw-24px)] rounded-[24px] sm:rounded-[28px] sm:w-[560px] sm:max-w-[90vw] md:max-w-[calc(100vw-32px)]",
              "shadow-[0_20px_60px_rgba(0,0,0,0.18)] border overflow-hidden z-10 font-sans flex flex-col relative max-h-[90vh] p-6 text-left",
              "bg-white text-slate-900 border-slate-200",
              "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800"
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {isSettingsViewOpen ? (
              /* sharing settings view */
              <div className="flex flex-col h-full animate-fade-in text-left">
                {/* Settings Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-slate-150 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer focus:outline-none"
                    title={t.common.back}
                    aria-label={t.common.back}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {t.shareModal.settingsTitle}
                  </h2>
                </div>

                {/* Settings Options */}
                <div className="py-6 flex-1 space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editorsCanShare}
                      onChange={(e) => {
                        setEditorsCanShare(e.target.checked)
                        triggerToast(e.target.checked ? t.shareModal.editorsCanShareToastTrue : t.shareModal.editorsCanShareToastFalse)
                      }}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 focus:ring-blue-500/50 mt-1 cursor-pointer focus:outline-none"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        {t.shareModal.editorsCanShareLabel}
                      </span>
                      <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-0.5">
                        {t.shareModal.editorsCanShareSub}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={viewersCanDownload}
                      onChange={(e) => {
                        setViewersCanDownload(e.target.checked)
                        triggerToast(e.target.checked ? t.shareModal.viewersCanDownloadToastTrue : t.shareModal.viewersCanDownloadToastFalse)
                      }}
                      className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-500 focus:ring-blue-500/50 mt-1 cursor-pointer focus:outline-none"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        {t.shareModal.viewersCanDownloadLabel}
                      </span>
                      <span className="text-xs text-slate-550 dark:text-slate-400 font-semibold leading-relaxed mt-0.5">
                        {t.shareModal.viewersCanDownloadSub}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Settings Footer */}
                <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end shrink-0">
                  <Button
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-sm cursor-pointer border-none"
                  >
                    {t.common.back}
                  </Button>
                </div>
              </div>
            ) : (
              /* main view */
              <>
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-2 shrink-0 text-left">
                  <h2 id="share-modal-title" className="text-xl font-bold tracking-tight truncate pr-4 text-slate-900 dark:text-slate-100">
                    {t.shareModal.title} "{activeFileName}"
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSettingsViewOpen(true)}
                      className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus:outline-none"
                      title={t.shareModal.settingsTitle}
                      aria-label={t.shareModal.settingsTitle}
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus:outline-none"
                      title={t.common.close}
                      aria-label={t.common.close}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {/* Invite Row */}
                <div className="py-2 shrink-0">
                  <form onSubmit={handleAddCollaborator} className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
                      <input
                        type="text"
                        placeholder={t.shareModal.placeholderEmail}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-12 pr-4 h-[52px] bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-full text-sm font-medium placeholder-slate-400 text-slate-900 transition-all focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-blue-500"
                      />
                    </div>

                    <div className="relative shrink-0">
                      <PermissionDropdown
                        value={newRole}
                        onChange={setNewRole}
                        align="right"
                        className="h-[52px] w-[140px] text-sm rounded-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white"
                        ariaLabel={t.shareModal.inviteRoleLabel}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newEmail.trim()}
                      className="w-[52px] h-[52px] bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-600 rounded-full flex items-center justify-center shadow-xs transition-all cursor-pointer border border-slate-200 focus:outline-none dark:bg-slate-850 dark:hover:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      title={t.shareModal.inviteCollab}
                      aria-label={t.shareModal.inviteUserBtn}
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </form>
                </div>

                {/* Collaborators List */}
                <div className="py-4 flex-1 overflow-y-auto space-y-4 text-left scrollbar-thin max-h-[220px] pr-2">
                  <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 select-none">
                    {t.shareModal.peopleAccessLabel}
                  </h3>

                  <div className="space-y-3">
                    {activeCollaborators.map((c) => {
                      const initials = c.name ? c.name.charAt(0).toUpperCase() : 'A'
                      const isOwner = c.role === 'owner'
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-3 py-1">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 select-none text-white",
                              c.avatarBg || "bg-blue-600"
                            )}>
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 leading-normal truncate">
                                {c.name}
                                {isOwner && (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider select-none">
                                    {t.shareModal.ownerLabel}
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                {c.email}
                              </p>
                            </div>
                          </div>

                          {isOwner ? (
                            <span className="text-xs font-semibold text-slate-550 dark:text-slate-500 select-none mr-2">
                              {t.shareModal.roleOwner}
                            </span>
                          ) : (
                            <div className="shrink-0">
                              <PermissionDropdown
                                value={c.role as ShareRole}
                                onChange={(role) => handleChangeRole(c.id, c.name, role)}
                                showRemove={true}
                                onRemove={() => handleRemoveCollaborator(c.id, c.name)}
                                align="right"
                                className="h-[36px] px-3 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                                ariaLabel={t.shareModal.changePermissionFor(c.name)}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-800/80 my-2 shrink-0" />

                {/* General Access Selector */}
                <div className="py-2 shrink-0">
                  <GeneralAccessSelector
                    value={activeGeneralAccess}
                    onChange={updateGeneralAccess}
                    publicRole={publicRole}
                    onPublicRoleChange={setPublicRole}
                    showToast={(msg) => triggerToast(msg)}
                  />
                </div>

                {/* Footer Section */}
                <div className="mt-4 pt-4 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-sm px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer bg-white dark:bg-slate-800 focus:outline-none"
                    aria-label={t.shareModal.copyLink}
                  >
                    <Link className="h-4 w-4" />
                    <span>{t.shareModal.copyLink}</span>
                  </button>

                  <Button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-sm cursor-pointer border-none"
                  >
                    {t.shareModal.done || t.common.done}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
export default ShareAccessModal

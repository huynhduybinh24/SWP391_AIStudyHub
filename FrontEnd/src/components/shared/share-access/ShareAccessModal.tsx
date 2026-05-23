import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserPlus, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { PermissionDropdown, type ShareRole } from './PermissionDropdown'
import { GeneralAccessSelector } from './GeneralAccessSelector'

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
  fileName: string
  collaborators?: Collaborator[]
  onCollaboratorsChange?: (collaborators: Collaborator[]) => void
  generalAccess?: 'restricted' | 'public'
  onGeneralAccessChange?: (type: 'restricted' | 'public') => void
  showToast?: (msg: string) => void // optional callback
  initialCollaborators?: Collaborator[] // backward compatibility
  onShareSubmit?: (email: string, permission: 'Viewer' | 'Editor') => void // backward compatibility
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
  fileId = 'default-file',
  fileName,
  collaborators,
  onCollaboratorsChange,
  generalAccess,
  onGeneralAccessChange,
  showToast: customShowToast,
  initialCollaborators,
  onShareSubmit
}: ShareAccessModalProps) {
  const toast = useToast()

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
      triggerToast('❌ Vui lòng nhập địa chỉ email hợp lệ!', 'error')
      return
    }

    if (activeCollaborators.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      triggerToast('⚠️ Email này đã có quyền truy cập!', 'warning')
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
      triggerToast('Access shared successfully')
    }
  }

  const handleRemoveCollaborator = (id: string, name: string) => {
    const updated = activeCollaborators.filter(c => c.id !== id)
    updateCollaborators(updated)
    triggerToast('Access removed')
  }

  const handleChangeRole = (id: string, name: string, role: ShareRole) => {
    const updated = activeCollaborators.map(c => c.id === id ? { ...c, role } : c)
    updateCollaborators(updated)
    triggerToast('Permission updated')
  }

  const handleCopyLink = () => {
    const link = `https://aistudyhub.app/shared/${fileId}`
    navigator.clipboard.writeText(link)
    triggerToast('Link copied to clipboard')
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
            className="absolute inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="bg-slate-900 text-white rounded-[32px] shadow-2xl border border-slate-700 w-full max-w-[760px] overflow-visible z-10 font-sans flex flex-col relative max-h-[90vh] p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {isSettingsViewOpen ? (
              /* sharing settings view */
              <div className="flex flex-col h-full animate-fade-in text-left">
                {/* Settings Header */}
                <div className="flex items-center gap-3 pb-6 border-b border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                    title="Back"
                    aria-label="Back to share settings"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-xl font-bold tracking-tight">
                    Cài đặt chia sẻ
                  </h2>
                </div>

                {/* Settings Options */}
                <div className="py-8 flex-1 space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editorsCanShare}
                      onChange={(e) => {
                        setEditorsCanShare(e.target.checked)
                        triggerToast(e.target.checked ? '✅ Người chỉnh sửa hiện có thể thay đổi quyền và chia sẻ.' : '🔒 Người chỉnh sửa không thể thay đổi quyền chia sẻ.')
                      }}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50 mt-1 cursor-pointer focus:outline-none"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200 leading-normal">
                        Người chỉnh sửa có thể thay đổi quyền và chia sẻ
                      </span>
                      <span className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Nếu tắt, chỉ chủ sở hữu tài liệu mới có quyền thay đổi cài đặt chia sẻ
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={viewersCanDownload}
                      onChange={(e) => {
                        setViewersCanDownload(e.target.checked)
                        triggerToast(e.target.checked ? '✅ Người xem/nhận xét có thể tải xuống, in và sao chép.' : '🔒 Đã khóa tính năng tải xuống, in và sao chép.')
                      }}
                      className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50 mt-1 cursor-pointer focus:outline-none"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-200 leading-normal">
                        Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép
                      </span>
                      <span className="text-xs text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Nếu tắt, các nút tải xuống và in ấn sẽ bị khóa với Người xem
                      </span>
                    </div>
                  </label>
                </div>

                {/* Settings Footer */}
                <div className="pt-6 border-t border-slate-800 flex justify-end shrink-0">
                  <Button
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md cursor-pointer border-none"
                  >
                    Quay lại
                  </Button>
                </div>
              </div>
            ) : (
              /* main view */
              <>
                {/* Modal Header */}
                <div className="flex justify-between items-center pb-4 shrink-0 text-left">
                  <h2 id="share-modal-title" className="text-2xl font-bold tracking-tight truncate max-w-[580px]">
                    Chia sẻ "{fileName}"
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSettingsViewOpen(true)}
                      className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                      title="Cài đặt chia sẻ"
                      aria-label="Cài đặt chia sẻ"
                    >
                      <Settings className="h-5.5 w-5.5" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                      title="Đóng"
                      aria-label="Close dialog"
                    >
                      <X className="h-5.5 w-5.5" />
                    </button>
                  </div>
                </div>

                {/* Invite Row */}
                <div className="py-4 shrink-0">
                  <form onSubmit={handleAddCollaborator} className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Thêm người hoặc địa chỉ email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 focus:border-blue-500 focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-semibold placeholder-slate-400 text-slate-100 transition-all focus:outline-none"
                      />
                    </div>

                    <div className="relative shrink-0">
                      <PermissionDropdown
                        value={newRole}
                        onChange={setNewRole}
                        align="right"
                        ariaLabel="Select invite role"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!newEmail.trim()}
                      className="w-[48px] h-[48px] bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer border-none focus:outline-none"
                      title="Mời cộng tác viên"
                      aria-label="Invite user button"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                  </form>
                </div>

                <div className="border-t border-slate-800 my-2 shrink-0" />

                {/* Collaborators List */}
                <div className="py-4 flex-1 overflow-y-auto space-y-4 text-left scrollbar-thin max-h-[220px] pr-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 select-none">
                    NGƯỜI CÓ QUYỀN TRUY CẬP
                  </h3>

                  <div className="space-y-3.5">
                    {activeCollaborators.map((c) => {
                      const initials = c.name ? c.name.charAt(0).toUpperCase() : 'A'
                      const isOwner = c.role === 'owner'
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-3 py-1">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className={cn(
                              "w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 select-none text-white",
                              c.avatarBg || "bg-blue-600"
                            )}>
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 leading-normal truncate">
                                {c.name}
                                {isOwner && (
                                  <span className="bg-slate-800 text-slate-400 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border border-slate-700 select-none">
                                    Chủ sở hữu
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                                {c.email}
                              </p>
                            </div>
                          </div>

                          {isOwner ? (
                            <span className="text-xs font-bold text-slate-500 select-none mr-3">
                              Chủ sở hữu
                            </span>
                          ) : (
                            <div className="shrink-0">
                              <PermissionDropdown
                                value={c.role as ShareRole}
                                onChange={(role) => handleChangeRole(c.id, c.name, role)}
                                showRemove={true}
                                onRemove={() => handleRemoveCollaborator(c.id, c.name)}
                                align="right"
                                ariaLabel={`Change permission for ${c.name}`}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-800 my-2 shrink-0" />

                {/* General Access Selector */}
                <div className="py-4 shrink-0">
                  <GeneralAccessSelector
                    value={activeGeneralAccess}
                    onChange={updateGeneralAccess}
                    publicRole={publicRole}
                    onPublicRoleChange={setPublicRole}
                    showToast={(msg) => triggerToast(msg)}
                  />
                </div>

                {/* Footer Section */}
                <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-extrabold text-xs px-4 py-2.5 rounded-full hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent focus:outline-none"
                    aria-label="Sao chép đường liên kết"
                  >
                    <span>Sao chép đường liên kết</span>
                  </button>

                  <Button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-full shadow-md cursor-pointer border-none"
                  >
                    Xong
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

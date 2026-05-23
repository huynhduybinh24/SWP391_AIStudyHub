import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, UserPlus, Check, ChevronDown, Lock, Globe, ArrowLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

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
  fileName: string
  onShareSubmit?: (email: string, permission: 'Viewer' | 'Editor') => void
  initialCollaborators?: Collaborator[]
  showToast: (msg: string) => void
}

export function ShareAccessModal({
  isOpen,
  onClose,
  fileName,
  onShareSubmit,
  initialCollaborators = [
    {
      id: 'owner-1',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      role: 'owner',
      avatarBg: 'bg-[#0fbf7c] text-white font-bold'
    },
    {
      id: 'collab-1',
      name: 'Huynh Duy Binh',
      email: 'binh@example.com',
      role: 'editor',
      avatarBg: 'bg-[#5f6ffc] text-white font-bold'
    },
    {
      id: 'collab-2',
      name: 'Ngoc Tan',
      email: 'tan@example.com',
      role: 'viewer',
      avatarBg: 'bg-[#fc9d1c] text-white font-bold'
    }
  ],
  showToast
}: ShareAccessModalProps) {
  // Advanced share states
  const [isSettingsViewOpen, setIsSettingsViewOpen] = useState(false)
  const [editorsCanShare, setEditorsCanShare] = useState(true)
  const [viewersCanDownload, setViewersCanDownload] = useState(true)
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initialCollaborators)
  
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  const [generalAccess, setGeneralAccess] = useState<'restricted' | 'public'>('restricted')
  const [publicRole, setPublicRole] = useState<'editor' | 'commenter' | 'viewer'>('viewer')
  
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [isGeneralDropdownOpen, setIsGeneralDropdownOpen] = useState(false)
  const [isPublicRoleDropdownOpen, setIsPublicRoleDropdownOpen] = useState(false)
  const [isNewRoleDropdownOpen, setIsNewRoleDropdownOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Reset modal view states when opened
  useEffect(() => {
    if (isOpen) {
      setIsSettingsViewOpen(false)
      setNewEmail('')
      setNewRole('viewer')
      setCollaborators(initialCollaborators)
    }
  }, [isOpen, initialCollaborators])

  // Escape key handler to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Click outside to close custom role dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null)
        setIsGeneralDropdownOpen(false)
        setIsPublicRoleDropdownOpen(false)
        setIsNewRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail.trim())) {
      showToast('❌ Vui lòng nhập địa chỉ email hợp lệ!')
      return
    }

    if (collaborators.some(c => c.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      showToast('⚠️ Email này đã có quyền truy cập!')
      return
    }

    const newCollabName = newEmail.split('@')[0]
    const formattedName = newCollabName.charAt(0).toUpperCase() + newCollabName.slice(1)

    const colors = [
      'bg-[#5f6ffc] text-white font-bold',
      'bg-[#fc9d1c] text-white font-bold',
      'bg-[#ec4899] text-white font-bold',
      'bg-[#8b5cf6] text-white font-bold',
      'bg-[#0fbf7c] text-white font-bold',
      'bg-rose-500 text-white font-bold'
    ]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    const newCollab: Collaborator = {
      id: `collab-${Date.now()}`,
      name: formattedName,
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      avatarBg: randomColor
    }

    setCollaborators(prev => [...prev, newCollab])
    setNewEmail('')
    setIsNewRoleDropdownOpen(false)

    // Fire callback if provided
    if (onShareSubmit) {
      onShareSubmit(
        newCollab.email,
        newRole === 'editor' ? 'Editor' : 'Viewer'
      )
    } else {
      showToast('Access shared successfully')
    }
  }

  const handleRemoveCollaborator = (id: string, name: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id))
    showToast(`🗑️ Đã xóa quyền truy cập của ${name}`)
    setActiveDropdownId(null)
  }

  const handleChangeRole = (id: string, name: string, role: 'editor' | 'commenter' | 'viewer') => {
    setCollaborators(prev => prev.map(c => c.id === id ? { ...c, role } : c))
    showToast(`✏️ Đã cập nhật quyền của ${name} thành ${role === 'editor' ? 'Người chỉnh sửa' : role === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
    setActiveDropdownId(null)
  }

  const handleGeneralAccessChange = (type: 'restricted' | 'public') => {
    setGeneralAccess(type)
    setIsGeneralDropdownOpen(false)
    if (type === 'restricted') {
      showToast('🔒 Đã hạn chế quyền truy cập liên kết.')
    } else {
      showToast('🌐 Bất kỳ ai có đường liên kết này đều có thể truy cập.')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('🔗 Đã sao chép đường liên kết tài liệu vào bộ nhớ tạm!')
  }

  const canCurrentUserAccessSettings = () => {
    // Current user is Ngoc Tan in files, mock check
    return true
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Body */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-visible z-10 font-sans flex flex-col relative max-h-[90vh]"
            ref={dropdownRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {isSettingsViewOpen ? (
              /* Advanced Settings View */
              <div className="flex flex-col h-full animate-fade-in text-left">
                {/* Settings Header */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                    title="Back"
                    aria-label="Back to share settings"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Cài đặt chia sẻ
                  </h2>
                </div>

                {/* Settings Options */}
                <div className="px-6 py-6 flex-1 space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editorsCanShare}
                      onChange={(e) => {
                        setEditorsCanShare(e.target.checked)
                        showToast(e.target.checked ? '✅ Người chỉnh sửa hiện có thể thay đổi quyền và chia sẻ.' : '🔒 Người chỉnh sửa không thể thay đổi quyền chia sẻ.')
                      }}
                      className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-750 text-blue-650 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        Người chỉnh sửa có thể thay đổi quyền và chia sẻ
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-0.5">
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
                        showToast(e.target.checked ? '✅ Người xem/nhận xét có thể tải xuống, in và sao chép.' : '🔒 Đã khóa tính năng tải xuống, in và sao chép.')
                      }}
                      className="w-4.5 h-4.5 rounded border-slate-350 dark:border-slate-750 text-blue-650 focus:ring-blue-500 mt-1 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal">
                        Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed mt-0.5">
                        Nếu tắt, các nút tải xuống và in ấn sẽ bị khóa với Người xem
                      </span>
                    </div>
                  </label>
                </div>

                {/* Settings Footer */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 rounded-b-[28px]">
                  <Button
                    onClick={() => setIsSettingsViewOpen(false)}
                    className="bg-blue-650 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md cursor-pointer"
                  >
                    Quay lại
                  </Button>
                </div>
              </div>
            ) : (
              /* Main Share Modal View */
              <>
                {/* Modal Header */}
                <div className="flex justify-between items-center px-6 pt-6 pb-2 shrink-0 select-none text-left">
                  <h2 id="share-modal-title" className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-normal truncate max-w-[340px]">
                    Chia sẻ "{fileName}"
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (canCurrentUserAccessSettings()) {
                          setIsSettingsViewOpen(true)
                        } else {
                          showToast('🔒 Chỉ chủ sở hữu mới có quyền truy cập cài đặt!')
                        }
                      }}
                      className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer animate-fade-in"
                      title="Cài đặt chia sẻ"
                      aria-label="Cài đặt chia sẻ"
                    >
                      <Settings className="h-5 w-5 text-slate-400" />
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
                      title="Đóng"
                      aria-label="Close dialog"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Invite Row */}
                <div className="px-6 py-4 shrink-0">
                  <form onSubmit={handleAddCollaborator} className="flex gap-2.5 items-center">
                    <div className="relative flex-1">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Thêm người hoặc địa chỉ email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 rounded-2xl text-xs font-semibold placeholder-slate-400 dark:placeholder-slate-500 text-slate-800 dark:text-slate-100 transition-all focus:outline-none"
                      />
                    </div>

                    {/* Role selector dropdown */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsNewRoleDropdownOpen(!isNewRoleDropdownOpen)}
                        className="h-[46px] flex items-center gap-1.5 px-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-2xl text-xs font-extrabold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all select-none shadow-xs cursor-pointer"
                      >
                        <span>
                          {newRole === 'editor' ? 'Người chỉnh sửa' : newRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </button>

                      {isNewRoleDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsNewRoleDropdownOpen(false)} />
                          <div className="absolute right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-44 animate-fade-in text-left">
                            {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => {
                                  setNewRole(r)
                                  setIsNewRoleDropdownOpen(false)
                                }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-55 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                  newRole === r ? "text-blue-600 bg-blue-50/40 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                                )}
                              >
                                <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                {newRole === r && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Circular Add button */}
                    <button
                      type="submit"
                      disabled={!newEmail.trim()}
                      className="w-[46px] h-[46px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-655 dark:text-slate-300 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                      title="Mời cộng tác viên"
                    >
                      <UserPlus className="h-4.5 w-4.5" />
                    </button>
                  </form>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1 mx-6 shrink-0" />

                {/* Collaborators Section */}
                <div className="px-6 py-3 flex-1 overflow-y-auto space-y-4 text-left scrollbar-thin">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none mb-1">
                    Người có quyền truy cập
                  </h3>
                  
                  <div className="space-y-4">
                    {collaborators.map((c) => {
                      const initials = c.name ? c.name.charAt(0).toUpperCase() : 'A'
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-3 py-1">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Initials avatar */}
                            <div className={cn("w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-sm shadow-inner shrink-0 select-none text-white", c.avatarBg || "bg-blue-600")}>
                              {initials}
                            </div>
                            
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 leading-normal truncate">
                                {c.name} 
                                {c.role === 'owner' && (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border border-slate-200/50 dark:border-slate-700">
                                    Chủ sở hữu
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">
                                {c.email}
                              </p>
                            </div>
                          </div>

                          {/* Dropdown for role */}
                          {c.role !== 'owner' ? (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveDropdownId(activeDropdownId === c.id ? null : c.id)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none shadow-xs cursor-pointer"
                              >
                                <span>
                                  {c.role === 'editor' ? 'Người chỉnh sửa' : c.role === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              </button>

                              {activeDropdownId === c.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdownId(null)} />
                                  <div className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-44 animate-fade-in text-left">
                                    {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                      <button
                                        key={r}
                                        type="button"
                                        onClick={() => handleChangeRole(c.id, c.name, r)}
                                        className={cn(
                                          "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                          c.role === r ? "text-blue-600 bg-blue-50/40 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                                        )}
                                      >
                                        <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                        {c.role === r && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                      </button>
                                    ))}
                                    
                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                    
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCollaborator(c.id, c.name)}
                                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-650 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                                    >
                                      Xóa quyền truy cập
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 select-none mr-3">
                              Chủ sở hữu
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* General Access Configuration */}
                <div className="px-6 py-4 space-y-3.5 shrink-0 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none text-left">
                    Quyền truy cập chung
                  </h3>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0 text-left">
                      {/* Access Badge */}
                      <div className={cn(
                        "w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0 border select-none transition-all duration-300 shadow-inner",
                        generalAccess === 'public'
                          ? "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/30 dark:border-blue-900/50 dark:text-blue-400"
                          : "bg-slate-50 border-slate-200/60 text-slate-500 dark:bg-slate-850 dark:border-slate-800 dark:text-slate-450"
                      )}>
                        {generalAccess === 'public' ? <Globe className="h-4.5 w-4.5" /> : <Lock className="h-4.5 w-4.5" />}
                      </div>

                      <div className="min-w-0 flex flex-col">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={() => setIsGeneralDropdownOpen(!isGeneralDropdownOpen)}
                            className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg select-none text-left cursor-pointer"
                          >
                            <span>
                              {generalAccess === 'public' ? 'Bất kỳ ai có đường liên kết' : 'Bị hạn chế'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-550" />
                          </button>

                          {isGeneralDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setIsGeneralDropdownOpen(false)} />
                              <div className="absolute left-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-56 animate-fade-in text-left">
                                <button
                                  type="button"
                                  onClick={() => handleGeneralAccessChange('restricted')}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                    generalAccess === 'restricted' ? "text-blue-600 bg-blue-50/40 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  <span className="flex items-center gap-2">
                                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>Bị hạn chế</span>
                                  </span>
                                  {generalAccess === 'restricted' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleGeneralAccessChange('public')}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                    generalAccess === 'public' ? "text-blue-600 bg-blue-50/40 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  <span className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                                    <span>Bất kỳ ai có đường liên kết</span>
                                  </span>
                                  {generalAccess === 'public' && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium pl-1.5 mt-0.5 leading-relaxed select-none">
                          {generalAccess === 'public'
                            ? 'Bất kỳ ai trên Internet có đường liên kết này đều có thể truy cập'
                            : 'Chỉ những người được thêm mới có thể mở bằng đường liên kết'}
                        </p>
                      </div>
                    </div>

                    {/* Public role selector */}
                    {generalAccess === 'public' && (
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsPublicRoleDropdownOpen(!isPublicRoleDropdownOpen)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors select-none shadow-xs cursor-pointer"
                        >
                          <span>
                            {publicRole === 'editor' ? 'Người chỉnh sửa' : publicRole === 'commenter' ? 'Người nhận xét' : 'Người xem'}
                          </span>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </button>

                        {isPublicRoleDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsPublicRoleDropdownOpen(false)} />
                            <div className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 w-40 animate-fade-in text-left">
                              {(['viewer', 'commenter', 'editor'] as const).map((r) => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => {
                                    setPublicRole(r)
                                    setIsPublicRoleDropdownOpen(false)
                                    showToast(`✏️ Đã cập nhật quyền liên kết công khai thành ${r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}`)
                                  }}
                                  className={cn(
                                    "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                                    publicRole === r ? "text-blue-600 bg-blue-50/40 dark:bg-blue-950/20" : "text-slate-700 dark:text-slate-300"
                                  )}
                                >
                                  <span>{r === 'editor' ? 'Người chỉnh sửa' : r === 'commenter' ? 'Người nhận xét' : 'Người xem'}</span>
                                  {publicRole === r && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Modal Footer */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 select-none rounded-b-[28px]">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-750 dark:hover:text-blue-300 font-extrabold text-xs px-4 py-2.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                  >
                    <span>Sao chép đường liên kết</span>
                  </button>
                  <Button
                    onClick={onClose}
                    className="bg-blue-650 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-full shadow-md cursor-pointer"
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

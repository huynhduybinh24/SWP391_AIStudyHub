import { useState, useEffect, useRef } from 'react'
import {
  X,
  Settings,
  Mail,
  UserPlus,
  Copy,
  Lock,
  ChevronDown,
  Check,
  Globe,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ShareModalUser {
  id: string
  name: string
  email: string
  permission: 'Chủ sở hữu' | 'Người xem' | 'Người nhận xét' | 'Người chỉnh sửa'
  avatarBg?: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  fileName?: string
  ownerName?: string
  ownerEmail?: string
  initialUsers?: ShareModalUser[]
  shareUrl?: string
  onShare?: (user: ShareModalUser) => void
  onPermissionChange?: (userId: string, newPermission: string) => void
}

export function ShareModal({
  isOpen,
  onClose,
  title,
  fileName,
  ownerName,
  ownerEmail,
  initialUsers = [],
  shareUrl = '',
  onShare,
  onPermissionChange,
}: ShareModalProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePermission, setInvitePermission] = useState<'Người xem' | 'Người nhận xét' | 'Người chỉnh sửa'>('Người xem')
  const [sharedUsers, setSharedUsers] = useState<ShareModalUser[]>([])
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [editorsCanShare, setEditorsCanShare] = useState(true)
  const [viewersCanDownload, setViewersCanDownload] = useState(true)

  const inviteDropdownRef = useRef<HTMLDivElement>(null)

  // Avoid TS unused warnings for required props
  void ownerName
  void ownerEmail

  // Initialize users on open
  useEffect(() => {
    if (isOpen) {
      setSharedUsers(initialUsers)
      setInviteEmail('')
      setErrorMessage('')
      setSuccessMessage('')
      setOpenDropdownId(null)
      setShowSettings(false)
    }
  }, [isOpen, initialUsers])

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (openDropdownId) {
        if (openDropdownId === 'invite' && inviteDropdownRef.current && !inviteDropdownRef.current.contains(target)) {
          setOpenDropdownId(null)
        } else if (openDropdownId === 'general') {
          const container = document.getElementById('general-dropdown-container')
          const trigger = document.getElementById('general-dropdown-trigger')
          if (container && !container.contains(target) && trigger && !trigger.contains(target)) {
            setOpenDropdownId(null)
          }
        } else {
          // If clicking outside the active user's dropdown container
          const container = document.getElementById(`dropdown-container-${openDropdownId}`)
          const trigger = document.getElementById(`dropdown-trigger-${openDropdownId}`)
          if (container && !container.contains(target) && trigger && !trigger.contains(target)) {
            setOpenDropdownId(null)
          }
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdownId])

  // Escape key support to close dropdowns or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openDropdownId) {
          setOpenDropdownId(null)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [openDropdownId, onClose])

  if (!isOpen) return null


  const handleAddUser = () => {
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedEmail = inviteEmail.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMessage('Vui lòng nhập email hợp lệ.')
      return
    }

    // Check if user already exists
    if (sharedUsers.some(u => u.email.toLowerCase() === trimmedEmail.toLowerCase())) {
      setErrorMessage('Người dùng này đã có quyền truy cập.')
      return
    }

    // Extract name from email as fallback
    const extractedName = trimmedEmail.split('@')[0]
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1)

    // Generate random avatar bg based on initial letter
    let randomBg = 'bg-blue-500'
    const firstLetter = formattedName.charAt(0).toUpperCase()
    if (firstLetter === 'A') randomBg = 'bg-[#0F9D58]' // Green
    else if (firstLetter === 'H' || firstLetter === 'S') randomBg = 'bg-[#673AB7]' // Purple
    else if (firstLetter === 'N' || firstLetter === 'M') randomBg = 'bg-[#FF9800]' // Orange

    const newUser: ShareModalUser = {
      id: trimmedEmail.toLowerCase(),
      name: formattedName,
      email: trimmedEmail,
      permission: invitePermission,
      avatarBg: randomBg,
    }

    const updated = [...sharedUsers, newUser]
    setSharedUsers(updated)
    setInviteEmail('')
    setSuccessMessage('Đã thêm người dùng thành công.')
    if (onShare) onShare(newUser)

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const handleUpdateUserPermission = (userId: string, newPerm: 'Người xem' | 'Người nhận xét' | 'Người chỉnh sửa' | 'Xóa') => {
    if (newPerm === 'Xóa') {
      const updated = sharedUsers.filter(u => u.id !== userId)
      setSharedUsers(updated)
      if (onPermissionChange) onPermissionChange(userId, 'Xóa')
    } else {
      const updated = sharedUsers.map(u => u.id === userId ? { ...u, permission: newPerm as any } : u)
      setSharedUsers(updated)
      if (onPermissionChange) onPermissionChange(userId, newPerm)
    }
    setOpenDropdownId(null)
  }

  const handleCopyLink = () => {
    setErrorMessage('')
    setSuccessMessage('')
    
    const finalUrl = shareUrl || window.location.href
    
    navigator.clipboard.writeText(finalUrl)
      .then(() => {
        setSuccessMessage('Đã sao chép đường liên kết.')
        setTimeout(() => setSuccessMessage(''), 3000)
      })
      .catch(() => {
        const textArea = document.createElement('textarea')
        textArea.value = finalUrl
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          setSuccessMessage('Đã sao chép đường liên kết.')
          setTimeout(() => setSuccessMessage(''), 3000)
        } catch (err) {
          setErrorMessage('Không thể sao chép liên kết.')
        }
        document.body.removeChild(textArea)
      })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddUser()
    }
  }

  // Helper to render user avatars
  const renderAvatar = (user: ShareModalUser) => {
    const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'U'
    let colorClass = user.avatarBg
    if (!colorClass) {
      if (firstLetter === 'A') colorClass = 'bg-[#0F9D58]'
      else if (firstLetter === 'H' || firstLetter === 'S') colorClass = 'bg-[#673AB7]'
      else if (firstLetter === 'N' || firstLetter === 'M') colorClass = 'bg-[#FF9800]'
      else colorClass = 'bg-blue-500'
    }
    return (
      <div className={cn("w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-sm shrink-0", colorClass)}>
        {firstLetter}
      </div>
    )
  }

  const displayTitle = title || (fileName ? `Chia sẻ "${fileName}"` : 'Share Access')

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl p-[32px] w-full max-w-[660px] relative z-10 overflow-visible animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100">
        {showSettings ? (
          <>
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="text-[#737686] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-100 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label="Back to main share menu"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl md:text-2xl font-bold text-[#0b1c30] dark:text-slate-100">
                  Cài đặt chia sẻ
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[#737686] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-100 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Items */}
            <div className="space-y-6 mb-8 pt-2 text-left">
              {/* Setting 1: Editors can change permissions and share */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label htmlFor="editors-can-share-checkbox" className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 block cursor-pointer select-none">
                    Người chỉnh sửa có thể thay đổi các quyền và chia sẻ
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 leading-normal">
                    Nếu tắt, chỉ chủ sở hữu mới có thể thay đổi cài đặt bảo mật và thêm người dùng mới.
                  </span>
                </div>
                <div className="relative shrink-0 flex items-center h-6">
                  <input
                    id="editors-can-share-checkbox"
                    type="checkbox"
                    checked={editorsCanShare}
                    onChange={(e) => {
                      setEditorsCanShare(e.target.checked)
                      setSuccessMessage('Đã cập nhật cài đặt chia sẻ.')
                      setTimeout(() => setSuccessMessage(''), 2000)
                    }}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-[#3155F6] focus:ring-[#3155F6] dark:bg-slate-950 cursor-pointer"
                  />
                </div>
              </div>

              {/* Setting 2: Viewers can see download, print, copy option */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label htmlFor="viewers-can-download-checkbox" className="text-sm font-bold text-[#0b1c30] dark:text-slate-200 block cursor-pointer select-none">
                    Người xem và người nhận xét có thể thấy tùy chọn tải xuống, in và sao chép
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1 leading-normal">
                    Nếu tắt, những người có quyền xem/nhận xét sẽ không thể sao chép văn bản, tải hoặc in tài liệu này.
                  </span>
                </div>
                <div className="relative shrink-0 flex items-center h-6">
                  <input
                    id="viewers-can-download-checkbox"
                    type="checkbox"
                    checked={viewersCanDownload}
                    onChange={(e) => {
                      setViewersCanDownload(e.target.checked)
                      setSuccessMessage('Đã cập nhật cài đặt chia sẻ.')
                      setTimeout(() => setSuccessMessage(''), 2000)
                    }}
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-[#3155F6] focus:ring-[#3155F6] dark:bg-slate-950 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Success message inline feedback */}
            {successMessage && (
              <div className="text-emerald-600 text-xs font-semibold mb-6 ml-2 animate-in fade-in duration-150">
                {successMessage}
              </div>
            )}

            {/* Settings Footer */}
            <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
              >
                Xong
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#0b1c30] dark:text-slate-100 truncate pr-4">
                {displayTitle}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="text-[#737686] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-100 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer animate-press"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#737686] dark:text-slate-400 hover:text-[#0b1c30] dark:hover:text-slate-100 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Input Invite Row */}
            <div className="flex items-center gap-2 mb-4 relative z-50">
              <div className="relative flex-1">
                <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Thêm người, nhóm hoặc địa chỉ email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:border-slate-300 focus:border-[#3155F6] rounded-[20px] text-sm text-[#0b1c30] dark:text-slate-100 placeholder-slate-400 dark:placeholder:text-slate-500 transition-colors focus:ring-1 focus:ring-[#3155F6] focus:outline-none"
                />
              </div>

              {/* Invite Permission Custom Dropdown */}
              <div className="relative shrink-0" ref={inviteDropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpenDropdownId(openDropdownId === 'invite' ? null : 'invite')}
                  className="inline-flex items-center justify-between gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[#434655] dark:text-slate-300 px-4 py-3 rounded-[20px] text-sm font-semibold transition-all cursor-pointer min-w-[130px]"
                >
                  <span>{invitePermission}</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                {openDropdownId === 'invite' && (
                  <div className="absolute right-0 mt-2 w-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-xl py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150">
                    {(['Người xem', 'Người nhận xét', 'Người chỉnh sửa'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setInvitePermission(role)
                          setOpenDropdownId(null)
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-semibold",
                          invitePermission === role
                            ? "bg-[#E8EEFF]/60 text-[#3155F6] dark:bg-blue-950/40 dark:text-blue-400"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        )}
                      >
                        <span>{role}</span>
                        {invitePermission === role && <Check className="w-4 h-4 text-[#3155F6]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Invite Action Button */}
              <button
                type="button"
                onClick={handleAddUser}
                className="flex items-center justify-center bg-[#E8EEFF] dark:bg-slate-800 hover:bg-[#D4E5FF] dark:hover:bg-slate-700 text-[#3155F6] dark:text-blue-400 p-3 rounded-full transition-all cursor-pointer shrink-0"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Success Messages */}
            {errorMessage && (
              <div className="text-red-500 text-xs font-semibold mb-4 ml-2 animate-in fade-in duration-150">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="text-emerald-600 text-xs font-semibold mb-4 ml-2 animate-in fade-in duration-150">
                {successMessage}
              </div>
            )}

            {/* Section 1: Shared Users */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">
                Người có quyền truy cập
              </h3>
              <div className="space-y-4 pr-1">
                {sharedUsers.map((user) => {
                  const isOwner = user.permission === 'Chủ sở hữu'
                  return (
                    <div key={user.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {renderAvatar(user)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0b1c30] dark:text-slate-100">{user.name}</span>
                            {isOwner && (
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-wide uppercase shrink-0">
                                CHỦ SỞ HỮU
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-550 dark:text-slate-450 block truncate">{user.email}</span>
                        </div>
                      </div>

                      {/* Permission Dropdown/Label */}
                      <div className="shrink-0">
                        {isOwner ? (
                          <span className="text-sm text-slate-550 dark:text-slate-450 font-semibold pr-2">
                            Chủ sở hữu
                          </span>
                        ) : (
                          <div className="relative">
                            <button
                              type="button"
                              id={`dropdown-trigger-${user.id}`}
                              onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                              className="inline-flex items-center justify-between gap-1 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[#434655] dark:text-slate-350 px-3.5 py-2 rounded-[20px] text-sm font-semibold transition-all cursor-pointer min-w-[130px]"
                            >
                              <span>{user.permission}</span>
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            </button>

                            {openDropdownId === user.id && (
                              <div
                                id={`dropdown-container-${user.id}`}
                                className="absolute right-0 mt-2 w-[180px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-xl py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150"
                              >
                                {([
                                  { value: 'Người xem', label: 'Người xem' },
                                  { value: 'Người nhận xét', label: 'Người nhận xét' },
                                  { value: 'Người chỉnh sửa', label: 'Người chỉnh sửa' },
                                  { value: 'Xóa', label: 'Xóa quyền truy cập', isDanger: true },
                                ] as Array<{ value: 'Người xem' | 'Người nhận xét' | 'Người chỉnh sửa' | 'Xóa'; label: string; isDanger?: boolean }>).map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleUpdateUserPermission(user.id, opt.value)}
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-semibold",
                                      opt.isDanger
                                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                        : user.permission === opt.value
                                        ? "bg-[#E8EEFF]/60 text-[#3155F6] dark:bg-blue-950/40 dark:text-blue-400"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                    )}
                                  >
                                    <span>{opt.label}</span>
                                    {user.permission === opt.value && <Check className="w-4 h-4 text-[#3155F6]" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: General Access */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mb-8">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">
                Quyền truy cập chung
              </h3>
              <GeneralAccessControl openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-[#F4F7FE] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[#3155F6] dark:text-blue-400 px-5 py-3 rounded-full text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Sao chép đường liên kết</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-8 py-3 rounded-full text-sm font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
              >
                Xong
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* Sub-component for General Access to keep file organized */
interface GeneralAccessControlProps {
  openDropdownId: string | null
  setOpenDropdownId: (val: string | null) => void
}

function GeneralAccessControl({ openDropdownId, setOpenDropdownId }: GeneralAccessControlProps) {
  const [generalAccess, setGeneralAccess] = useState<'restricted' | 'anyone'>('restricted')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (openDropdownId === 'general') {
          setOpenDropdownId(null)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId, setOpenDropdownId])

  const isRestricted = generalAccess === 'restricted'

  return (
    <div className="flex items-start gap-4">
      {/* Icon Circle */}
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-400">
        {isRestricted ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5 text-emerald-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 relative z-40" ref={dropdownRef}>
          <button
            type="button"
            id="general-dropdown-trigger"
            onClick={() => setOpenDropdownId(openDropdownId === 'general' ? null : 'general')}
            className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isRestricted ? 'Bị hạn chế' : 'Bất kỳ ai có đường liên kết'}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {openDropdownId === 'general' && (
            <div
              id="general-dropdown-container"
              className="absolute left-2 top-full mt-1 w-[240px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[12px] shadow-xl py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {[
                { value: 'restricted', label: 'Bị hạn chế' },
                { value: 'anyone', label: 'Bất kỳ ai có đường liên kết' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setGeneralAccess(opt.value as 'restricted' | 'anyone')
                    setOpenDropdownId(null)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-semibold",
                    generalAccess === opt.value
                      ? "bg-[#E8EEFF]/60 text-[#3155F6] dark:bg-blue-950/40 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                  )}
                >
                  <span>{opt.label}</span>
                  {generalAccess === opt.value && <Check className="w-4 h-4 text-[#3155F6]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal font-normal">
          {isRestricted
            ? 'Chỉ những người được thêm mới có thể mở bằng đường liên kết này'
            : 'Bất kỳ ai trên Internet có đường liên kết đều có thể xem'}
        </p>
      </div>
    </div>
  )
}



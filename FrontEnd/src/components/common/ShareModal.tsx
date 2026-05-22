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
  Trash2,
  Globe,
  Link as LinkIcon,
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

  const inviteDropdownRef = useRef<HTMLDivElement>(null)

  // Initialize users on open
  useEffect(() => {
    if (isOpen) {
      setSharedUsers(initialUsers)
      setInviteEmail('')
      setErrorMessage('')
      setSuccessMessage('')
      setOpenDropdownId(null)
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
    if (newPerm === 'X') {
      const updated = sharedUsers.filter(u => u.id !== userId)
      setSharedUsers(updated)
      if (onPermissionChange) onPermissionChange(userId, 'Xóa')
    } else {
      const updated = sharedUsers.map(u => u.id === userId ? { ...u, permission: newPerm } : u)
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
      <div className="bg-white rounded-[32px] shadow-2xl p-[32px] w-full max-w-[660px] relative z-10 overflow-visible animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#0b1c30] truncate pr-4">
            {displayTitle}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[#737686] hover:text-[#0b1c30] p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-[#737686] hover:text-[#0b1c30] p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
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
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#3155F6] rounded-[20px] text-sm text-[#0b1c30] placeholder-slate-400 transition-colors focus:ring-1 focus:ring-[#3155F6] focus:outline-none"
            />
          </div>

          {/* Invite Permission Custom Dropdown */}
          <div className="relative shrink-0" ref={inviteDropdownRef}>
            <button
              type="button"
              onClick={() => setOpenDropdownId(openDropdownId === 'invite' ? null : 'invite')}
              className="inline-flex items-center justify-between gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#434655] px-4 py-3 rounded-[20px] text-sm font-semibold transition-all cursor-pointer min-w-[130px]"
            >
              <span>{invitePermission}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {openDropdownId === 'invite' && (
              <div className="absolute right-0 mt-2 w-[160px] bg-white border border-slate-100 rounded-[12px] shadow-lg py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150">
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
                        ? "bg-[#E8EEFF]/60 text-[#3155F6]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
            className="flex items-center justify-center bg-[#E8EEFF] hover:bg-[#D4E5FF] text-[#3155F6] p-3 rounded-full transition-all cursor-pointer shrink-0"
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
          <div className="space-y-4 max-h-[180px] overflow-y-auto pr-1">
            {sharedUsers.map((user) => {
              const isOwner = user.permission === 'Chủ sở hữu'
              return (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {renderAvatar(user)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0b1c30]">{user.name}</span>
                        {isOwner && (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-[4px] tracking-wide uppercase shrink-0">
                            CHỦ SỞ HỮU
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block truncate">{user.email}</span>
                    </div>
                  </div>

                  {/* Permission Dropdown/Label */}
                  <div className="shrink-0">
                    {isOwner ? (
                      <span className="text-sm text-slate-500 font-semibold pr-2">
                        Chủ sở hữu
                      </span>
                    ) : (
                      <div className="relative">
                        <button
                          type="button"
                          id={`dropdown-trigger-${user.id}`}
                          onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                          className="inline-flex items-center justify-between gap-1 bg-white hover:bg-slate-50 border border-slate-200 text-[#434655] px-3.5 py-2 rounded-[20px] text-sm font-semibold transition-all cursor-pointer min-w-[130px]"
                        >
                          <span>{user.permission}</span>
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>

                        {openDropdownId === user.id && (
                          <div
                            id={`dropdown-container-${user.id}`}
                            className="absolute right-0 mt-2 w-[180px] bg-white border border-slate-100 rounded-[12px] shadow-lg py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150"
                          >
                            {([
                              { value: 'Người xem', label: 'Người xem' },
                              { value: 'Người nhận xét', label: 'Người nhận xét' },
                              { value: 'Người chỉnh sửa', label: 'Người chỉnh sửa' },
                              { value: 'X', label: 'Xóa quyền truy cập', isDanger: true },
                            ] as const).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleUpdateUserPermission(user.id, opt.value)}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-semibold",
                                  opt.isDanger
                                    ? "text-red-500 hover:bg-red-50"
                                    : user.permission === opt.value
                                    ? "bg-[#E8EEFF]/60 text-[#3155F6]"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              )
            })}
          </div>
        </div>

        {/* Section 2: General Access */}
        <div className="border-t border-slate-100 pt-6 mb-8">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">
            Quyền truy cập chung
          </h3>
          <GeneralAccessControl openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#F4F7FE] border border-slate-200 text-[#3155F6] px-5 py-3 rounded-full text-sm font-bold transition-all shadow-sm cursor-pointer"
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
      if (openDropdownId === 'general' && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openDropdownId, setOpenDropdownId])

  const isRestricted = generalAccess === 'restricted'

  return (
    <div className="flex items-start gap-4">
      {/* Icon Circle */}
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
        {isRestricted ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5 text-emerald-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 relative z-40" ref={dropdownRef}>
          <button
            type="button"
            id="general-dropdown-trigger"
            onClick={() => setOpenDropdownId(openDropdownId === 'general' ? null : 'general')}
            className="inline-flex items-center gap-1 font-bold text-slate-800 text-sm hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <span>{isRestricted ? 'Bị hạn chế' : 'Bất kỳ ai có đường liên kết'}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {openDropdownId === 'general' && (
            <div
              id="general-dropdown-container"
              className="absolute left-2 top-full mt-1 w-[240px] bg-white border border-slate-100 rounded-[12px] shadow-lg py-1 z-[999] animate-in fade-in slide-in-from-top-1 duration-150"
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
                      ? "bg-[#E8EEFF]/60 text-[#3155F6]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span>{opt.label}</span>
                  {generalAccess === opt.value && <Check className="w-4 h-4 text-[#3155F6]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-slate-500 mt-1 leading-normal font-normal">
          {isRestricted
            ? 'Chỉ những người được thêm mới có thể mở bằng đường liên kết này'
            : 'Bất kỳ ai trên Internet có đường liên kết đều có thể xem'}
        </p>
      </div>
    </div>
  )
}


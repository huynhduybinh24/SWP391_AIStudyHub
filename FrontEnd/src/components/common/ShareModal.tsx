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
      if (openDropdownId === 'invite' && inviteDropdownRef.current && !inviteDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
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

    // Extract name from email as fallback
    const extractedName = trimmedEmail.split('@')[0]
    const formattedName = extractedName.charAt(0).toUpperCase() + extractedName.slice(1)

    // Generate random avatar bg
    const bgColors = ['bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-blue-500', 'bg-rose-500']
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)]

    const newUser: ShareModalUser = {
      id: trimmedEmail.toLowerCase(),
      name: formattedName,
      email: trimmedEmail,
      permission: invitePermission,
      avatarBg: randomBg,
    }

    setSharedUsers([...sharedUsers, newUser])
    setInviteEmail('')
    setSuccessMessage('Đã thêm người dùng thành công.')
    if (onShare) onShare(newUser)

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 3000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddUser()
    }
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

        {/* Content Placeholder */}
        <div className="min-h-[100px] flex items-center justify-center text-sm text-[#737686]">
          Danh sách người có quyền truy cập...
        </div>
      </div>
    </div>
  )
}


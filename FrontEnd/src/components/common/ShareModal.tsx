import { useState, useEffect } from 'react'
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
  if (!isOpen) return null

  // Display Title
  const displayTitle = title || (fileName ? `Chia sẻ "${fileName}"` : 'Share Access')

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="bg-white rounded-[28px] shadow-2xl p-[28px] w-full max-w-[620px] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-[#0b1c30] truncate pr-4">
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

        {/* Content placeholder for incremental building */}
        <div className="min-h-[100px] flex items-center justify-center text-sm text-[#737686]">
          Modal content loading...
        </div>
      </div>
    </div>
  )
}

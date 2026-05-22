import { motion } from 'framer-motion'
import { User, Settings, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { authService } from '@/features/auth/services/authService'
import { useToast } from '@/components/ui/Toast'

interface UserDropdownProps {
  onClose: () => void
  onLogoutClick?: () => void
}

export function UserDropdown({ onClose, onLogoutClick }: UserDropdownProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { profile } = useProfileStore()
  const toast = useToast()

  async function handleLogout() {
    try {
      await authService.logout()
    } catch (e) {
      console.error(e)
    }
    logout()
    toast.success('Logged out successfully')
    onClose()
    navigate('/')
  }

  const handleNavigate = (path: string) => {
    navigate(path)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="absolute right-0 top-[52px] w-64 rounded-xl border border-border/85 bg-white dark:bg-slate-900 dark:border-slate-800 py-2 shadow-xl z-50 select-none"
      role="menu"
    >
      <div className="border-b border-border/50 dark:border-slate-800/80 px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E8EEFF] dark:bg-slate-850 flex items-center justify-center border border-border/40 dark:border-slate-800 overflow-hidden">
          <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 object-cover rounded-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground dark:text-slate-200 truncate leading-snug">{profile.name}</p>
          <p className="text-xs text-muted dark:text-slate-500 truncate leading-snug">{user?.email ?? 'alex@example.com'}</p>
        </div>
      </div>
      
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body dark:text-slate-350 hover:bg-surface dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer font-medium"
        onClick={() => handleNavigate('/dashboard/profile')}
        role="menuitem"
      >
        <User className="size-4 text-muted dark:text-slate-500" />
        My Profile
      </button>
      
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-body dark:text-slate-350 hover:bg-surface dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer font-medium"
        onClick={() => handleNavigate('/dashboard/settings')}
        role="menuitem"
      >
        <Settings className="size-4 text-muted dark:text-slate-500" />
        Settings
      </button>
      
      <div className="mt-1 border-t border-border/50 dark:border-slate-800/80 pt-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors text-left font-semibold cursor-pointer"
          onClick={onLogoutClick || handleLogout}
          role="menuitem"
        >
          <LogOut className="size-4 text-danger" />
          Log Out
        </button>
      </div>
    </motion.div>
  )
}

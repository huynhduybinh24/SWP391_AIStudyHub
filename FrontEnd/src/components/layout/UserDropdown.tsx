import { motion } from 'framer-motion'
import { User, Settings, LogOut, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { authService } from '@/features/auth/services/authService'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

interface UserDropdownProps {
  onClose: () => void
  onLogoutClick?: () => void
  onChangeUserClick?: () => void
}

export function UserDropdown({ onClose, onLogoutClick, onChangeUserClick }: UserDropdownProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { profile } = useProfileStore()
  const toast = useToast()
  const { t } = useTranslation()

  async function handleLogout() {
    try {
      await authService.logout()
    } catch (e) {
      console.error(e)
    }
    logout()
    toast.success(t.toasts.logoutSuccess || 'Logged out successfully')
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
      className="absolute right-0 top-[52px] w-64 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 py-2 shadow-xl z-50 select-none"
      role="menu"
    >
      <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E8EEFF] dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-800 overflow-hidden">
          <img src={profile.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" className="w-8 h-8 object-cover rounded-full" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-bold text-foreground dark:text-slate-200 truncate leading-snug">{profile.name}</p>
            {user?.role !== 'admin' && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider leading-none shadow-2xs border shrink-0 ${
                user?.plan === 'pro' 
                  ? 'bg-blue-50 text-blue-600 border-blue-200/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/30' 
                  : user?.plan === 'institutional'
                    ? 'bg-purple-50 text-purple-600 border-purple-200/20 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/30'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}>
                {user?.plan === 'pro' ? 'PRO' : user?.plan === 'institutional' ? 'INST' : 'FREE'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted dark:text-slate-500 truncate leading-snug mt-0.5">{user?.email ?? 'alex@example.com'}</p>
        </div>
      </div>
      
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer font-medium"
        onClick={() => {
          if (onChangeUserClick) onChangeUserClick()
          onClose()
        }}
        role="menuitem"
      >
        <Users className="size-4 text-muted dark:text-slate-500" />
        {t.userMenu?.changeUser || 'Change User'}
      </button>

      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer font-medium"
        onClick={() => handleNavigate('/dashboard/profile')}
        role="menuitem"
      >
        <User className="size-4 text-muted dark:text-slate-500" />
        {t.header.profile}
      </button>
      
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer font-medium"
        onClick={() => handleNavigate('/dashboard/settings')}
        role="menuitem"
      >
        <Settings className="size-4 text-slate-400 dark:text-slate-500" />
        {t.sidebar.settings}
      </button>
      
      <div className="mt-1 border-t border-slate-200 dark:border-slate-800 pt-1">
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-semibold cursor-pointer"
          onClick={onLogoutClick || handleLogout}
          role="menuitem"
        >
          <LogOut className="size-4 text-rose-600 dark:text-rose-400" />
          {t.sidebar.logout}
        </button>
      </div>
    </motion.div>
  )
}

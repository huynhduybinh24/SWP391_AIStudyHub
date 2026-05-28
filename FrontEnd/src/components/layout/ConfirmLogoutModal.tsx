import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/features/auth/services/authService'
import { useToast } from '@/components/ui/Toast'
import { LogOut } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ConfirmLogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfirmLogoutModal({ isOpen, onClose }: ConfirmLogoutModalProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const toast = useToast()
  const { t } = useTranslation()

  async function handleConfirmLogout() {
    try {
      await authService.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    logout()
    toast.success(t.toasts.logoutSuccess || 'Logged out successfully')
    onClose()
    navigate('/')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.sidebar.logoutConfirmTitle || "Confirm Log Out"}
      description={t.sidebar.logoutConfirmDesc || "Are you sure you want to sign out of your LumiEdu account?"}
      className="max-w-md"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
          <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 shrink-0">
            <LogOut className="size-5" />
          </div>
          <p className="text-xs text-rose-800 dark:text-rose-350 leading-relaxed font-medium">
            {t.sidebar.logoutWarning || "You will need to sign in again to access your saved summaries, cloud documents, and custom study plans."}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} className="rounded-xl border border-border dark:border-slate-800 cursor-pointer">
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmLogout}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold cursor-pointer"
          >
            {t.sidebar.logoutConfirmTitle || "Confirm Log Out"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

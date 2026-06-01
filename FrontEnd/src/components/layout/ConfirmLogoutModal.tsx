import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/features/auth/services/authService'
import { useToast } from '@/components/ui/Toast'
import { LogOut, Shield } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ConfirmLogoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfirmLogoutModal({ isOpen, onClose }: ConfirmLogoutModalProps) {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const authUser = useAuthStore((s) => s.user)
  const toast = useToast()
  const { t, language } = useTranslation()

  const [showSavePreferencePrompt, setShowSavePreferencePrompt] = useState(false)

  async function handleActualLogout() {
    try {
      await authService.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    logout()
    toast.success(t.toasts.logoutSuccess || 'Logged out successfully')
    setShowSavePreferencePrompt(false)
    onClose()
    navigate('/')
  }

  const handleLogoutWithPreference = (remember: boolean) => {
    if (authUser) {
      try {
        const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
        let list = stored ? JSON.parse(stored) : []
        if (!Array.isArray(list)) list = []
        
        // Find existing password fallback
        let existingPassword = authUser.email
        const savedUsersStr = localStorage.getItem('aiStudyHubUsers')
        if (savedUsersStr) {
          try {
            const users = JSON.parse(savedUsersStr)
            const found = users.find((u: any) => u.email?.toLowerCase() === authUser.email?.toLowerCase())
            if (found && found.password) {
              existingPassword = found.password
            }
          } catch (e) {
            console.error(e)
          }
        }

        const index = list.findIndex((u: any) => u.email?.toLowerCase() === authUser.email?.toLowerCase())
        
        if (index !== -1) {
          list[index].remembered = remember
          list[index].askedRemember = true
          if (!list[index].password) {
            list[index].password = existingPassword
          }
        } else {
          // Add if not present
          list.push({
            id: `u-${authUser.id || Math.random().toString(36).substr(2, 9)}`,
            name: authUser.name,
            email: authUser.email,
            role: authUser.role === 'admin' ? 'admin' : authUser.role === 'teacher' || authUser.role === 'instructor' ? 'instructor' : 'student',
            plan: (authUser.plan || 'free').toUpperCase() as 'FREE' | 'PRO',
            initials: authUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
            description: `Tài khoản đăng nhập hệ thống ngày ${new Date().toLocaleDateString('vi-VN')}`,
            remembered: remember,
            askedRemember: true,
            password: existingPassword
          })
        }
        localStorage.setItem('aiStudyHubLoggedInAccounts', JSON.stringify(list))
      } catch (e) {
        console.error('Failed to save logout switching preference:', e)
      }
    }
    handleActualLogout()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setShowSavePreferencePrompt(false)
        onClose()
      }}
      title={
        showSavePreferencePrompt
          ? (language === 'vi' ? 'Lưu tùy chọn chuyển nhanh' : 'Save Switching Preference')
          : (t.sidebar.logoutConfirmTitle || "Confirm Log Out")
      }
      description={
        showSavePreferencePrompt
          ? (language === 'vi' ? 'Bảo mật thông tin đăng nhập.' : 'Secure switcher credentials.')
          : (t.sidebar.logoutConfirmDesc || "Are you sure you want to sign out of your LumiEdu account?")
      }
      className="max-w-md"
    >
      <div className="space-y-6">
        {showSavePreferencePrompt ? (
          <div className="space-y-6 text-center py-4 flex flex-col items-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 animate-bounce">
              <Shield className="size-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {language === 'vi' ? 'Lưu Thông Tin Đăng Nhập Nhanh?' : 'Save Fast Switch Info?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                {language === 'vi'
                  ? `Bạn có muốn lưu thông tin tài khoản của ${authUser?.name} trên thiết bị này? Nếu chọn đồng ý, lần tới chuyển đổi tài khoản bằng Change User sẽ không cần nhập lại mật khẩu.`
                  : `Would you like to save ${authUser?.name}'s account credentials on this device? If agreed, switching back using the Change User switcher will not require typing the password.`}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="primary"
                onClick={() => handleLogoutWithPreference(true)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer py-2.5 shadow-md shadow-blue-500/10 text-xs"
              >
                {language === 'vi' ? 'Lưu tài khoản (Chuyển nhanh không mật khẩu)' : 'Save Account (Fast Switch Without Password)'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleLogoutWithPreference(false)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer py-2.5 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50"
              >
                {language === 'vi' ? 'Không lưu (Bắt buộc nhập mật khẩu)' : 'Don\'t Save (Always Prompt Password)'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSavePreferencePrompt(false)}
                className="w-full rounded-xl border border-transparent cursor-pointer py-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-655"
              >
                {language === 'vi' ? 'Hủy đăng xuất' : 'Cancel Logout'}
              </Button>
            </div>
          </div>
        ) : (
          <>
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
                onClick={() => {
                  const isAdmin = authUser?.role?.toLowerCase() === 'admin'
                  if (isAdmin) {
                    handleLogoutWithPreference(false)
                    return
                  }

                  // Check if this account is already remembered or already asked
                  const stored = localStorage.getItem('aiStudyHubLoggedInAccounts')
                  let isAlreadyAskedOrRemembered = false
                  let rememberedPreference = false
                  if (stored && authUser) {
                    try {
                      const list = JSON.parse(stored)
                      const found = list.find((u: any) => u.email?.toLowerCase() === authUser.email?.toLowerCase())
                      if (found) {
                        if (found.remembered === true || found.askedRemember === true) {
                          isAlreadyAskedOrRemembered = true
                          rememberedPreference = found.remembered === true
                        }
                      }
                    } catch (e) {}
                  }

                  if (isAlreadyAskedOrRemembered) {
                    handleLogoutWithPreference(rememberedPreference)
                  } else {
                    setShowSavePreferencePrompt(true)
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold cursor-pointer"
              >
                {t.sidebar.logoutConfirmTitle || "Confirm Log Out"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

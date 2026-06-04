import { useState, useEffect } from 'react'
import { User, Check, HelpCircle, X } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/features/profile/stores/profileStore'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'
import { Language } from '@/locales'
import { AvatarUploader } from './AvatarUploader'

const accountSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  language: z.string().min(1, 'Please select a language'),
  timezone: z.string().min(1, 'Please select a timezone'),
})

type AccountFormValues = z.infer<typeof accountSchema>

export function AccountSettingsCard() {
  const { t, language, setLanguage } = useTranslation()
  const { account, updateAccount } = useSettingsStore()
  const currentUser = useAuthStore((state) => state.user)
  const currentEmail = currentUser?.email ?? 'student@university.edu'
  const { profile, updateProfile } = useProfileStore()
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingData, setPendingData] = useState<AccountFormValues | null>(null)
  const toast = useToast()

  // ── Avatar State ───────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => {
    // Load from localStorage first, fallback to profileStore
    const stored = localStorage.getItem('aiStudyHubUserAvatar')
    if (stored) return stored
    // If profileStore has a non-default avatar, use that
    if (profile.avatarUrl && profile.avatarUrl !== '/logo.png') return profile.avatarUrl
    return null
  })
  const [hasCustomAvatar, setHasCustomAvatar] = useState(() => {
    return !!localStorage.getItem('aiStudyHubUserAvatar') ||
      (!!profile.avatarUrl && profile.avatarUrl !== '/logo.png')
  })
  const [pendingAvatarRemoval, setPendingAvatarRemoval] = useState(false)
  const [isAvatarDirty, setIsAvatarDirty] = useState(false)

  const handleAvatarChange = (dataUrl: string) => {
    setAvatarPreview(dataUrl)
    setHasCustomAvatar(true)
    setPendingAvatarRemoval(false)
    setIsAvatarDirty(true)
  }

  const handleAvatarRemove = () => {
    setAvatarPreview(null)
    setHasCustomAvatar(false)
    setPendingAvatarRemoval(true)
    setIsAvatarDirty(true)
  }

  const initialLanguage = language

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: currentEmail,
      name: account.name,
      language: initialLanguage,
      timezone: account.timezone,
    },
  })

  // Keep form inputs reactive to external state changes
  useEffect(() => {
    setValue('email', currentEmail)
  }, [currentEmail, setValue])

  useEffect(() => {
    setValue('language', language)
  }, [language, setValue])

  const onSubmit = (data: AccountFormValues) => {
    setPendingData(data)
    setShowConfirmModal(true)
  }

  const handleConfirmSave = () => {
    if (!pendingData) return
    try {
      const lang = pendingData.language as Language
      setLanguage(lang)
      updateAccount({
        name: pendingData.name,
        language: lang,
        timezone: pendingData.timezone,
      })

      // ── Persist Avatar ──────────────────────────────────────────────────
      if (isAvatarDirty) {
        if (pendingAvatarRemoval) {
          // Remove custom avatar
          try {
            localStorage.removeItem('aiStudyHubUserAvatar')
          } catch (e) {
            console.error('Error removing avatar from localStorage:', e)
          }
          updateProfile({ avatarUrl: '/logo.png' })
          setPendingAvatarRemoval(false)
        } else if (avatarPreview && avatarPreview.startsWith('data:image')) {
          // Save custom avatar
          try {
            localStorage.setItem('aiStudyHubUserAvatar', avatarPreview)
          } catch (e) {
            console.error('Error saving avatar to localStorage:', e)
            toast.error(language === 'vi' ? 'Không thể lưu ảnh đại diện do dung lượng lưu trữ đầy!' : 'Could not save avatar due to quota limits!')
          }
          updateProfile({ avatarUrl: avatarPreview })
        }
        setIsAvatarDirty(false)
      }

      // ── Persist Display Name ────────────────────────────────────────────
      if (pendingData.name) {
        try {
          localStorage.setItem('aiStudyHubDisplayName', pendingData.name)
        } catch (e) {
          console.error('Error saving display name to localStorage:', e)
        }
      }

      // Dispatch custom event so Header can react immediately
      window.dispatchEvent(new Event('aiStudyHubProfileUpdated'))

      toast.success(t.toasts.saved)
      setSaveSuccess(true)
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error: any) {
      console.error('Error inside handleConfirmSave:', error)
      const msg = error?.message || (language === 'vi' ? 'Đã xảy ra lỗi khi lưu cài đặt!' : 'An error occurred while saving settings!')
      toast.error(msg)
    } finally {
      // Force modal closure and reset state
      setShowConfirmModal(false)
      setPendingData(null)
    }
  }

  return (
    <div className="rounded-2xl border border-[#dbe3f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
          <User className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">{t.settings.accountSettings}</h2>
      </div>

      {/* ── Avatar Section ── */}
      <AvatarUploader
        avatarPreview={avatarPreview}
        hasCustomAvatar={hasCustomAvatar}
        displayName={account.name}
        onAvatarChange={handleAvatarChange}
        onAvatarRemove={handleAvatarRemove}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Address & Display Name (Row 1) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground dark:text-slate-200">{t.settings.emailAddress}</label>
            <Input
              type="email"
              readOnly
              error={errors.email?.message}
              {...register('email')}
              className="bg-slate-50 dark:bg-slate-950 text-muted cursor-not-allowed border-border dark:border-slate-800"
            />
            <p className="text-xs text-muted dark:text-slate-400 mt-1">{t.settings.emailNotificationsSub}</p>
          </div>


          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground dark:text-slate-200">{t.settings.displayName}</label>
            <Input
              type="text"
              error={errors.name?.message}
              {...register('name')}
              className="bg-transparent dark:text-white border-border dark:border-slate-800"
            />
          </div>
        </div>

        {/* Language & Timezone (Row 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground dark:text-slate-200">{t.settings.language}</label>
            <Select
              error={errors.language?.message}
              {...register('language')}
              className="bg-transparent dark:text-white border-border dark:border-slate-800"
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground dark:text-slate-200">{t.settings.timezone}</label>
            <Select
              error={errors.timezone?.message}
              {...register('timezone')}
              className="bg-transparent dark:text-white border-border dark:border-slate-800"
            >
              <option value="Pacific Time (PT)">Pacific Time (PT)</option>
              <option value="Eastern Time (ET)">Eastern Time (ET)</option>
              <option value="Vietnam Time (ICT)">Vietnam Time (ICT)</option>
              <option value="Japan Time (JST)">Japan Time (JST)</option>
            </Select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60 dark:border-slate-800/80">
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400"
              >
                <Check className="size-4" />
                {t.settings.changesSaved}
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#2563eb] text-white hover:bg-[#2563eb]/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            {isSubmitting ? t.settings.saving : t.settings.saveChanges}
          </Button>
        </div>
      </form>

      {/* ── Confirmation Modal on Save ── */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[3px]"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-10 p-6"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg p-1.5 transition-colors"
              >
                <X className="size-4" />
              </button>

              {/* Modal Content */}
              <div className="flex gap-4 items-start">
                <div className="flex-none flex size-10 items-center justify-center rounded-full bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
                  <HelpCircle className="size-5" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold text-foreground dark:text-white">
                    {t.common.areYouSure}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-normal">
                    {pendingData?.language !== initialLanguage
                      ? (pendingData?.language === 'vi'
                        ? 'Bạn có chắc muốn cập nhật thông tin và đổi ngôn ngữ hiển thị sang Tiếng Việt không?'
                        : 'Are you sure you want to save changes and switch your display language to English?')
                      : (pendingData?.language === 'vi'
                        ? 'Bạn có chắc chắn muốn lưu lại các thay đổi thiết lập tài khoản này không?'
                        : 'Are you sure you want to save your updated account settings?')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 dark:border-slate-800/40 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-foreground dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSave}
                  className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors duration-200"
                >
                  {t.common.confirm}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

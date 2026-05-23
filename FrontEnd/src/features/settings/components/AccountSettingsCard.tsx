import { useState, useEffect } from 'react'
import { User, Check } from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
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

const accountSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  language: z.string().min(1, 'Please select a language'),
  timezone: z.string().min(1, 'Please select a timezone'),
})

type AccountFormValues = z.infer<typeof accountSchema>

export function AccountSettingsCard() {
  const { t, setLanguage } = useTranslation()
  const { account, updateAccount } = useSettingsStore()
  const currentUser = useAuthStore((state) => state.user)
  const currentEmail = currentUser?.email ?? 'student@university.edu'
  const [saveSuccess, setSaveSuccess] = useState(false)
  const toast = useToast()

  let initialLanguage = account.language
  if (initialLanguage === 'English (US)') initialLanguage = 'en'
  else if (initialLanguage === 'Vietnamese') initialLanguage = 'vi'
  else if (initialLanguage === 'Japanese') initialLanguage = 'ja'
  else if (initialLanguage === 'Korean') initialLanguage = 'ko'

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

  // Keep the email input reactive to auth state changes
  useEffect(() => {
    setValue('email', currentEmail)
  }, [currentEmail, setValue])

  const onSubmit = (data: AccountFormValues) => {
    const lang = data.language as Language
    setLanguage(lang)
    updateAccount({
      name: data.name,
      language: lang,
      timezone: data.timezone,
    })
    toast.success(t.toasts.saved)
    setSaveSuccess(true)
    setTimeout(() => {
      setSaveSuccess(false)
    }, 3000)
  }

  return (
    <div className="rounded-2xl border border-[#dbe3f0] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 dark:border-slate-800/80 pb-4 mb-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#E5EEFF] dark:bg-blue-950/50 text-[#2563EB]">
          <User className="size-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">{t.settings.accountSettings}</h2>
      </div>

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
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
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
    </div>
  )
}

import { useEffect } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Confirm password must match new password',
    path: ['confirmPassword'],
  })

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    reset,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Reset form when modal state changes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const onSubmit = async (data: ChangePasswordFormValues) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Password updated successfully', data)
    if (onSuccess) {
      onSuccess()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[3px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 dark:border-slate-800/80 px-6 py-4">
              <h2 className="text-lg font-bold text-foreground dark:text-white">Change Password</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white transition-colors"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </button>
            </div>

            {/* Content / Form */}
            <div className="p-6">
              {isSubmitSuccessful ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <CheckCircle className="size-14 text-green-500 animate-bounce" />
                  <h3 className="text-base font-bold text-foreground dark:text-white">Password Updated</h3>
                  <p className="text-xs text-muted dark:text-slate-400">
                    Your password has been changed successfully.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground dark:text-slate-350">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      error={errors.currentPassword?.message}
                      {...register('currentPassword')}
                      className="bg-transparent dark:text-white dark:border-slate-800"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground dark:text-slate-350">
                      New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      error={errors.newPassword?.message}
                      {...register('newPassword')}
                      className="bg-transparent dark:text-white dark:border-slate-800"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground dark:text-slate-350">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      error={errors.confirmPassword?.message}
                      {...register('confirmPassword')}
                      className="bg-transparent dark:text-white dark:border-slate-800"
                    />
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60 dark:border-slate-800/80 mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      className="px-4 py-2 border border-border dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-transparent dark:text-white transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors duration-200"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

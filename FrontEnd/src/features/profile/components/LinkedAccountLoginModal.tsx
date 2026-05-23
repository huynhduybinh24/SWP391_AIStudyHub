import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'
import { LinkedAccount } from './LinkedAccountCard'

interface LinkedAccountLoginModalProps {
  isOpen: boolean
  onClose: () => void
  account: LinkedAccount | null
  onConnectSuccess: (email: string) => void
}

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  allowAccess: z.boolean().refine((val) => val === true, {
    message: 'You must allow permissions to connect this account.',
  }),
})

type LoginFormInput = z.infer<typeof loginSchema>

export function LinkedAccountLoginModal({
  isOpen,
  onClose,
  account,
  onConnectSuccess,
}: LinkedAccountLoginModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      allowAccess: false,
    },
  })

  // Reset form when modal opens or account changes
  useEffect(() => {
    if (isOpen) {
      reset({
        email: '',
        password: '',
        allowAccess: false,
      })
    }
  }, [isOpen, reset])

  // Focus trap & ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      const emailInput = Array.from(focusableElements).find(
        (el) => el.getAttribute('name') === 'email'
      ) as HTMLElement
      if (emailInput) {
        emailInput.focus()
      } else {
        (focusableElements[0] as HTMLElement).focus()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && focusableElements) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!account) return null

  const onSubmit = async (data: LoginFormInput) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onConnectSuccess(data.email)
  }

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'google':
        return (
          <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )
      case 'microsoft':
        return (
          <svg className="size-6 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0h11v11H0z" fill="#F25022" />
            <path d="M12 0h11v11H12z" fill="#7FBA00" />
            <path d="M0 12h11v11H0z" fill="#00A4EF" />
            <path d="M12 12h11v11H12z" fill="#FFB900" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-450 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
                {getProviderIcon(account.id)}
              </div>
              <h2 id="login-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                Connect {account.provider} Account
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                Log in to link your {account.provider} account with AI Study Hub
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  Email Address
                </label>
                <Input
                  {...register('email')}
                  type="email"
                  error={errors.email?.message}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl"
                  placeholder={`yourname@${account.id === 'google' ? 'gmail.com' : 'outlook.com'}`}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  Password
                </label>
                <Input
                  {...register('password')}
                  type="password"
                  error={errors.password?.message}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="bg-[#f0f4ff]/50 border border-slate-200/50 hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:ring-offset-0 focus:ring-2 focus:ring-[#3155F6]/20 transition-all font-medium py-3 px-4 rounded-xl"
                  placeholder="Enter your password"
                />
              </div>

              {/* Checkbox Permission */}
              <div className="pt-2">
                <Checkbox
                  {...register('allowAccess')}
                  error={errors.allowAccess?.message}
                  id="allow-access-checkbox"
                  label={
                    <span className="text-xs text-slate-505 dark:text-slate-400 font-medium leading-relaxed">
                      Allow AI Study Hub to access my profile, files, and sync data
                    </span>
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#3155F6] text-white hover:bg-[#2563eb] px-6 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-md shadow-[#3155F6]/10 shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Login & Connect'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

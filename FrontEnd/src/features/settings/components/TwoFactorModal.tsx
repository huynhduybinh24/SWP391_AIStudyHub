import { useState, useEffect } from 'react'
import { X, CheckCircle, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../stores/settingsStore'
import { OTPInput } from './OTPInput'
import { QRCodeCard } from './QRCodeCard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/axios'

interface TwoFactorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TwoFactorModal({ isOpen, onClose }: TwoFactorModalProps) {
  const { toggleTwoFactor } = useSettingsStore()
  const { user, tokens, setSession } = useAuthStore()
  const toast = useToast()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [isLoadingSetup, setIsLoadingSetup] = useState(false)

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setOtp('')
      setError('')
      setIsVerifying(false)
      setIsSuccess(false)
      setQrCodeUrl('')
      setSecretKey('')
    }
  }, [isOpen])

  // Fetch real 2FA setup details from backend when open
  useEffect(() => {
    if (isOpen && user?.id) {
      setIsLoadingSetup(true)
      apiClient.post(`/users/${user.id}/2fa/setup`)
        .then((res) => {
          setQrCodeUrl(res.data.qrCodeUrl)
          setSecretKey(res.data.secret)
        })
        .catch((err) => {
          setError(err.message || 'Failed to initialize 2FA setup')
        })
        .finally(() => {
          setIsLoadingSetup(false)
        })
    }
  }, [isOpen, user?.id])

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

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }
    setError('')
    setIsVerifying(true)

    try {
      await apiClient.post(`/users/${user?.id}/2fa/enable`, { code: otp })
      
      // Update session locally to reflect enabled 2FA
      if (user && tokens) {
        setSession({ ...user, twoFactorEnabled: true }, tokens)
      }
      
      toggleTwoFactor()
      toast.success('Two-factor authentication enabled')
      setIsSuccess(true)
      
      // Delay before closing
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Invalid authenticator code. Please try again.')
    } finally {
      setIsVerifying(false)
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
            className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 dark:border-slate-800/80 px-6 py-4">
              <span className="sr-only">Two-Factor Authentication Setup</span>
              <div className="w-full flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </div>

            {/* Content / Scrollable Steps */}
            <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <CheckCircle className="size-16 text-green-500 animate-bounce" />
                  <h3 className="text-lg font-bold text-foreground dark:text-white">2FA Setup Successful</h3>
                  <p className="text-sm text-muted dark:text-slate-400 max-w-xs">
                    Two-Factor Authentication is now enabled for your account. Use your authenticator app for future sign-ins.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Top Security Icon & Header info */}
                  <div className="flex flex-col items-center text-center space-y-2 mb-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#E5EEFF] dark:bg-blue-950/40 text-[#2563EB]">
                      <Smartphone className="size-6" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground dark:text-white">
                      Enable Two-Factor Authentication
                    </h2>
                    <p className="text-xs text-muted dark:text-slate-400 max-w-[320px]">
                      Follow these steps to set up 2FA for your account.
                    </p>
                  </div>

                  {/* Steps List */}
                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="flex-none">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-white text-xs font-bold">
                          1
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-foreground dark:text-slate-200">
                          Install Authenticator App
                        </h4>
                        <p className="text-xs text-muted dark:text-slate-400 leading-normal">
                          Install an authenticator app like Google Authenticator or Authy.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="flex-none">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-white text-xs font-bold">
                          2
                        </span>
                      </div>
                      <div className="space-y-2 flex-grow">
                        <h4 className="text-sm font-semibold text-foreground dark:text-slate-200">
                          Scan the QR Code
                        </h4>
                        <p className="text-xs text-muted dark:text-slate-400 leading-normal">
                          Scan the QR code below with your authenticator app.
                        </p>
                        
                        {/* QR Code graphic */}
                        <QRCodeCard qrCodeUrl={qrCodeUrl} secretKey={secretKey} isLoading={isLoadingSetup} />
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="flex-none">
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#2563EB] text-white text-xs font-bold">
                          3
                        </span>
                      </div>
                      <div className="space-y-3 flex-grow">
                        <h4 className="text-sm font-semibold text-foreground dark:text-slate-200">
                          Enter Authenticator Code
                        </h4>
                        <p className="text-xs text-muted dark:text-slate-400 leading-normal">
                          Enter the 6-digit code generated by your app.
                        </p>

                        {/* 6-box input */}
                        <div className="py-2">
                          <OTPInput value={otp} onChange={setOtp} error={error} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions inside form body for scroll support */}
                  <div className="flex items-center justify-between gap-3 pt-6 border-t border-border/60 dark:border-slate-800/80 mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerify}
                      className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors duration-200"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LinkedAccount } from './LinkedAccountCard'
import { useTranslation } from '@/context/LanguageContext'

interface LinkedAccountManageModalProps {
  isOpen: boolean
  onClose: () => void
  account: LinkedAccount | null
  onSync: () => Promise<void>
  onDisconnectClick: () => void
}

export function LinkedAccountManageModal({
  isOpen,
  onClose,
  account,
  onSync,
  onDisconnectClick,
}: LinkedAccountManageModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { t } = useTranslation()

  // Focus trap & ESC key handler
  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus()
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

  const handleSyncNow = async () => {
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
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

  const translatePermission = (perm: string) => {
    switch (perm) {
      case 'Read profile':
        return t.profile.readProfilePerm
      case 'Access files':
        return t.profile.accessFilesPerm
      case 'Sync data':
        return t.profile.syncDataPerm
      default:
        return perm
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
            aria-labelledby="manage-modal-title"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-450 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header info */}
            <div className="flex flex-col items-center text-center mt-2 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 mb-4">
                {getProviderIcon(account.id)}
              </div>
              <h2 id="manage-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                {t.profile.manageModalTitle(account.provider)}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-2.5 py-0.5 text-xs font-bold">
                  {t.profile.connectedStatus}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between text-sm text-slate-900 dark:text-white">
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  {t.profile.connectedEmailLabel}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 select-all">{account.email}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-900 dark:text-white">
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  {t.profile.connectionDateLabel}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {account.connectedAt || t.profile.notAvailable}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-900 dark:text-white">
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  {t.profile.lastSyncedLabel}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {account.lastSync || t.profile.neverSynced}
                </span>
              </div>

              {/* Permissions */}
              <div className="pt-2">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block mb-2">
                  {t.profile.permissionsGrantedLabel}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {account.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350"
                    >
                      {translatePermission(perm)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6 gap-3">
              <button
                type="button"
                onClick={onDisconnectClick}
                className="bg-red-55 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {t.profile.disconnectBtn}
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-505 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
                >
                  {t.common.close}
                </button>
                <Button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="bg-[#3155F6] text-white hover:bg-[#2563eb] px-5 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md shadow-[#3155F6]/10 shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      {t.profile.syncingBtn}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="size-3.5" />
                      {t.profile.syncNowBtn}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ExpressCheckoutModalProps {
  provider: 'apple' | 'google' | 'paypal'
  amount: number
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ExpressCheckoutModal({
  provider,
  amount,
  open,
  onClose,
  onConfirm,
}: ExpressCheckoutModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  const providerConfigs = {
    apple: {
      title: 'Apple Pay',
      color: 'bg-black text-white dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100',
      confirmText: `${t.upgrade.confirmPayment} (Apple Pay)`,
      infoLabel: t.upgrade.paymentMethodLabel,
      infoValue: t.upgrade.deviceWalletApplePay,
      icon: (
        <svg className="size-8 fill-current text-slate-900 dark:text-white" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.57 2.94-1.39z" />
        </svg>
      ),
    },
    google: {
      title: 'Google Pay',
      color: 'bg-black text-white dark:bg-white dark:text-black hover:bg-slate-900 dark:hover:bg-slate-100',
      confirmText: `${t.upgrade.confirmPayment} (Google Pay)`,
      infoLabel: t.upgrade.paymentMethodLabel,
      infoValue: 'alex.rivera@example.com',
      icon: (
        <div className="flex items-center gap-1.5 select-none font-bold">
          <span className="text-3xl font-extrabold text-[#4285F4]">G</span>
          <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">Pay</span>
        </div>
      ),
    },
    paypal: {
      title: 'PayPal',
      color: 'bg-[#ffc439] hover:bg-[#f2b522] text-[#003087] shadow-sm shadow-[#ffc439]/15',
      confirmText: `${t.upgrade.confirmPayment} (PayPal)`,
      infoLabel: t.upgrade.paymentMethodLabel,
      infoValue: 'alex.rivera@example.com',
      icon: (
        <span className="text-2xl italic font-black tracking-tight text-[#003087] select-none">
          PayPal
        </span>
      ),
    },
  }

  const config = providerConfigs[provider]

  useEffect(() => {
    if (!open) {
      setIsConfirming(false)
    }
  }, [open])

  const handleConfirmClick = async () => {
    setIsConfirming(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onConfirm()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        } else if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'

      // Focus first interactive element inside modal
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'a[href], input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          if (focusable.length > 0) {
            ;(focusable[0] as HTMLElement).focus()
          } else {
            modalRef.current.focus()
          }
        }
      }, 50)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!config) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Content Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl select-none z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="express-modal-title"
          >
            {/* Corner Close Button */}
            <button
              onClick={onClose}
              disabled={isConfirming}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* Provider Logo Header */}
            <div className="flex flex-col items-center justify-center mt-4 mb-6">
              <div className="h-16 flex items-center justify-center mb-2">
                {config.icon}
              </div>
              <h2
                id="express-modal-title"
                className="text-xl font-extrabold text-slate-900 dark:text-white"
              >
                {t.upgrade.expressCheckout} ({config.title})
              </h2>
            </div>

            {/* Billing details info box */}
            <div className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 mb-6 space-y-3.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-550 dark:text-slate-400">
                <span>{t.upgrade.planSelected}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{t.upgrade.proPlanMonthly}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex justify-between items-center text-xs font-semibold text-slate-550 dark:text-slate-400">
                <span>{config.infoLabel}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{config.infoValue}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800" />
              <div className="flex justify-between items-center text-xs font-semibold text-slate-550 dark:text-slate-400">
                <span>{t.upgrade.totalAmount}</span>
                <span className="text-[#2563eb] dark:text-blue-400 font-extrabold text-base">
                  ${amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmClick}
                disabled={isConfirming}
                className={`w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] shadow-sm disabled:opacity-75 disabled:pointer-events-none ${config.color}`}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t.upgrade.processing}
                  </>
                ) : (
                  config.confirmText
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isConfirming}
                className="w-full h-12 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {t.common.cancel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Download, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/context/LanguageContext'

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  planName?: string
  transactionId?: string
  amount?: string
  paymentMethod?: string
}

export function PaymentSuccessModal({
  isOpen,
  onClose,
  planName = 'Pro Plan (Annual)',
  transactionId = '#ASH-9284751',
  amount = '$132.00',
  paymentMethod = 'Credit Card',
}: PaymentSuccessModalProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useTranslation()

  const displayPlanName = planName === 'Pro Plan (Annual)' ? t.upgrade.proPlanAnnual : planName
  const displayPaymentMethod = paymentMethod === 'Credit Card' ? t.upgrade.creditCard : paymentMethod

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleGoToDashboard = () => {
    onClose()
    navigate('/dashboard')
  }

  const handleDownloadReceipt = (e: React.MouseEvent) => {
    e.preventDefault()
    // Simulated receipt generation / download
    toast.success(t.upgrade.receiptDownloaded || 'Receipt downloaded')
    const filename = `receipt_${transactionId.replace('#', '')}.txt`
    const receiptText = `
========================================
       ${t.upgrade.receiptHeader || 'LUMIEDU RECEIPT'}
========================================
${t.upgrade.transactionIdLabel || 'Transaction ID'}: ${transactionId}
${t.upgrade.dateLabel || 'Date'}: ${new Date().toLocaleDateString()}
${t.upgrade.planUpgradedLabel || 'Plan upgraded'}: ${displayPlanName}
${t.upgrade.paymentMethodLabel || 'Payment Method'}: ${displayPaymentMethod}
${t.upgrade.totalPaidLabel || 'Total Paid'}: ${amount}
${t.upgrade.statusLabel || 'Status'}: ${t.upgrade.statusValue || 'SUCCESSFUL'}
========================================
${t.upgrade.thankYou || 'Thank you for your purchase!'}
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.25 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-8 md:p-10 shadow-2xl shadow-slate-900/10 text-center flex flex-col items-center select-none z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="size-4" />
            </button>

            {/* Green Circular Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mb-6"
            >
              <Check className="size-8 text-green-600 dark:text-green-400" strokeWidth={3} />
            </motion.div>

            {/* Title */}
            <h2
              id="success-modal-title"
              className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2"
            >
              {t.upgrade.paymentSuccess}
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-sm">
              {t.upgrade.welcomePro}
            </p>

            {/* Info Table Box */}
            <div className="w-full bg-slate-50/80 dark:bg-slate-950/50 rounded-2xl p-5 mb-8 border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{t.upgrade.planSelected}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{displayPlanName}</span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{t.upgrade.transactionIdLabel}</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                  {transactionId}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{t.upgrade.totalAmount}</span>
                <span className="text-[#2563eb] dark:text-blue-400 font-extrabold text-sm">
                  {amount}
                </span>
              </div>
              <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>{t.upgrade.paymentMethodLabel}</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {displayPaymentMethod}
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <button
              onClick={handleGoToDashboard}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center transition-all cursor-pointer shadow-md shadow-[#2563eb]/15 hover:shadow-lg hover:shadow-[#2563eb]/20 active:scale-[0.98]"
            >
              {t.upgrade.goToDashboard}
            </button>

            <a
              href="#"
              onClick={handleDownloadReceipt}
              className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5" />
              {t.upgrade.downloadReceipt}
            </a>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

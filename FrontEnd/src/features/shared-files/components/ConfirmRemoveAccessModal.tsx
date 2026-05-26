import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/context/LanguageContext'

interface ConfirmRemoveAccessModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  fileName: string
}

export function ConfirmRemoveAccessModal({
  isOpen,
  onClose,
  onConfirm,
  fileName
}: ConfirmRemoveAccessModalProps) {
  const { t, language } = useTranslation()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      // Focus on Cancel button by default
      const elementToFocus = (focusableElements[1] || focusableElements[0]) as HTMLElement
      elementToFocus?.focus()
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

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-remove-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex gap-4 items-start mb-5 text-left">
              <div className="flex size-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-955/40 text-red-600 dark:text-red-400 shrink-0">
                <AlertTriangle className="size-5.5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 id="confirm-remove-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {t.sharedFiles.removeAccess}?
                </h3>
                <p className="text-sm text-slate-550 dark:text-slate-400 font-semibold leading-relaxed">
                  {language === 'vi' ? `Bạn có chắc chắn muốn xóa quyền truy cập của "${fileName}"? Hành động này không thể hoàn tác.` : (language === 'ja' ? `「${fileName}」へのアクセス権を本当に削除しますか？この操作は取り消せません。` : (language === 'ko' ? `"${fileName}"에 대한 액세스 권한을 제거하시겠습니까? 이 작업은 되돌릴 수 없습니다.` : `Are you sure you want to remove access to "${fileName}"? This action cannot be undone.`))}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5 text-right">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-805 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-red-650 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-red-600/10 active:scale-[0.98] focus:outline-none border-none"
              >
                {t.sharedFiles.removeBtn}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmRemoveAccessModal

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Disable Two-Factor Authentication?',
  description = 'Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.',
  confirmText = 'Disable 2FA',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape key close and focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        )
        if (focusableElements && focusableElements.length > 0) {
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
    }

    window.addEventListener('keydown', handleKeyDown)
    
    // Focus the cancel button (safer option) by default
    const focusableElements = modalRef.current?.querySelectorAll('button')
    if (focusableElements && focusableElements.length > 0) {
      const cancelButton = Array.from(focusableElements).find(
        (el) => el.textContent === cancelText || el.getAttribute('aria-label') === 'Close'
      )
      if (cancelButton) {
        cancelButton.focus()
      } else {
        focusableElements[0].focus()
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, cancelText])

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
            className="fixed inset-0 bg-black/40 backdrop-blur-[3px]"
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
          >
            {/* Header / Close button */}
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-muted hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-foreground dark:hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex gap-4">
                <div className="flex-none flex size-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-955 text-red-600">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="space-y-2">
                  <h3 id="confirm-modal-title" className="text-base font-bold text-foreground dark:text-white">
                    {title}
                  </h3>
                  <p id="confirm-modal-desc" className="text-sm text-muted dark:text-slate-400 leading-normal">
                    {description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 dark:border-slate-800/40 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  {cancelText}
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => {
                    onConfirm()
                    onClose()
                  }}
                  className="px-4 py-2 text-xs font-semibold"
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

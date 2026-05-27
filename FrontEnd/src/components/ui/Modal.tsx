import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus the modal or the first focusable element inside it when it opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
          if (focusable.length > 0) {
            ;(focusable[0] as HTMLElement).focus()
          } else {
            modalRef.current.focus()
          }
        }
      }, 50)
    }
  }, [isOpen])

  // Keydown and body scroll lock handlers
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]'
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

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      aria-label="Modal backdrop"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-slate-900 border border-slate-200 shadow-xl focus:outline-none dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 pb-4">
          <div>
            {title && (
              <h2 id="modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-desc" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 -mt-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6 text-slate-900 dark:text-slate-100">{children}</div>
      </div>
    </div>
  )
}


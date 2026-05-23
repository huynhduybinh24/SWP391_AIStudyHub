import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Mail } from 'lucide-react'

export interface Collaborator {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Editor' | 'View Only'
  avatarUrl?: string
}

interface CollaboratorsModalProps {
  isOpen: boolean
  onClose: () => void
  collaborators: Collaborator[]
}

export function CollaboratorsModal({ isOpen, onClose, collaborators }: CollaboratorsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b1c30]/40 dark:bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:border dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collaborators-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Users className="size-5.5" />
              </div>
              <div>
                <h3 id="collaborators-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Active Collaborators ({collaborators.length})
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  People collaborating on your shared workspace files
                </p>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/40 hover:border-slate-200 dark:hover:border-slate-700/80 transition-all duration-200 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-blue-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-blue-600 text-sm">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                      ) : (
                        c.name.split(' ').map((n) => n[0]).join('')
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate leading-snug">
                        {c.name}
                      </h4>
                      <p className="text-xs text-slate-405 dark:text-slate-500 font-medium flex items-center gap-1 truncate mt-0.5">
                        <Mail className="size-3 shrink-0" />
                        {c.email}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    c.role === 'Owner'
                      ? 'bg-blue-100 text-blue-755 dark:bg-blue-950/40 dark:text-blue-400'
                      : c.role === 'Editor'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-350'
                  }`}>
                    {c.role}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-5 border-t border-slate-100 dark:border-slate-800/60 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
export default CollaboratorsModal

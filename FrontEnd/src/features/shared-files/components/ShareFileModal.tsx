import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2, Mail, Shield } from 'lucide-react'

interface ShareFileModalProps {
  isOpen: boolean
  onClose: () => void
  onShare: (email: string, permission: 'Editor' | 'View Only') => void
  fileName: string
}

export function ShareFileModal({
  isOpen,
  onClose,
  onShare,
  fileName
}: ShareFileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'Editor' | 'View Only'>('View Only')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setPermission('View Only')
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      // Focus on the email input first
      const inputEl = modalRef.current?.querySelector('input')
      if (inputEl) {
        inputEl.focus()
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

  const validateEmail = (val: string) => {
    const trimmed = val.trim()
    if (!trimmed) {
      return 'Email is required'
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(trimmed)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) {
      setError(err)
      return
    }

    onShare(email.trim(), permission)
    onClose()
  }

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
            className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex gap-3.5 items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Share2 className="size-5.5" />
              </div>
              <div>
                <h3 id="share-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Share Document
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                  Invite collaborators to view or edit this file
                </p>
              </div>
            </div>

            <div className="mb-4 p-3.5 bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-450 dark:text-slate-500 block mb-1">
                Sharing File
              </span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate" title={fileName}>
                {fileName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="share-email" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Recipient Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 size-4.5 text-slate-400 dark:text-slate-500" />
                  <input
                    id="share-email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (e.target.value.trim()) setError('')
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border ${
                      error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-500/80'
                    } rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none transition-colors shadow-sm`}
                    placeholder="name@example.com"
                    autoComplete="off"
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-semibold mt-2 animate-slideDown">
                    {error}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="share-permission" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Access Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-4 top-3.5 size-4.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <select
                    id="share-permission"
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="w-full bg-slate-55 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-sm font-semibold focus:outline-none focus:border-blue-500 dark:focus:border-blue-500/80 appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="View Only">View Only (Read & Download)</option>
                    <option value="Editor">Editor (Full edit & upload)</option>
                  </select>
                  <div className="absolute right-4 top-4.5 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-400 dark:border-t-slate-500 size-0" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98]"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default ShareFileModal

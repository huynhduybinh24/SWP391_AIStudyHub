import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Edit3 } from 'lucide-react'

interface RenameFileModalProps {
  isOpen: boolean
  onClose: () => void
  onRename: (newName: string) => void
  initialName: string
}

export function RenameFileModal({
  isOpen,
  onClose,
  onRename,
  initialName
}: RenameFileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [name, setName] = useState(initialName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(initialName)
      setError('')
    }
  }, [isOpen, initialName])

  useEffect(() => {
    if (!isOpen) return

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex="0"]'
    )
    if (focusableElements && focusableElements.length > 0) {
      const inputEl = modalRef.current?.querySelector('input')
      if (inputEl) {
        inputEl.focus()
        inputEl.select()
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('File name cannot be empty')
      return
    }
    onRename(trimmed)
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
            className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <Edit3 className="size-5.5" />
              </div>
              <div>
                <h3 id="rename-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Rename Resource
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Enter a new name for the selected shared item
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="rename-input" className="block text-xs font-bold text-slate-655 dark:text-slate-400 uppercase tracking-wider mb-2">
                  New Name
                </label>
                <input
                  id="rename-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (e.target.value.trim()) setError('')
                  }}
                  className={`w-full bg-slate-50 border border-slate-200 text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${
                    error ? 'border-red-500 focus:border-red-500 dark:border-red-500' : 'focus:border-blue-500 dark:focus:border-blue-500'
                  } rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors shadow-sm`}
                  placeholder="Enter name..."
                  autoComplete="off"
                />
                {error && (
                  <p className="text-xs text-red-500 dark:text-red-400 font-semibold mt-2 animate-slideDown">
                    {error}
                  </p>
                )}
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
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default RenameFileModal

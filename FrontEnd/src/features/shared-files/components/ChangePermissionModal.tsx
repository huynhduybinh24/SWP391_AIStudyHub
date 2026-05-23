import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, Eye, Edit2, MessageSquare } from 'lucide-react'

interface ChangePermissionModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdatePermission: (newPermission: 'Editor' | 'Commenter' | 'Viewer') => void
  fileName: string
  initialPermission: 'Editor' | 'Commenter' | 'Viewer' | 'Owner' | string
}

export function ChangePermissionModal({
  isOpen,
  onClose,
  onUpdatePermission,
  fileName,
  initialPermission
}: ChangePermissionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [permission, setPermission] = useState<'Editor' | 'Commenter' | 'Viewer'>('Viewer')

  useEffect(() => {
    if (isOpen) {
      if (initialPermission === 'Editor') {
        setPermission('Editor')
      } else if (initialPermission === 'Commenter') {
        setPermission('Commenter')
      } else {
        setPermission('Viewer')
      }
    }
  }, [isOpen, initialPermission])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdatePermission(permission)
    onClose()
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

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-title"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer focus:outline-none"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            <div className="flex gap-3.5 items-center mb-5 pb-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                <ShieldAlert className="size-5.5" />
              </div>
              <div className="text-left">
                <h3 id="permission-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Change Permission
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                  Update sharing rules and access privileges
                </p>
              </div>
            </div>

            <div className="mb-5 p-3.5 bg-slate-55/60 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/50 rounded-2xl text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-450 dark:text-slate-500 block mb-1">
                Resource Name
              </span>
              <p className="text-sm font-bold text-slate-850 dark:text-slate-200 truncate" title={fileName}>
                {fileName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {/* Editor Option */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  permission === 'Editor'
                    ? 'border-[#3155F6] bg-blue-50/20 dark:border-blue-500/80 dark:bg-blue-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                  <input
                    type="radio"
                    name="permission"
                    value="Editor"
                    checked={permission === 'Editor'}
                    onChange={() => setPermission('Editor')}
                    className="sr-only"
                  />
                  <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                    permission === 'Editor'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-[#3155F6] dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Edit2 className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Editor
                    </p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 leading-snug">
                      Collaborator can view, download, edit, and comment on this file.
                    </p>
                  </div>
                  <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                    permission === 'Editor'
                      ? 'border-[#3155F6] dark:border-blue-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {permission === 'Editor' && (
                      <div className="size-2.5 rounded-full bg-[#3155F6] dark:bg-blue-500" />
                    )}
                  </div>
                </label>

                {/* Commenter Option */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  permission === 'Commenter'
                    ? 'border-[#3155F6] bg-blue-50/20 dark:border-blue-500/80 dark:bg-blue-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                  <input
                    type="radio"
                    name="permission"
                    value="Commenter"
                    checked={permission === 'Commenter'}
                    onChange={() => setPermission('Commenter')}
                    className="sr-only"
                  />
                  <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                    permission === 'Commenter'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-[#3155F6] dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <MessageSquare className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Commenter
                    </p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 leading-snug">
                      Collaborator can view and add comments, but cannot edit this file.
                    </p>
                  </div>
                  <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                    permission === 'Commenter'
                      ? 'border-[#3155F6] dark:border-blue-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {permission === 'Commenter' && (
                      <div className="size-2.5 rounded-full bg-[#3155F6] dark:bg-blue-500" />
                    )}
                  </div>
                </label>

                {/* Viewer Option */}
                <label className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                  permission === 'Viewer'
                    ? 'border-[#3155F6] bg-blue-50/20 dark:border-blue-500/80 dark:bg-blue-950/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                  <input
                    type="radio"
                    name="permission"
                    value="Viewer"
                    checked={permission === 'Viewer'}
                    onChange={() => setPermission('Viewer')}
                    className="sr-only"
                  />
                  <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                    permission === 'Viewer'
                      ? 'bg-blue-100 dark:bg-blue-950/40 text-[#3155F6] dark:text-blue-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Eye className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Viewer
                    </p>
                    <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 leading-snug">
                      Collaborator can only view and download this file.
                    </p>
                  </div>
                  <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                    permission === 'Viewer'
                      ? 'border-[#3155F6] dark:border-blue-500'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {permission === 'Viewer' && (
                      <div className="size-2.5 rounded-full bg-[#3155F6] dark:bg-blue-500" />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-5 text-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-[0.98] focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#3155F6] hover:bg-[#2563eb] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-md shadow-[#3155F6]/10 active:scale-[0.98] focus:outline-none"
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

export default ChangePermissionModal

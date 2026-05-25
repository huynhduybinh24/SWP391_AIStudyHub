import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  onInviteSubmit: (email: string, role: 'Viewer' | 'Editor') => void
}

export function InviteModal({ isOpen, onClose, onInviteSubmit }: InviteModalProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'Viewer' | 'Editor'>('Viewer')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setEmail('')
      setRole('Viewer')
      setIsDropdownOpen(false)
    }
  }, [isOpen])

  // ESC Close listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      alert(t.validation.invalidEmail)
      return
    }

    onInviteSubmit(email.trim(), role)
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
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-[440px] overflow-visible rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-left"
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-6 text-slate-455 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="size-5" />
            </button>

            {/* Header */}
            <div className="flex gap-3.5 items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-955 text-[#3155F6] dark:text-blue-400 shrink-0">
                <Mail className="size-5.5" />
              </div>
              <div>
                <h3 id="invite-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                  {t.sharedFiles.invite}
                </h3>
                <p className="text-xs text-slate-455 dark:text-slate-500 font-semibold mt-0.5">
                  {t.sharedFiles.inviteDesc}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.sharedFiles.emailLabel}
                </label>
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 text-xs font-semibold placeholder-slate-400 text-slate-850 dark:text-slate-100 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t.sharedFiles.roleLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <span>{role === 'Editor' ? t.sharedFiles.roleEditor : t.sharedFiles.roleViewer}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl z-50 py-1.5 animate-fade-in">
                      {(['Viewer', 'Editor'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r)
                            setIsDropdownOpen(false)
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer",
                            role === r ? "text-blue-600 bg-blue-50/40 dark:text-blue-400 dark:bg-blue-955/20" : "text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <span>{r === 'Editor' ? t.sharedFiles.roleEditor : t.sharedFiles.roleViewer}</span>
                          {role === r && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-550 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <Button
                  type="submit"
                  disabled={!email.trim()}
                  className="bg-[#3155F6] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/10"
                >
                  {t.sharedFiles.sendInvite}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default InviteModal
